const rateLimit = require('express-rate-limit');

// Throttles POST /api/auth/login per IP so credential-stuffing / brute
// force attempts can't hammer bcrypt (which is deliberately slow) or
// guess a password. Successful logins still count against the window -
// this limits *attempts*, not just failures, which is the safer default.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
});

// Demo sign-in has no password to brute-force, so this is just abuse
// protection - more generous than loginLimiter so a shared office/campus IP
// can't lock out other visitors.
const demoLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many demo sign-ins. Please try again in a few minutes.' },
});

// Lighter throttle on the refresh endpoint - an attacker who doesn't
// already hold a valid refresh cookie can't use this to brute force
// anything (the token is 384 bits of randomness), but capping request
// volume here is still cheap insurance.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

module.exports = { loginLimiter, demoLoginLimiter, refreshLimiter };
