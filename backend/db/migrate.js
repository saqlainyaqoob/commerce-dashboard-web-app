// Runs schema.sql against the configured database, then makes sure the
// two singleton rows this app depends on exist: the one admin account
// and the one store_settings row. Usage: npm run migrate
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@commercehq.io';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Alex Morgan';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'changeme123';

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Schema created / verified successfully.');

    // Seed the one admin account, only if it doesn't already exist -
    // re-running migrate must never overwrite an admin's real password.
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO admins (name, email, role, timezone, password_hash)
       VALUES ($1, $2, 'Administrator', 'UTC', $3)
       ON CONFLICT (email) DO NOTHING`,
      [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, passwordHash]
    );

    // Seed the one store_settings row if it doesn't exist yet.
    await pool.query(
      `INSERT INTO store_settings (id, store_name)
       VALUES (1, 'CommerceHQ')
       ON CONFLICT (id) DO NOTHING`
    );

    console.log(`Admin account ready: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
    console.log('   (change this password from the Profile page after first login)');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
