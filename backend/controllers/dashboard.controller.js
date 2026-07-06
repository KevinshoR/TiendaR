const pool = require('../config/db');

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

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
        COALESCE(c.name, s.customer_name_libre) AS customer_name, u.name AS user_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS items_count
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       JOIN users u ON s.user_id = u.id
       WHERE s.store_id = $1
       ORDER BY s.created_at DESC
       LIMIT 5`,
      [storeId]
    );

    const ventas7DiasResult = await pool.query(
      `SELECT gs::date AS fecha, COALESCE(SUM(s.total), 0) AS total
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') gs
       LEFT JOIN sales s ON s.store_id = $1 AND s.status != 'anulada' AND s.created_at::date = gs::date
       GROUP BY gs
       ORDER BY gs`,
      [storeId]
    );

    const topProductosResult = await pool.query(
      `SELECT p.name, SUM(si.quantity) AS cantidad
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.store_id = $1 AND s.status != 'anulada'
         AND date_trunc('month', s.created_at) = date_trunc('month', CURRENT_DATE)
       GROUP BY p.name
       ORDER BY cantidad DESC
       LIMIT 5`,
      [storeId]
    );

    const diaMasVentasResult = await pool.query(
      `SELECT created_at::date AS fecha, SUM(total) AS total
       FROM sales
       WHERE store_id = $1 AND status != 'anulada'
         AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
       GROUP BY created_at::date
       ORDER BY total DESC
       LIMIT 1`,
      [storeId]
    );

    const inversionMesResult = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM purchases
       WHERE store_id = $1 AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`,
      [storeId]
    );

    const gananciaResult = await pool.query(
      `SELECT p.id, p.name, SUM((si.unit_price - COALESCE(p.cost, 0)) * si.quantity) AS ganancia
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.store_id = $1 AND s.status != 'anulada'
         AND date_trunc('month', s.created_at) = date_trunc('month', CURRENT_DATE)
       GROUP BY p.id, p.name
       ORDER BY ganancia DESC`,
      [storeId]
    );

    const ventasUltimos7Dias = ventas7DiasResult.rows.map((row) => ({
      fecha: row.fecha,
      total: Number(row.total),
    }));

    const topProductos = topProductosResult.rows.map((row) => ({
      name: row.name,
      cantidad: Number(row.cantidad),
    }));

    const gananciaPorProducto = gananciaResult.rows.map((row) => ({
      name: row.name,
      ganancia: round2(Number(row.ganancia)),
    }));
    const inversionMes = Number(inversionMesResult.rows[0].total);
    const gananciaMes = round2(gananciaPorProducto.reduce((sum, row) => sum + row.ganancia, 0));
    const productoMasRentable = gananciaPorProducto[0] || null;
    const topGanancia = gananciaPorProducto.slice(0, 5);

    const payload = {
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
      ventasUltimos7Dias,
      topProductos,
      productoMasVendido: topProductos[0] || null,
      diaMasVentas: diaMasVentasResult.rows[0]
        ? { fecha: diaMasVentasResult.rows[0].fecha, total: Number(diaMasVentasResult.rows[0].total) }
        : null,
      inversionMes,
      gananciaMes,
      productoMasRentable,
      topGanancia,
    };

    if (req.user.role !== 'owner') {
      delete payload.inversionMes;
    }
    if (req.user.role === 'empleado') {
      delete payload.gananciaMes;
      delete payload.productoMasRentable;
      delete payload.topGanancia;
    }

    return res.json(payload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener el dashboard' });
  }
}

module.exports = { getDashboard };
