const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');

router.get('/products', ctrl.getProducts);
router.post('/products', ctrl.createProduct);
router.patch('/products/:id', ctrl.updateProduct);
router.get('/alerts', ctrl.getAlerts);
router.patch('/alerts/read-all', ctrl.markAllAlertsRead);
router.patch('/alerts/:id/read', ctrl.markAlertRead);
router.patch('/products/:id/stock', ctrl.updateStock);

module.exports = router;
