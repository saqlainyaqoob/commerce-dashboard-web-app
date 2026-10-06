const db = require('../config/db');

// GET /api/orders?page=1&limit=10&status=pending&search=jane&startDate=2026-08-01&endDate=2026-08-31
async function getOrders(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, search, startDate, endDate } = req.query;

    const params = [];
    const where = [];

    if (status && status !== 'all') {
      params.push(status);
      where.push(`o.status = $${params.length}`);
    }
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const likeIdx = params.length;
      // Matches customer name/email, or an exact order id if the search
      // term happens to be numeric.
      const idMatch = /^\d+$/.test(search.trim()) ? ` OR o.id = ${parseInt(search.trim())}` : '';
      where.push(`(c.name ILIKE $${likeIdx} OR c.email ILIKE $${likeIdx}${idMatch})`);
    }
    if (startDate) {
      params.push(startDate);
      where.push(`o.created_at >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      where.push(`o.created_at < ($${params.length}::date + INTERVAL '1 day')`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at,
              c.name AS customer_name, c.email AS customer_email
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       ${whereSql}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countRes = await db.query(
      `SELECT COUNT(*) FROM orders o JOIN customers c ON c.id = o.customer_id ${whereSql}`,
      countParams
    );

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: parseInt(countRes.rows[0].count),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/:id - full order detail, including real line items
// joined back to their products (used by the order detail view).
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const orderRes = await db.query(
      `SELECT o.*, c.name AS customer_name, c.email AS customer_email
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1`,
      [id]
    );
    if (!orderRes.rows.length) return res.status(404).json({ error: 'Order not found' });

    const itemsRes = await db.query(
      `SELECT oi.id, oi.quantity, oi.unit_price,
              p.id AS product_id, p.name AS product_name, p.sku
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [id]
    );

    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/orders/:id/status
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const { rows } = await db.query(
      `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    // Broadcast the change so every connected dashboard updates instantly
    req.app.get('io').emit('order:updated', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getOrders, getOrderById, updateOrderStatus };
