const pool = require('../config/db');

/**
 * GET /api/inventory-movements
 * Lista los últimos 500 movimientos de la tienda del token,
 * DESC por created_at, con nombre de producto y usuario.
 * Solo lectura — la tabla se llena sola desde compras y ventas.
 */
async function list(req, res) {
  try {
    const storeId = req.user.store_id;
    const query = `
      SELECT
        m.id,
        m.product_id,
        m.type,
        m.quantity,
        m.reason,
        m.created_at,
        m.user_id,
        pr.name AS product_name,
        u.name AS user_name
      FROM inventory_movements m
      LEFT JOIN products pr ON pr.id = m.product_id
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.store_id = $1
      ORDER BY m.created_at DESC
      LIMIT 500
    `;
    const { rows } = await pool.query(query, [storeId]);
    res.json(rows);
  } catch (err) {
    console.error('Error listando movimientos de inventario:', err);
    res.status(500).json({ message: 'Error listando movimientos' });
  }
}

module.exports = { list };