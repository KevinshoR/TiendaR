const cron = require('node-cron');
const pool = require('../config/db');
const { enviarRecordatorio } = require('../utils/mailer');

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function yaEnviadoHoy(saleId, tipo) {
  const result = await pool.query(
    `SELECT 1 FROM payment_reminders_log WHERE sale_id = $1 AND tipo = $2 AND sent_at::date = CURRENT_DATE LIMIT 1`,
    [saleId, tipo]
  );
  return result.rows.length > 0;
}

async function ejecutarRecordatorios() {
  try {
    const result = await pool.query(`
      SELECT s.id, s.store_id, s.total, s.paid_amount, s.due_date,
        c.name AS customer_name, c.email AS customer_email,
        st.name AS store_name,
        CASE
          WHEN s.due_date = CURRENT_DATE THEN 'vencimiento'
          WHEN s.due_date = CURRENT_DATE + 7 THEN 'anticipado'
        END AS tipo
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN stores st ON s.store_id = st.id
      WHERE s.type = 'credito' AND s.status = 'pendiente' AND s.customer_id IS NOT NULL
        AND (s.due_date = CURRENT_DATE OR s.due_date = CURRENT_DATE + 7)
    `);

    let enviados = 0;

    for (const row of result.rows) {
      if (!row.customer_email) continue;

      const yaEnviado = await yaEnviadoHoy(row.id, row.tipo);
      if (yaEnviado) continue;

      const saldo = round2(Number(row.total) - Number(row.paid_amount));

      await enviarRecordatorio(row.customer_email, row.customer_name, row.store_name, saldo, row.due_date, row.tipo);

      await pool.query(
        `INSERT INTO payment_reminders_log (store_id, sale_id, sent_to, tipo) VALUES ($1, $2, $3, $4)`,
        [row.store_id, row.id, row.customer_email, row.tipo]
      );

      enviados++;
    }

    console.log(`[Recordatorios] Enviados: ${enviados}`);
  } catch (err) {
    console.error('[Recordatorios] Error ejecutando el job:', err.message);
  }
}

function iniciarJobRecordatorios() {
  cron.schedule('0 8 * * *', ejecutarRecordatorios);
}

module.exports = { iniciarJobRecordatorios, ejecutarRecordatorios };
