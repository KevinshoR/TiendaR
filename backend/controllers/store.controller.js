const pool = require('../config/db');

async function getStore(req, res) {
  try {
    const result = await pool.query('SELECT * FROM stores WHERE id = $1', [req.user.store_id]);
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

async function updateStore(req, res) {
  const {
    name, phone, address, iva_enabled, iva_rate,
    whatsapp, description_public, instagram_url, facebook_url,
    tiktok_url, telegram_url, youtube_url,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre de la tienda es obligatorio' });
  }

  try {
    const existing = await pool.query('SELECT * FROM stores WHERE id = $1', [req.user.store_id]);
    const currentStore = existing.rows[0];
    if (!currentStore) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const result = await pool.query(
      `UPDATE stores SET name = $1, phone = $2, address = $3, iva_enabled = $4, iva_rate = $5,
       whatsapp = $6, description_public = $7, instagram_url = $8, facebook_url = $9,
       tiktok_url = $10, telegram_url = $11, youtube_url = $12
       WHERE id = $13 RETURNING *`,
      [
        name.trim(),
        phone === undefined ? currentStore.phone : phone,
        address === undefined ? currentStore.address : address,
        iva_enabled === undefined ? currentStore.iva_enabled : iva_enabled,
        iva_rate === undefined ? currentStore.iva_rate : iva_rate,
        whatsapp === undefined ? currentStore.whatsapp : whatsapp,
        description_public === undefined ? currentStore.description_public : description_public,
        instagram_url === undefined ? currentStore.instagram_url : instagram_url,
        facebook_url === undefined ? currentStore.facebook_url : facebook_url,
        tiktok_url === undefined ? currentStore.tiktok_url : tiktok_url,
        telegram_url === undefined ? currentStore.telegram_url : telegram_url,
        youtube_url === undefined ? currentStore.youtube_url : youtube_url,
        req.user.store_id,
      ]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar la tienda' });
  }
}

module.exports = { getStore, updateStore };
