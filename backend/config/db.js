const { Pool } = require('pg');
require('dotenv').config();

// One shared PostgreSQL pool. Vercel Fluid compute can reuse the module-level
// pool across concurrent requests handled by the same function instance.
// The production database should use Supabase's pooler endpoint.
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 10,                     // max simultaneous clients
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
