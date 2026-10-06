const bcrypt = require('bcryptjs');
const db = require('../config/db');

// req.adminId is set by the requireAuth middleware after verifying the
// caller's JWT, so every read/write below acts on whichever admin is
// actually logged in - not a hardcoded id. (Today there's still only
// one admin row in practice, but the code no longer assumes that.)

const PUBLIC_COLUMNS = 'id, name, email, phone, avatar_url, role, timezone, created_at, updated_at';

// GET /api/admin/profile
async function getProfile(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT ${PUBLIC_COLUMNS} FROM admins WHERE id = $1`,
      [req.adminId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Admin account not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/profile   { name, email, phone, avatar_url, timezone }
async function updateProfile(req, res, next) {
  try {
    const fields = ['name', 'email', 'phone', 'avatar_url', 'timezone'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        params.push(req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.adminId);
    const { rows } = await db.query(
      `UPDATE admins SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING ${PUBLIC_COLUMNS}`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Admin account not found' });
    res.json(rows[0]);
  } catch (err) {
    // A duplicate email hits the admins.email UNIQUE constraint
    if (err.code === '23505') return res.status(409).json({ error: 'That email is already in use' });
    next(err);
  }
}

// PATCH /api/admin/password   { currentPassword, newPassword }
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are both required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const { rows } = await db.query('SELECT password_hash FROM admins WHERE id = $1', [req.adminId]);
    if (!rows.length) return res.status(404).json({ error: 'Admin account not found' });

    // Real bcrypt comparison against the stored hash - not a stub.
    const matches = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!matches) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.adminId]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword };

