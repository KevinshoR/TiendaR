const pool = require('../config/db');

async function getStoreBySlug(req, res) {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, name, slug, description_public, whatsapp, instagram_url, facebook_url,
              tiktok_url, telegram_url, youtube_url, iva_enabled
       FROM stores WHERE slug = $1`,
      [slug]
    );
    const store = result.rows[0];
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    return res.json(store);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener la tienda' });
  }
}

async function getStoreProducts(req, res) {
  const { slug } = req.params;
  try {
    const storeResult = await pool.query('SELECT id FROM stores WHERE slug = $1', [slug]);
    const store = storeResult.rows[0];
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const result = await pool.query(
      `SELECT id, name, description, price, image_url, stock, sizes
       FROM products
       WHERE store_id = $1 AND active = true AND show_in_catalog = true
       ORDER BY name`,
      [store.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener los productos' });
  }
}

module.exports = { getStoreBySlug, getStoreProducts };
