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
        m.reference_id,
        pr.name AS product_name,
        u.name AS user_name,
        p.supplier AS purchase_supplier,
        p.total AS purchase_total,
        c.name AS sale_customer_name,
        s.customer_name_libre AS sale_customer_libre,
        s.total AS sale_total,
        s.type AS sale_type
      FROM inventory_movements m
      LEFT JOIN products pr ON pr.id = m.product_id
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN purchases p ON (m.type = 'entrada' AND m.reason = 'compra' AND p.id = m.reference_id)
      LEFT JOIN sales s ON ((m.type = 'venta' OR m.reason = 'anulación de venta') AND s.id = m.reference_id)
      LEFT JOIN customers c ON c.id = s.customer_id
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