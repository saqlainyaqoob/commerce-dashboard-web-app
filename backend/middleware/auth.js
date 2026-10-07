const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { SAFE_METHODS, DEMO_READ_ONLY_CODE, isReadOnlyRole } = require('../utils/roles');

// Protects every private dashboard route. Expects:
//   Authorization: Bearer <token>
// On success, attaches req.adminId (the admin's real DB id, from the
// token's `sub` claim) and req.adminRole (read fresh from the admins
// table on every request, NOT from the token, so a role change takes
// effect immediately and a token can never carry a stale/forged role).
//
// Read-only roles (see utils/roles.js, e.g. the public "Demo Admin")
// are rejected with 403 for any method other than GET/HEAD/OPTIONS.
// Because this runs in front of every private router, it covers all
// current and future write endpoints (products, stock, orders,
// alerts, settings, profile, password) without per-route changes.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired - please log in again' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    const { rows } = await db.query('SELECT role FROM admins WHERE id = $1', [payload.sub]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.adminId = payload.sub;
    req.adminRole = rows[0].role;

    if (isReadOnlyRole(req.adminRole) && !SAFE_METHODS.includes(req.method)) {
      return res.status(403).json({
        error: 'This demo account is read-only and cannot modify data',
        code: DEMO_READ_ONLY_CODE,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;
