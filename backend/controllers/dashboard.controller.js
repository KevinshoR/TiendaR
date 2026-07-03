const pool = require('../config/db');

async function getDashboard(req, res) {
  const storeId = req.user.store_id;
  try {
    const ventasHoyResult = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
       FROM sales WHERE store_id = $1 AND status != 'anulada' AND created_at::date = CURRENT_DATE`,
      [storeId]
    );

    const ventasMesResult = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
       FROM sales WHERE store_id = $1 AND status != 'anulada'
       AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`,
      [storeId]
    );

    const porCobrarResult = await pool.query(
      `SELECT COALESCE(SUM(total - paid_amount), 0) AS por_cobrar
       FROM sales WHERE store_id = $1 AND status = 'pendiente'`,
      [storeId]
    );

    const stockBajoResult = await pool.query(
      `SELECT id, name, stock, min_stock FROM products
       WHERE store_id = $1 AND active = true AND stock <= min_stock
       ORDER BY name`,
      [storeId]
    );

    const ultimasVentasResult = await pool.query(
      `SELECT s.id, s.type, s.status, s.subtotal, s.iva_total, s.total, s.paid_amount, s.due_date, s.created_at,
        c.name AS customer_name, u.name AS user_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS items_count
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       JOIN users u ON s.user_id = u.id
       WHERE s.store_id = $1
       ORDER BY s.created_at DESC
       LIMIT 5`,
      [storeId]
    );

    return res.json({
      ventasHoy: {
        total: Number(ventasHoyResult.rows[0].total),
        count: Number(ventasHoyResult.rows[0].count),
      },
      ventasMes: {
        total: Number(ventasMesResult.rows[0].total),
        count: Number(ventasMesResult.rows[0].count),
      },
      porCobrar: Number(porCobrarResult.rows[0].por_cobrar),
      stockBajo: stockBajoResult.rows,
      ultimasVentas: ultimasVentasResult.rows.map((row) => ({
        ...row,
        items_count: Number(row.items_count),
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener el dashboard' });
  }
}

module.exports = { getDashboard };
