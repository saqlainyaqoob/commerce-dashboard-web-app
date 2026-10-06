const db = require('../config/db');

// GET /api/settings
async function getSettings(req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM store_settings WHERE id = 1');
    if (!rows.length) return res.status(404).json({ error: 'Store settings not found - run `npm run migrate` in backend/' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/settings
// { store_name, support_email, timezone, low_stock_default_threshold, order_auto_cancel_days }
async function updateSettings(req, res, next) {
  try {
    const fields = ['store_name', 'support_email', 'timezone', 'low_stock_default_threshold', 'order_auto_cancel_days'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        params.push(req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    const { rows } = await db.query(
      `UPDATE store_settings SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Store settings not found' });

    // Every connected dashboard (any open tab/browser) picks up the new
    // settings immediately, same real-time pattern as orders/inventory.
    req.app.get('io').emit('settings:updated', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
