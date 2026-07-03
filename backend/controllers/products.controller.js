const pool = require('../config/db');

async function list(req, res) {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM products WHERE store_id = $1 AND active = true';
    const params = [req.user.store_id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener los productos' });
  }
}

async function create(req, res) {
  const {
    name,
    sku,
    description,
    price,
    cost,
    stock,
    min_stock,
    apply_iva,
    show_in_catalog,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre del producto es obligatorio' });
  }
  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    return res.status(400).json({ message: 'El precio es obligatorio y debe ser un número válido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const initialStock = stock ? Number(stock) : 0;

    const result = await client.query(
      `INSERT INTO products (store_id, name, sku, description, price, cost, stock, min_stock, apply_iva, show_in_catalog)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        req.user.store_id,
        name.trim(),
        sku || null,
        description || null,
        price,
        cost || 0,
        initialStock,
        min_stock || 0,
        apply_iva === undefined ? true : apply_iva,
        show_in_catalog === undefined ? true : show_in_catalog,
      ]
    );
    const product = result.rows[0];

    if (initialStock > 0) {
      await client.query(
        `INSERT INTO inventory_movements (store_id, product_id, user_id, type, quantity, reason)
         VALUES ($1, $2, $3, 'entrada', $4, 'inventario inicial')`,
        [req.user.store_id, product.id, req.user.id, initialStock]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Error al crear el producto' });
  } finally {
    client.release();
  }
}

async function update(req, res) {
  const { id } = req.params;
  const {
    name,
    sku,
    description,
    price,
    cost,
    stock,
    min_stock,
    apply_iva,
    show_in_catalog,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre del producto es obligatorio' });
  }
  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    return res.status(400).json({ message: 'El precio es obligatorio y debe ser un número válido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM products WHERE id = $1 AND store_id = $2', [
      id,
      req.user.store_id,
    ]);
    const currentProduct = existing.rows[0];
    if (!currentProduct) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const newStock = stock === undefined || stock === null ? currentProduct.stock : Number(stock);

    const result = await client.query(
      `UPDATE products SET name = $1, sku = $2, description = $3, price = $4, cost = $5,
       stock = $6, min_stock = $7, apply_iva = $8, show_in_catalog = $9
       WHERE id = $10 AND store_id = $11 RETURNING *`,
      [
        name.trim(),
        sku || null,
        description || null,
        price,
        cost === undefined ? currentProduct.cost : cost,
        newStock,
        min_stock === undefined ? currentProduct.min_stock : min_stock,
        apply_iva === undefined ? currentProduct.apply_iva : apply_iva,
        show_in_catalog === undefined ? currentProduct.show_in_catalog : show_in_catalog,
        id,
        req.user.store_id,
      ]
    );
    const product = result.rows[0];

    const diff = newStock - currentProduct.stock;
    if (diff !== 0) {
      await client.query(
        `INSERT INTO inventory_movements (store_id, product_id, user_id, type, quantity, reason)
         VALUES ($1, $2, $3, 'ajuste', $4, 'ajuste manual')`,
        [req.user.store_id, product.id, req.user.id, diff]
      );
    }

    await client.query('COMMIT');
    return res.json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar el producto' });
  } finally {
    client.release();
  }
}

async function remove(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE products SET active = false WHERE id = $1 AND store_id = $2 RETURNING *',
      [id, req.user.store_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    return res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al eliminar el producto' });
  }
}

module.exports = { list, create, update, remove };
