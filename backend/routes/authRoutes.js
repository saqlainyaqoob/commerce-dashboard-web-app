const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const { loginLimiter, demoLoginLimiter, refreshLimiter } = require('../middleware/rateLimiter');

// Public - rate-limited so bcrypt (deliberately slow) can't be used as a
// brute-force target and credential stuffing gets throttled per IP.
router.post('/login', loginLimiter, ctrl.login);

// Public - one-click sign-in for the read-only demo account (see controller).
router.post('/demo-login', demoLoginLimiter, ctrl.demoLogin);

// Public (reads the httpOnly refresh cookie itself, not a Bearer token) -
// this is how the frontend silently extends a session past the short
// access-token lifetime without asking the admin to log in again.
router.post('/refresh', refreshLimiter, ctrl.refresh);

// Public - revokes whatever refresh token the cookie holds, if any.
router.post('/logout', ctrl.logout);

// Protected - used by the frontend to validate a stored access token on load.
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
