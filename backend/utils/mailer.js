let transporter;

function getTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return null;
  if (!transporter) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS.replace(/\s/g, ''),
      },
    });
  }
  return transporter;
}

function formatCOP(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatFecha(iso) {
  if (!iso) return 'sin fecha';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function construirEmail({ tipo, clienteNombre, tiendaNombre, saldo, dueDate }) {
  let subject;
  let titulo;
  let mensaje;

  if (tipo === 'vencimiento') {
    subject = `Tu pago vence hoy · ${tiendaNombre}`;
    titulo = 'Tu pago vence hoy';
    mensaje = `Hoy, <strong>${formatFecha(dueDate)}</strong>, vence el plazo para pagar tu saldo pendiente con nosotros.`;
  } else if (tipo === 'anticipado') {
    subject = `Recordatorio: tu pago vence pronto · ${tiendaNombre}`;
    titulo = 'Tu pago vence pronto';
    mensaje = `Tu saldo pendiente vence el <strong>${formatFecha(dueDate)}</strong>. Te escribimos con anticipación para que puedas organizarte con tiempo.`;
  } else {
    subject = `Recordatorio de tu saldo pendiente · ${tiendaNombre}`;
    titulo = 'Tienes un saldo pendiente';
    mensaje = `Te recordamos que tienes un saldo pendiente con nosotros${dueDate ? `, con fecha de vencimiento el <strong>${formatFecha(dueDate)}</strong>` : ''}.`;
  }

  const html = `
  <div style="font-family: 'Inter', Arial, sans-serif; background-color: #F7F7F5; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E8E8E4;">
      <div style="background-color: #161616; padding: 24px 32px;">
        <p style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #00C896;">${tiendaNombre}</p>
        <h1 style="margin: 8px 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">${titulo}</h1>
      </div>
      <div style="padding: 28px 32px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #161616;">Hola ${clienteNombre || ''},</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #161616;">${mensaje}</p>
        <div style="background-color: #F7F7F5; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6B6B6B;">Saldo pendiente</p>
          <p style="margin: 6px 0 0; font-size: 26px; font-weight: 800; color: #00C896;">${formatCOP(saldo)}</p>
        </div>
        <p style="margin: 0 0 4px; font-size: 14px; line-height: 1.6; color: #6B6B6B;">
          Si ya realizaste tu pago, puedes ignorar este mensaje. Cualquier duda, contáctanos directamente.
        </p>
        <p style="margin: 24px 0 0; font-size: 14px; color: #161616;">Gracias por tu confianza,<br/><strong>${tiendaNombre}</strong></p>
      </div>
    </div>
  </div>`;

  return { subject, html };
}

async function enviarRecordatorio(clienteEmail, clienteNombre, tiendaNombre, saldo, dueDate, tipo) {
  const client = getTransporter();
  if (!client) {
    console.log('[Mailer] Gmail SMTP sin configurar — recordatorio no enviado (modo simulado)');
    return { sent: false, reason: 'no-config' };
  }

  const { subject, html } = construirEmail({ tipo, clienteNombre, tiendaNombre, saldo, dueDate });

  try {
    const result = await client.sendMail({
      from: process.env.MAIL_FROM,
      to: clienteEmail,
      subject,
      html,
    });
    return { sent: true, result };
  } catch (err) {
    console.error('[Mailer] Error enviando recordatorio:', err.message);
    return { sent: false, reason: 'error', error: err };
  }
}

module.exports = { enviarRecordatorio };
