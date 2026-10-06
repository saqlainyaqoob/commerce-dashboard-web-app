const bcrypt = require('bcryptjs');
const db = require('../config/db');
const {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
} = require('../utils/tokens');

const PUBLIC_COLUMNS = 'id, name, email, phone, avatar_url, role, timezone, created_at, updated_at';

// Issues a fresh access+refresh token pair for an admin: signs the short
// -lived JWT, stores a hash of a new opaque refresh token, and sets it
// as an httpOnly cookie on the response. Shared by login() and refresh().
async function issueSession(res, admin) {
  const accessToken = signAccessToken(admin);
  const { raw, hash, expiresAt } = generateRefreshToken();

  await db.query(
    `INSERT INTO refresh_tokens (admin_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [admin.id, hash, expiresAt]
  );
  res.cookie(REFRESH_COOKIE_NAME, raw, REFRESH_COOKIE_OPTIONS);

  return accessToken;
}

// POST /api/auth/login   { email, password }
// Real bcrypt comparison against the stored hash, then a signed short-lived
// JWT access token plus a long-lived refresh token (httpOnly cookie) - no
// fake "always succeeds" login, no plaintext password ever compared or
// stored. Rate-limited at the route level (see routes/authRoutes.js).
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await db.query(
      `SELECT id, name, email, phone, avatar_url, role, timezone, created_at, updated_at, password_hash
       FROM admins WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    // Same generic error whether the email doesn't exist or the password
    // is wrong - don't leak which case it was.
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });

    const admin = rows[0];
    const matches = await bcrypt.compare(password, admin.password_hash);
    if (!matches) return res.status(401).json({ error: 'Invalid email or password' });

    delete admin.password_hash;
    const accessToken = await issueSession(res, admin);

    res.json({ token: accessToken, admin });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh - reads the httpOnly refresh cookie, and if it
// matches a real, non-revoked, non-expired row, issues a brand new
// access+refresh pair and revokes the old refresh row (rotation: a
// refresh token can only ever be used once, so a stolen-and-replayed
// cookie is detected and dead-ends immediately).
async function refresh(req, res, next) {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!raw) return res.status(401).json({ error: 'No refresh token' });

    const hash = hashToken(raw);
    const adminFields = PUBLIC_COLUMNS.split(', ');
    const { rows } = await db.query(
      `SELECT rt.id AS refresh_id, rt.expires_at, rt.revoked_at,
              a.${adminFields.join(', a.')}
       FROM refresh_tokens rt
       JOIN admins a ON a.id = rt.admin_id
       WHERE rt.token_hash = $1`,
      [hash]
    );

    if (!rows.length || rows[0].revoked_at || new Date(rows[0].expires_at) < new Date()) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      return res.status(401).json({ error: 'Refresh token is invalid or expired - please log in again' });
    }

    const row = rows[0];
    await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [row.refresh_id]);

    const cleanAdmin = {};
    for (const field of adminFields) cleanAdmin[field] = row[field];

    const accessToken = await issueSession(res, cleanAdmin);
    res.json({ token: accessToken, admin: cleanAdmin });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout - revokes the refresh token server-side (so it
// can never be used again even if it was somehow retained) and clears
// the cookie. Always succeeds from the client's point of view, even if
// the cookie was already gone or expired - logout must never get "stuck".
async function logout(req, res, next) {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    if (raw) {
      const hash = hashToken(raw);
      await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL', [hash]);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me - lets the frontend verify a stored access token is
// still valid on app load (protected by requireAuth, so reaching this
// handler at all already proves the token verified).
async function me(req, res, next) {
  try {
    const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM admins WHERE id = $1`, [req.adminId]);
    if (!rows.length) return res.status(404).json({ error: 'Admin account not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout, me };
