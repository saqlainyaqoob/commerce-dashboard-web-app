const db = require('../config/db');

// Percentage change between two real numbers. Returns null (not 0, not a
// fabricated number) when there is no prior-period baseline to compare
// against - the frontend treats null as "no comparison available" instead
// of drawing a fake +/-0% arrow.
function pctChange(current, previous) {
  current = parseFloat(current);
  previous = parseFloat(previous);
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

// GET /api/analytics/summary
// Top KPI cards: total revenue, order count, avg order value, active customers -
// plus the real percentage change vs. the preceding 30-day window, computed
// from the same orders table (no hardcoded deltas anywhere).
async function getSummary(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0)  AS total_revenue,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')                         AS total_orders,
        COALESCE(AVG(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0)   AS avg_order_value,
        COUNT(DISTINCT customer_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')      AS active_customers,

        COALESCE(SUM(total_amount) FILTER (
          WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'
        ), 0) AS prev_revenue,
        COUNT(*) FILTER (
          WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'
        ) AS prev_orders,
        COALESCE(AVG(total_amount) FILTER (
          WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'
        ), 0) AS prev_avg_order_value,
        COUNT(DISTINCT customer_id) FILTER (
          WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'
        ) AS prev_active_customers
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '60 days'
        AND status <> 'cancelled'
    `);

    const r = rows[0];
    res.json({
      total_revenue: r.total_revenue,
      total_orders: r.total_orders,
      avg_order_value: r.avg_order_value,
      active_customers: r.active_customers,
      deltas: {
        revenue: pctChange(r.total_revenue, r.prev_revenue),
        orders: pctChange(r.total_orders, r.prev_orders),
        avg_order_value: pctChange(r.avg_order_value, r.prev_avg_order_value),
        active_customers: pctChange(r.active_customers, r.prev_active_customers),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/revenue?range=7d|30d|12m
// Revenue grouped by day (or month), for the line/area chart
async function getRevenueSeries(req, res, next) {
  try {
    const range = req.query.range || '7d';
    let interval = '7 days';
    let bucket = 'day';
    if (range === '30d') interval = '30 days';
    if (range === '12m') { interval = '12 months'; bucket = 'month'; }

    const { rows } = await db.query(
      `SELECT date_trunc($1, created_at) AS period,
              COALESCE(SUM(total_amount), 0) AS revenue,
              COUNT(*) AS orders
       FROM orders
       WHERE created_at >= NOW() - $2::interval
         AND status <> 'cancelled'
       GROUP BY period
       ORDER BY period ASC`,
      [bucket, interval]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/category-breakdown
// Revenue share per product category, for the pie/donut chart
async function getCategoryBreakdown(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT p.category,
             SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status <> 'cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/top-products?range=7d|30d|12m|all&limit=10
// Real aggregation over order_items - units sold and revenue generated,
// for the "best sellers" table on the Revenue page.
async function getTopProducts(req, res, next) {
  try {
    const range = req.query.range || '30d';
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    let interval = '30 days';
    if (range === '7d') interval = '7 days';
    if (range === '12m') interval = '12 months';
    if (range === 'all') interval = '100 years';

    const { rows } = await db.query(
      `SELECT p.id, p.name, p.sku, p.category,
              SUM(oi.quantity)                 AS units_sold,
              SUM(oi.quantity * oi.unit_price)  AS revenue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status <> 'cancelled'
         AND o.created_at >= NOW() - $1::interval
       GROUP BY p.id, p.name, p.sku, p.category
       ORDER BY revenue DESC
       LIMIT $2`,
      [interval, limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/top-customers?limit=10
// Real aggregation over orders - lifetime order count and spend per customer.
async function getTopCustomers(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const { rows } = await db.query(
      `SELECT c.id, c.name, c.email,
              COUNT(o.id)         AS order_count,
              SUM(o.total_amount) AS total_spent
       FROM customers c
       JOIN orders o ON o.customer_id = c.id
       WHERE o.status <> 'cancelled'
       GROUP BY c.id, c.name, c.email
       ORDER BY total_spent DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getRevenueSeries,
  getCategoryBreakdown,
  getTopProducts,
  getTopCustomers,
};
