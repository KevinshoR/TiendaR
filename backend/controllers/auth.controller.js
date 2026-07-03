const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, store_id: user.store_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

function storeResponse(store) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    iva_enabled: store.iva_enabled,
    iva_rate: store.iva_rate,
  };
}

function userResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    store_id: user.store_id,
  };
}

async function register(req, res) {
  const { storeName, name, email, password, phone } = req.body;

  if (!storeName || storeName.trim().length < 2) {
    return res.status(400).json({ message: 'El nombre de la tienda debe tener al menos 2 caracteres' });
  }
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'El nombre debe tener al menos 2 caracteres' });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'El correo electrónico no es válido' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      message: 'La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let slug = slugify(storeName);
    const existingSlug = await client.query('SELECT id FROM stores WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const storeResult = await client.query(
      `INSERT INTO stores (name, email, phone, slug) VALUES ($1, $2, $3, $4) RETURNING *`,
      [storeName.trim(), email.toLowerCase().trim(), phone || null, slug]
    );
    const store = storeResult.rows[0];

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (store_id, name, email, password, role) VALUES ($1, $2, $3, $4, 'owner') RETURNING *`,
      [store.id, name.trim(), email.toLowerCase().trim(), hashedPassword]
    );
    const user = userResult.rows[0];

    await client.query('COMMIT');

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: userResponse(user),
      store: storeResponse(store),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Error al registrar la tienda' });
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo electrónico y contraseña son obligatorios' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Tu cuenta fue desactivada' });
    }

    const storeResult = await pool.query('SELECT * FROM stores WHERE id = $1', [user.store_id]);
    const store = storeResult.rows[0];

    const token = signToken(user);
    return res.json({
      token,
      user: userResponse(user),
      store: storeResponse(store),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
}

async function me(req, res) {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1 AND store_id = $2', [
      req.user.id,
      req.user.store_id,
    ]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const storeResult = await pool.query('SELECT * FROM stores WHERE id = $1', [req.user.store_id]);
    const store = storeResult.rows[0];

    return res.json({ user: userResponse(user), store: storeResponse(store) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener la información de la cuenta' });
  }
}

module.exports = { register, login, me };
