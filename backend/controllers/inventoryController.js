const db = require('../config/db');

// GET /api/inventory/products?search=&category=&stockStatus=low|out|all&includeArchived=false
async function getProducts(req, res, next) {
  try {
    const { search, category, stockStatus, includeArchived } = req.query;
    const params = [];
    const where = [];

    if (includeArchived !== 'true') where.push('is_active = TRUE');
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      where.push(`(name ILIKE $${params.length} OR sku ILIKE $${params.length})`);
    }
    if (category && category !== 'all') {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    if (stockStatus === 'low') where.push('stock_quantity > 0 AND stock_quantity <= reorder_level');
    if (stockStatus === 'out') where.push('stock_quantity = 0');

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT * FROM products ${whereSql} ORDER BY stock_quantity ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/inventory/products
// { name, sku, category, price, stock_quantity, reorder_level }
// Creates a real row in Postgres. reorder_level falls back to the store's
// configured default (store_settings.low_stock_default_threshold) rather
// than a hardcoded number, so the Settings page actually affects behavior.
async function createProduct(req, res, next) {
  try {
    const { name, sku, category, price, stock_quantity, reorder_level } = req.body;
    if (!name || !sku || !category || price === undefined) {
      return res.status(400).json({ error: 'name, sku, category and price are required' });
    }

    let effectiveReorderLevel = reorder_level;
    if (effectiveReorderLevel === undefined) {
      const settingsRes = await db.query('SELECT low_stock_default_threshold FROM store_settings WHERE id = 1');
      effectiveReorderLevel = settingsRes.rows[0]?.low_stock_default_threshold ?? 15;
    }

    const { rows } = await db.query(
      `INSERT INTO products (name, sku, category, price, stock_quantity, reorder_level)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, sku, category, price, stock_quantity || 0, effectiveReorderLevel]
    );

    req.app.get('io').emit('inventory:updated', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A product with that SKU already exists' });
    next(err);
  }
}

// PATCH /api/inventory/products/:id
// Partial update of real product fields - name, sku, category, price,
// reorder_level, and is_active (used to archive/restore a product instead
// of ever deleting a row that historical orders still reference).
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const fields = ['name', 'sku', 'category', 'price', 'reorder_level', 'is_active'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        params.push(req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(id);
    const { rows } = await db.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    // A reorder_level or stock-affecting edit can change alert status too.
    const alertService = require('../services/alertService');
    await alertService.evaluateProduct(rows[0], req.app.get('io'));

    req.app.get('io').emit('inventory:updated', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A product with that SKU already exists' });
    next(err);
  }
}

// GET /api/inventory/alerts?unreadOnly=true
async function getAlerts(req, res, next) {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const { rows } = await db.query(
      `SELECT a.*, p.name AS product_name, p.sku
       FROM inventory_alerts a
       JOIN products p ON p.id = a.product_id
       ${unreadOnly ? 'WHERE a.is_read = FALSE' : ''}
       ORDER BY a.created_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/inventory/alerts/:id/read
// Marks one notification as read - this is real, persisted state (not a
// client-only "dismiss"), so the unread count is correct on reload and
// across every open tab/browser.
async function markAlertRead(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `UPDATE inventory_alerts SET is_read = TRUE WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });

    req.app.get('io').emit('inventory:alert-read', { id: rows[0].id });
    res.json({ id: rows[0].id, is_read: true });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/inventory/alerts/read-all
async function markAllAlertsRead(req, res, next) {
  try {
    const { rows } = await db.query(
      `UPDATE inventory_alerts SET is_read = TRUE WHERE is_read = FALSE RETURNING id`
    );
    req.app.get('io').emit('inventory:alerts-read-all', { ids: rows.map((r) => r.id) });
    res.json({ updated: rows.length });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/inventory/products/:id/stock  { quantityChange: -5 } or { setQuantity: 40 }
async function updateStock(req, res, next) {
  try {
    const { id } = req.params;
    const { quantityChange, setQuantity } = req.body;

    const { rows } = await db.query(
      setQuantity !== undefined
        ? `UPDATE products SET stock_quantity = $1 WHERE id = $2 RETURNING *`
        : `UPDATE products SET stock_quantity = GREATEST(stock_quantity + $1, 0) WHERE id = $2 RETURNING *`,
      [setQuantity !== undefined ? setQuantity : quantityChange, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    // Let the alert service decide (right now, synchronously) whether this
    // stock level crosses a threshold and needs a new alert + socket push.
    const alertService = require('../services/alertService');
    await alertService.evaluateProduct(rows[0], req.app.get('io'));

    req.app.get('io').emit('inventory:updated', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProducts, createProduct, updateProduct, getAlerts, markAlertRead, markAllAlertsRead, updateStock };
