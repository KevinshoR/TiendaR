const pool = require('../config/db');

async function list(req, res) {
  try {
    const query = `
      SELECT e.id, e.category, e.description, e.amount, e.created_at, e.user_id,
        u.name AS user_name
      FROM expenses e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.store_id = $1
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [req.user.store_id]);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener los egresos' });
  }
}

function validateBody(body) {
  const { category, amount } = body;
  if (!category || !String(category).trim()) {
    return 'La categoría es obligatoria';
  }
  if (!(Number(amount) > 0)) {
    return 'El monto debe ser mayor a 0';
  }
  return null;
}

async function create(req, res) {
  const { category, description, amount } = req.body;

  const error = validateBody(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (store_id, user_id, category, description, amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.store_id, req.user.id, category, description || null, Number(amount)]
    );
    const expense = result.rows[0];

    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    expense.user_name = userResult.rows[0] ? userResult.rows[0].name : null;

    return res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al registrar el egreso' });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { category, description, amount } = req.body;

  const error = validateBody(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM expenses WHERE id = $1 AND store_id = $2',
      [id, req.user.store_id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Egreso no encontrado' });
    }

    const result = await pool.query(
      `UPDATE expenses SET category = $1, description = $2, amount = $3
       WHERE id = $4 AND store_id = $5 RETURNING *`,
      [category, description || null, Number(amount), id, req.user.store_id]
    );
    const expense = result.rows[0];

    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [expense.user_id]);
    expense.user_name = userResult.rows[0] ? userResult.rows[0].name : null;

    return res.json(expense);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar el egreso' });
  }
}

async function remove(req, res) {
  const { id } = req.params;

  try {
    const existing = await pool.query(
      'SELECT id FROM expenses WHERE id = $1 AND store_id = $2',
      [id, req.user.store_id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Egreso no encontrado' });
    }

    await pool.query('DELETE FROM expenses WHERE id = $1 AND store_id = $2', [id, req.user.store_id]);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al eliminar el egreso' });
  }
}

module.exports = { list, create, update, remove };
