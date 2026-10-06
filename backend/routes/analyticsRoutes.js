const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');

router.get('/summary', ctrl.getSummary);
router.get('/revenue', ctrl.getRevenueSeries);
router.get('/category-breakdown', ctrl.getCategoryBreakdown);
router.get('/top-products', ctrl.getTopProducts);
router.get('/top-customers', ctrl.getTopCustomers);

module.exports = router;
