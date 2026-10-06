// ============================================================
//  Inventory Alert Service
// ------------------------------------------------------------
//  This is the "brain" behind inventory alerts. It is called
//  from two places:
//    1. Whenever a product's stock changes (order placed,
//       manual restock, admin edit) -> evaluateProduct()
//
//  Alert rules (simple, deliberately easy to extend):
//    - stock_quantity === 0            -> 'out_of_stock'
//    - stock_quantity <= reorder_level -> 'low_stock'
//    - stock_quantity climbs back above reorder_level
//      after having been low                -> 'restocked'
//
//  We only insert a new alert row if the *type* actually changed
//  since the last alert for that product, so a product sitting at
//  3 units doesn't spam a new "low_stock" row every 5 seconds.
// ============================================================

const db = require('../config/db');

async function getLastAlertType(productId) {
  const { rows } = await db.query(
    `SELECT alert_type FROM inventory_alerts
     WHERE product_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [productId]
  );
  return rows[0]?.alert_type || null;
}

function classify(product) {
  if (product.stock_quantity <= 0) return 'out_of_stock';
  if (product.stock_quantity <= product.reorder_level) return 'low_stock';
  return 'ok';
}

async function evaluateProduct(product, io) {
  const currentState = classify(product);
  const lastAlertType = await getLastAlertType(product.id);

  // Nothing changed since the last alert -> do nothing (avoid spam)
  if (currentState === 'ok' && lastAlertType !== 'low_stock' && lastAlertType !== 'out_of_stock') {
    return null;
  }
  if (currentState !== 'ok' && currentState === lastAlertType) {
    return null;
  }

  let alertType = currentState;
  let message = '';
  if (currentState === 'ok' && (lastAlertType === 'low_stock' || lastAlertType === 'out_of_stock')) {
    alertType = 'restocked';
    message = `${product.name} (${product.sku}) is back in healthy stock: ${product.stock_quantity} units.`;
  } else if (currentState === 'out_of_stock') {
    message = `${product.name} (${product.sku}) is OUT OF STOCK.`;
  } else if (currentState === 'low_stock') {
    message = `${product.name} (${product.sku}) is low on stock: only ${product.stock_quantity} left (reorder level: ${product.reorder_level}).`;
  } else {
    return null; // nothing to log
  }

  const { rows } = await db.query(
    `INSERT INTO inventory_alerts (product_id, alert_type, stock_at_time, message)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [product.id, alertType, product.stock_quantity, message]
  );
  const alert = { ...rows[0], product_name: product.name, sku: product.sku };

  // Push it to every connected browser instantly - this is the "real-time"
  // part: the frontend never has to poll or refresh to see this.
  if (io) io.emit('inventory:alert', alert);

  return alert;
}

module.exports = { evaluateProduct, classify };
