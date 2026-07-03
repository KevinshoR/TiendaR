const bcrypt = require('bcryptjs');
const pool = require('../config/db');

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

function userResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    created_at: user.created_at,
  };
}

async function list(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, active, created_at FROM users WHERE store_id = $1 ORDER BY created_at DESC',
      [req.user.store_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
}

async function create(req, res) {
  const { name, email, password, role } = req.body;

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
  if (!['empleado', 'contador'].includes(role)) {
    return res.status(400).json({ message: 'El rol debe ser empleado o contador' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (store_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.store_id, name.trim(), email.toLowerCase().trim(), hashedPassword, role]
    );
    return res.status(201).json(userResponse(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Error al crear el usuario' });
  }
}

async function updateActive(req, res) {
  const { id } = req.params;
  const { active } = req.body;

  if (typeof active !== 'boolean') {
    return res.status(400).json({ message: 'El campo active debe ser booleano' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE id = $1 AND store_id = $2', [
      id,
      req.user.store_id,
    ]);
    const user = existing.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (user.role === 'owner' && active === false) {
      return res.status(400).json({ message: 'No se puede desactivar al propietario' });
    }

    const result = await pool.query(
      'UPDATE users SET active = $1 WHERE id = $2 AND store_id = $3 RETURNING *',
      [active, id, req.user.store_id]
    );
    return res.json(userResponse(result.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
}

module.exports = { list, create, updateActive };
