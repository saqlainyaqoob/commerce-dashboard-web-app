-- ==========================================================
--  Commerce Dashboard - Database Schema
-- ==========================================================

CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  sku             VARCHAR(50) UNIQUE NOT NULL,
  category        VARCHAR(80) NOT NULL,
  price           NUMERIC(10,2) NOT NULL,
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  reorder_level   INTEGER NOT NULL DEFAULT 10,   -- low-stock alert threshold, per product
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER REFERENCES customers(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | processing | shipped | delivered | cancelled
  total_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL
);

-- Every time stock changes (sale, restock, manual edit) we log it here.
-- This is what lets us show "why" an alert fired instead of just "stock is low".
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER REFERENCES products(id),
  alert_type    VARCHAR(20) NOT NULL,   -- 'low_stock' | 'out_of_stock' | 'restocked'
  stock_at_time INTEGER NOT NULL,
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Useful indexes for the analytics queries the dashboard runs constantly
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);

-- ==========================================================
--  Schema additions: soft-delete for products, admin account,
--  and store-wide settings (added when Orders/Inventory/
--  Revenue/Settings/Profile pages were built).
--  Written as additive ALTER/CREATE ... IF NOT EXISTS so this
--  file stays safe to re-run against a database that already
--  has the original tables.
-- ==========================================================

-- Products are never hard-deleted (order_items references them for
-- historical order data) - "deleting" a product just archives it.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Single admin account. There is no multi-user login/session system in
-- this app (no auth middleware, no JWT) - every request is treated as
-- the one admin, id = 1. The profile/password endpoints are real reads
-- and writes against this table, not placeholder data.
CREATE TABLE IF NOT EXISTS admins (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) UNIQUE NOT NULL,
  phone          VARCHAR(30),
  avatar_url     TEXT,
  role           VARCHAR(50) NOT NULL DEFAULT 'Administrator',
  timezone       VARCHAR(60) NOT NULL DEFAULT 'UTC',
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens for the production-style auth flow: the short-lived JWT
-- access token (Authorization header) is backed by a long-lived opaque
-- refresh token delivered as an httpOnly cookie. Only a SHA-256 hash of
-- the token is stored - the raw value only ever exists in the cookie -
-- so a database leak can't be used to mint sessions, and a row can be
-- revoked (logout, rotation) without needing a JWT blocklist.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_admin ON refresh_tokens(admin_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Single-row table (id is pinned to 1) holding store-wide configuration
-- edited from the Settings page. Real persisted values - low_stock_default_threshold
-- is actually used as the default reorder_level when a new product is
-- created without specifying one.
CREATE TABLE IF NOT EXISTS store_settings (
  id                            SMALLINT PRIMARY KEY DEFAULT 1,
  store_name                    VARCHAR(150) NOT NULL DEFAULT 'CommerceHQ',
  support_email                 VARCHAR(150),
  timezone                      VARCHAR(60) NOT NULL DEFAULT 'UTC',
  low_stock_default_threshold   INTEGER NOT NULL DEFAULT 10,
  order_auto_cancel_days        INTEGER NOT NULL DEFAULT 14,
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT store_settings_singleton CHECK (id = 1)
);
