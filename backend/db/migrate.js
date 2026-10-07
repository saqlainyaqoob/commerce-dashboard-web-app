// Runs schema.sql against the configured database, then makes sure the
// two singleton rows this app depends on exist: the one admin account
// and the one store_settings row. Usage: npm run migrate
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { ROLES } = require('../utils/roles');

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@commercehq.io';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Alex Morgan';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'changeme123';

// Read-only demo account used by the login page's "Try Demo" button. It is
// always created (visitors sign in through POST /api/auth/demo-login, so no
// credentials are needed on the frontend). DEMO_ADMIN_EMAIL / _PASSWORD /
// _NAME are optional overrides; if no password is given, a random one is
// generated so the demo account can't be signed into through the normal form.
const DEMO_ADMIN_EMAIL = (process.env.DEMO_ADMIN_EMAIL || 'demo@commercehq.io').toLowerCase().trim();
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || require('crypto').randomBytes(24).toString('hex');
const DEMO_ADMIN_NAME = process.env.DEMO_ADMIN_NAME || 'Demo Admin';

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

    // Seed the read-only demo account, only if that email isn't already
    // taken - an existing account is never modified.
    {
      const demoHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
      const demo = await pool.query(
        `INSERT INTO admins (name, email, role, timezone, password_hash)
         VALUES ($1, $2, $3, 'UTC', $4)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [DEMO_ADMIN_NAME, DEMO_ADMIN_EMAIL, ROLES.DEMO, demoHash]
      );
      console.log(
        demo.rowCount
          ? `Demo account created: ${DEMO_ADMIN_EMAIL} (role: ${ROLES.DEMO}, read-only)`
          : `Demo account email ${DEMO_ADMIN_EMAIL} already exists - left untouched.`
      );
    }

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
