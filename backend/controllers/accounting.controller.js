const pool = require('../config/db');

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function pct(numerador, denominador) {
  if (!denominador) return null;
  return round2((numerador / denominador) * 100);
}

function parseMonthParam(monthParam) {
  const now = new Date();
  if (!monthParam) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const match = /^(\d{4})-(\d{2})$/.exec(monthParam);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function windowFor(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

async function getTotals(storeId, startStr, endStr) {
  const ingresosResult = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS total FROM sales
     WHERE store_id = $1 AND status != 'anulada' AND created_at >= $2 AND created_at < $3`,
    [storeId, startStr, endStr]
  );
  const comprasResult = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS total FROM purchases
     WHERE store_id = $1 AND created_at >= $2 AND created_at < $3`,
    [storeId, startStr, endStr]
  );
  const gastosResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
     WHERE store_id = $1 AND created_at >= $2 AND created_at < $3`,
    [storeId, startStr, endStr]
  );
  const costoResult = await pool.query(
    `SELECT COALESCE(SUM(si.quantity * COALESCE(p.cost, 0)), 0) AS costo
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     JOIN products p ON si.product_id = p.id AND p.store_id = s.store_id
     WHERE s.store_id = $1 AND s.status != 'anulada' AND s.created_at >= $2 AND s.created_at < $3`,
    [storeId, startStr, endStr]
  );

  const ingresos = Number(ingresosResult.rows[0].total);
  const compras = Number(comprasResult.rows[0].total);
  const gastosOperativos = Number(gastosResult.rows[0].total);
  const costoVentas = Number(costoResult.rows[0].costo);
  const egresos = compras + gastosOperativos;
  const utilidadBruta = ingresos - costoVentas;
  const utilidadNeta = utilidadBruta - gastosOperativos;

  return { ingresos, compras, gastosOperativos, egresos, costoVentas, utilidadBruta, utilidadNeta };
}

async function overview(req, res) {
  const storeId = req.user.store_id;
  const parsed = parseMonthParam(req.query.month);

  if (!parsed) {
    return res.status(400).json({ message: 'Formato de mes inválido. Usa YYYY-MM' });
  }
  const { year, month } = parsed;

  try {
    const { start, end } = windowFor(year, month);
    const { start: prevStart, end: prevEnd } = windowFor(year, month - 1);

    const startStr = toISODate(start);
    const endStr = toISODate(end);
    const prevStartStr = toISODate(prevStart);
    const prevEndStr = toISODate(prevEnd);

    const [currentTotals, prevTotals] = await Promise.all([
      getTotals(storeId, startStr, endStr),
      getTotals(storeId, prevStartStr, prevEndStr),
    ]);

    const ingresosDetalleResult = await pool.query(
      `SELECT COUNT(*) AS cantidad,
          COALESCE(SUM(total) FILTER (WHERE type = 'contado'), 0) AS contado,
          COALESCE(SUM(total) FILTER (WHERE type = 'credito'), 0) AS credito
       FROM sales
       WHERE store_id = $1 AND status != 'anulada' AND created_at >= $2 AND created_at < $3`,
      [storeId, startStr, endStr]
    );

    const cobradoResult = await pool.query(
      `SELECT COALESCE(SUM(pay.amount), 0) AS cobrado
       FROM payments pay
       JOIN sales s ON pay.sale_id = s.id AND s.store_id = pay.store_id
       WHERE pay.store_id = $1 AND s.type = 'credito' AND s.status != 'anulada'
         AND s.created_at >= $2 AND s.created_at < $3`,
      [storeId, startStr, endStr]
    );

    const carteraResult = await pool.query(
      `SELECT COALESCE(SUM(total - paid_amount), 0) AS por_cobrar,
          COUNT(*) AS cuentas_pendientes,
          COALESCE(SUM(total - paid_amount) FILTER (WHERE due_date < CURRENT_DATE), 0) AS vencidas
       FROM sales
       WHERE store_id = $1 AND type = 'credito' AND status = 'pendiente'`,
      [storeId]
    );

    const gastosPorCategoriaResult = await pool.query(
      `SELECT COALESCE(category, 'Sin categoría') AS categoria, COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE store_id = $1 AND created_at >= $2 AND created_at < $3
       GROUP BY category
       ORDER BY total DESC`,
      [storeId, startStr, endStr]
    );

    const topProductosResult = await pool.query(
      `SELECT p.name AS nombre, SUM((si.unit_price - COALESCE(p.cost, 0)) * si.quantity) AS ganancia
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id AND p.store_id = s.store_id
       WHERE s.store_id = $1 AND s.status != 'anulada' AND s.created_at >= $2 AND s.created_at < $3
       GROUP BY p.id, p.name
       ORDER BY ganancia DESC
       LIMIT 5`,
      [storeId, startStr, endStr]
    );

    const cantidad = Number(ingresosDetalleResult.rows[0].cantidad);
    const contado = Number(ingresosDetalleResult.rows[0].contado);
    const credito = Number(ingresosDetalleResult.rows[0].credito);
    const cobradoDelCredito = Number(cobradoResult.rows[0].cobrado);

    const porCobrar = Number(carteraResult.rows[0].por_cobrar);
    const cuentasPendientes = Number(carteraResult.rows[0].cuentas_pendientes);
    const vencidas = Number(carteraResult.rows[0].vencidas);

    const margenBrutoPct = pct(currentTotals.utilidadBruta, currentTotals.ingresos);
    const margenNetoPct = pct(currentTotals.utilidadNeta, currentTotals.ingresos);

    const variacionIngresosPct = pct(currentTotals.ingresos - prevTotals.ingresos, prevTotals.ingresos);
    const variacionUtilidadPct = pct(currentTotals.utilidadNeta - prevTotals.utilidadNeta, prevTotals.utilidadNeta);

    const payload = {
      periodo: {
        mes: `${year}-${String(month).padStart(2, '0')}`,
        inicio: startStr,
        fin: endStr,
        label: `${MESES[month - 1]} ${year}`,
      },
      ingresos: {
        total: round2(currentTotals.ingresos),
        cantidad,
        contado: round2(contado),
        credito: round2(credito),
        cobrado_del_credito: round2(cobradoDelCredito),
      },
      egresos: {
        compras: round2(currentTotals.compras),
        gastos_operativos: round2(currentTotals.gastosOperativos),
        total: round2(currentTotals.egresos),
      },
      utilidad: {
        bruta: round2(currentTotals.utilidadBruta),
        neta: round2(currentTotals.utilidadNeta),
        costo_de_ventas: round2(currentTotals.costoVentas),
        margen_bruto_pct: margenBrutoPct,
        margen_neto_pct: margenNetoPct,
      },
      cartera: {
        por_cobrar: round2(porCobrar),
        cuentas_pendientes: cuentasPendientes,
        vencidas: round2(vencidas),
      },
      gastos_por_categoria: gastosPorCategoriaResult.rows.map((row) => ({
        categoria: row.categoria,
        total: round2(Number(row.total)),
      })),
      top_productos_ganancia: topProductosResult.rows.map((row) => ({
        nombre: row.nombre,
        ganancia: round2(Number(row.ganancia)),
      })),
      comparacion_mes_anterior: {
        ingresos: round2(prevTotals.ingresos),
        egresos: round2(prevTotals.egresos),
        utilidad_neta: round2(prevTotals.utilidadNeta),
        variacion_ingresos_pct: variacionIngresosPct,
        variacion_utilidad_pct: variacionUtilidadPct,
      },
    };

    return res.json(payload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener la contabilidad' });
  }
}

module.exports = { overview };
