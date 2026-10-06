const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ordersController');

router.get('/', ctrl.getOrders);
router.get('/:id', ctrl.getOrderById);
router.patch('/:id/status', ctrl.updateOrderStatus);

module.exports = router;
