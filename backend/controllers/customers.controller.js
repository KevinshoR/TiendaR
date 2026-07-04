const pool = require('../config/db');

async function list(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM customers WHERE store_id = $1 ORDER BY created_at DESC',
      [req.user.store_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener los clientes' });
  }
}

async function create(req, res) {
  const { name, phone, email, document } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (store_id, name, phone, email, document)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.store_id, name.trim(), phone || null, email || null, document || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al crear el cliente' });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { name, phone, email, document, credit_limit } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });
  }

  try {
    const existing = await pool.query('SELECT * FROM customers WHERE id = $1 AND store_id = $2', [
      id,
      req.user.store_id,
    ]);
    const currentCustomer = existing.rows[0];
    if (!currentCustomer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const result = await pool.query(
      `UPDATE customers SET name = $1, phone = $2, email = $3, document = $4, credit_limit = $5
       WHERE id = $6 AND store_id = $7 RETURNING *`,
      [
        name.trim(),
        phone === undefined ? currentCustomer.phone : phone,
        email === undefined ? currentCustomer.email : email,
        document === undefined ? currentCustomer.document : document,
        credit_limit === undefined ? currentCustomer.credit_limit : credit_limit,
        id,
        req.user.store_id,
      ]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar el cliente' });
  }
}

module.exports = { list, create, update };
