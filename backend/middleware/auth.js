const jwt = require('jsonwebtoken');

// Protects every private dashboard route. Expects:
//   Authorization: Bearer <token>
// On success, attaches req.adminId (the admin's real DB id, from the
// token's `sub` claim) so controllers know exactly who is making the
// request instead of assuming a single hardcoded admin.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.adminId = payload.sub;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired - please log in again' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

module.exports = requireAuth;
