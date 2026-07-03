const pool = require('../config/db');

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function list(req, res) {
  const { status, from, to } = req.query;
  try {
    let query = `
      SELECT s.id, s.type, s.status, s.subtotal, s.iva_total, s.total, s.paid_amount, s.due_date, s.created_at,
        c.name AS customer_name, u.name AS user_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN users u ON s.user_id = u.id
      WHERE s.store_id = $1
    `;
    const params = [req.user.store_id];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }
    if (from) {
      params.push(from);
      query += ` AND s.created_at >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND s.created_at <= $${params.length}`;
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);
    const sales = result.rows.map((row) => ({
      ...row,
      items_count: Number(row.items_count),
    }));
    return res.json(sales);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener las ventas' });
  }
}

async function create(req, res) {
  const { type, customer_id, due_date, notes, items } = req.body;

  if (!['contado', 'credito'].includes(type)) {
    return res.status(400).json({ message: 'El tipo de venta debe ser contado o crédito' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Debe incluir al menos un producto en la venta' });
  }
  if (type === 'credito' && (!customer_id || !due_date)) {
    return res.status(400).json({ message: 'Debe indicar cliente y fecha de vencimiento para ventas a crédito' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const storeResult = await client.query('SELECT * FROM stores WHERE id = $1', [req.user.store_id]);
    const store = storeResult.rows[0];

    if (customer_id) {
      const customerResult = await client.query(
        'SELECT id FROM customers WHERE id = $1 AND store_id = $2',
        [customer_id, req.user.store_id]
      );
      if (customerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Cliente no encontrado' });
      }
    }

    let subtotal = 0;
    let total = 0;
    const preparedItems = [];

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity || Number(quantity) <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Cada producto debe tener una cantidad válida' });
      }

      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND store_id = $2 AND active = true FOR UPDATE',
        [product_id, req.user.store_id]
      );
      const product = productResult.rows[0];
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Producto no encontrado' });
      }
      if (product.stock < Number(quantity)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Stock insuficiente de ${product.name}` });
      }

      const unitPrice = Number(product.price);
      const ivaRate = store.iva_enabled && product.apply_iva ? Number(store.iva_rate) : 0;
      const itemSubtotal = round2(Number(quantity) * unitPrice);
      const lineTotal = round2(itemSubtotal * (1 + ivaRate / 100));

      subtotal += itemSubtotal;
      total += lineTotal;

      preparedItems.push({
        product,
        quantity: Number(quantity),
        unitPrice,
        ivaRate,
        lineTotal,
      });
    }

    subtotal = round2(subtotal);
    total = round2(total);
    const ivaTotal = round2(total - subtotal);
    const status = type === 'contado' ? 'pagada' : 'pendiente';
    const paidAmount = type === 'contado' ? total : 0;

    const saleResult = await client.query(
      `INSERT INTO sales (store_id, user_id, customer_id, type, subtotal, iva_total, total, paid_amount, status, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        req.user.store_id,
        req.user.id,
        customer_id || null,
        type,
        subtotal,
        ivaTotal,
        total,
        paidAmount,
        status,
        type === 'credito' ? due_date : null,
        notes || null,
      ]
    );
    const sale = saleResult.rows[0];

    const saleItems = [];
    for (const prepared of preparedItems) {
      const itemResult = await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, iva_rate, line_total)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [sale.id, prepared.product.id, prepared.quantity, prepared.unitPrice, prepared.ivaRate, prepared.lineTotal]
      );
      saleItems.push(itemResult.rows[0]);

      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [
        prepared.quantity,
        prepared.product.id,
      ]);

      await client.query(
        `INSERT INTO inventory_movements (store_id, product_id, user_id, type, quantity, reason)
         VALUES ($1, $2, $3, 'venta', $4, 'venta')`,
        [req.user.store_id, prepared.product.id, req.user.id, -prepared.quantity]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ ...sale, items: saleItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Error al registrar la venta' });
  } finally {
    client.release();
  }
}

async function cancel(req, res) {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const saleResult = await client.query('SELECT * FROM sales WHERE id = $1 AND store_id = $2', [
      id,
      req.user.store_id,
    ]);
    const sale = saleResult.rows[0];
    if (!sale) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    if (sale.status === 'anulada') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'La venta ya está anulada' });
    }

    const itemsResult = await client.query('SELECT * FROM sale_items WHERE sale_id = $1', [id]);

    for (const item of itemsResult.rows) {
      await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [
        item.quantity,
        item.product_id,
      ]);
      await client.query(
        `INSERT INTO inventory_movements (store_id, product_id, user_id, type, quantity, reason)
         VALUES ($1, $2, $3, 'entrada', $4, 'anulación de venta')`,
        [req.user.store_id, item.product_id, req.user.id, item.quantity]
      );
    }

    const updatedResult = await client.query(
      `UPDATE sales SET status = 'anulada' WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, req.user.store_id]
    );

    await client.query('COMMIT');
    return res.json({ ...updatedResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Error al anular la venta' });
  } finally {
    client.release();
  }
}

module.exports = { list, create, cancel };
