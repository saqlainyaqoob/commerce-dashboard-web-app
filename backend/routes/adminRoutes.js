const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');

router.get('/profile', ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);
router.patch('/password', ctrl.changePassword);

module.exports = router;
