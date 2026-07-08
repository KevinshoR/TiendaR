const pool = require('../config/db');

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function list(req, res) {
  try {
    const query = `
      SELECT p.id, p.supplier, p.iva_rate, p.discount, p.subtotal, p.iva_total, p.total, p.created_at,
        u.name AS user_name,
        (SELECT COUNT(*) FROM purchase_items pi WHERE pi.purchase_id = p.id) AS items_count,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'product_name', pr.name,
            'quantity', pi.quantity,
            'unit_cost', pi.unit_cost
          ) ORDER BY pi.id), '[]')
          FROM purchase_items pi JOIN products pr ON pr.id = pi.product_id
          WHERE pi.purchase_id = p.id
        ) AS items
      FROM purchases p
      JOIN users u ON p.user_id = u.id
      WHERE p.store_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [req.user.store_id]);
    const purchases = result.rows.map((row) => ({
      ...row,
      items_count: Number(row.items_count),
    }));
    return res.json(purchases);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener las compras' });
  }
}

async function create(req, res) {
  const { supplier, iva_rate, items, discount } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Debe incluir al menos un producto en la compra' });
  }

  const discountNum = discount ? Number(discount) : 0;
  if (discountNum < 0) {
    return res.status(400).json({ message: 'El descuento no puede ser negativo' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let subtotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const { product_id, quantity, unit_cost } = item;
      if (!product_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Cada ítem debe indicar un producto' });
      }
      if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'La cantidad debe ser un entero mayor o igual a 1' });
      }
      if (!(Number(unit_cost) > 0)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'El costo unitario debe ser mayor a 0' });
      }

      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND store_id = $2 FOR UPDATE',
        [product_id, req.user.store_id]
      );
      const product = productResult.rows[0];
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Producto no encontrado' });
      }

      const quantityNum = Number(quantity);
      const unitCostNum = Number(unit_cost);
      const lineTotal = round2(quantityNum * unitCostNum);
      subtotal += lineTotal;

      preparedItems.push({ product, quantity: quantityNum, unitCost: unitCostNum, lineTotal });
    }

    subtotal = round2(subtotal);

    if (discountNum > subtotal) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El descuento no puede superar el subtotal' });
    }

    const base = round2(subtotal - discountNum);
    const ivaRateNum = iva_rate ? Number(iva_rate) : null;
    const ivaTotal = ivaRateNum ? round2(base * (ivaRateNum / 100)) : 0;
    const total = round2(base + ivaTotal);

    const purchaseResult = await client.query(
      `INSERT INTO purchases (store_id, user_id, supplier, iva_rate, discount, subtotal, iva_total, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.store_id, req.user.id, supplier || null, ivaRateNum, discountNum, subtotal, ivaTotal, total]
    );
    const purchase = purchaseResult.rows[0];

    const purchaseItems = [];
    for (const prepared of preparedItems) {
      const itemResult = await client.query(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [purchase.id, prepared.product.id, prepared.quantity, prepared.unitCost]
      );
      purchaseItems.push(itemResult.rows[0]);

      await client.query(
        'UPDATE products SET stock = stock + $1, cost = $2 WHERE id = $3 AND store_id = $4',
        [prepared.quantity, prepared.unitCost, prepared.product.id, req.user.store_id]
      );

      await client.query(
        `INSERT INTO inventory_movements (store_id, product_id, user_id, type, quantity, reason, reference_id)
         VALUES ($1, $2, $3, 'entrada', $4, 'compra', $5)`,
        [req.user.store_id, prepared.product.id, req.user.id, prepared.quantity, purchase.id]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ ...purchase, items: purchaseItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Error al registrar la compra' });
  } finally {
    client.release();
  }
}

module.exports = { list, create };
