# Commerce Dashboard

A full-stack, real-time e-commerce analytics dashboard for managing orders, inventory, revenue, store settings, and authenticated administrator accounts.

The application combines a **React 19 frontend**, **Node.js/Express backend**, **PostgreSQL database**, **Redux Toolkit state management**, and **Socket.IO real-time communication**. In the current development setup, PostgreSQL runs in a **Docker Compose container**, while the frontend and backend run through their normal npm development commands. Authentication is implemented using short-lived JWT access tokens, rotating httpOnly refresh tokens, and bcrypt password hashing.

---

## Table of Contents


1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Application Pages](#application-pages)
4. [Technology Stack](#technology-stack)
5. [Architecture Overview](#architecture-overview)
6. [Authentication & Security](#authentication--security)
7. [Real-Time Updates](#real-time-updates)
8. [Notifications](#notifications)
9. [Mobile Layout](#mobile-layout)
10. [Prerequisites](#prerequisites)
11. [Project Structure](#project-structure)
12. [Environment Configuration](#environment-configuration)
13. [Installation & Setup](#installation--setup)
14. [Database Setup](#database-setup)
15. [Start the Backend](#start-the-backend)
16. [Start the Frontend](#start-the-frontend)
17. [First Login](#first-login)
18. [End-to-End Verification](#end-to-end-verification)
19. [API Overview](#api-overview)
20. [Development Workflow](#development-workflow)
21. [Production Security Notes](#production-security-notes)
22. [Troubleshooting](#troubleshooting)
23. [Documentation](#documentation)
24. [Package Versions](#package-versions)

---

---

# Overview

**Commerce Dashboard** is a real-time administrative dashboard designed for an e-commerce business.

It provides authenticated administrators with a centralized interface for:

- Monitoring business KPIs
- Tracking customer orders
- Managing inventory
- Monitoring low-stock and out-of-stock products
- Analyzing revenue
- Viewing product and category performance
- Viewing top customers
- Managing store configuration
- Managing administrator profile information
- Changing administrator passwords
- Receiving real-time notifications

All dashboard analytics are backed by **real PostgreSQL data and SQL aggregations** rather than hardcoded or simulated values.

---

# Key Features

### Dashboard Analytics

- Revenue overview
- Order statistics
- Customer statistics
- Inventory statistics
- Period-over-period KPI deltas
- Revenue trend chart
- Category revenue breakdown
- Recent orders
- Inventory alerts

### Order Management

- Search orders
- Filter by order status
- Filter by date range
- Paginate results
- View complete order details
- View real order line items
- Update order status

### Inventory Management

- Search products
- Filter products
- Add products
- Edit products
- Archive products
- Increase/decrease stock inline
- Category-aware inventory management
- Low-stock detection
- Out-of-stock detection
- Restock notifications

### Revenue Analytics

- Revenue trends
- Category breakdown
- Best-selling products
- Top customers
- Real SQL-based aggregations

### Store Settings

Administrators can manage:

- Store name
- Support email
- Timezone
- Default reorder level
- Order auto-cancel window

Settings are persisted in PostgreSQL and synchronized through the application's real-time infrastructure.

### Administrator Profile

- Edit administrator profile
- Change password
- Bcrypt password verification
- JWT-based authentication

---

# Application Pages

| Route        | Page      | Description                                                                        |
| ------------ | --------- | ---------------------------------------------------------------------------------- |
| `/login`     | Login     | Public login page using bcrypt + JWT authentication.                               |
| `/`          | Overview  | KPI cards, revenue chart, category breakdown, recent orders, and inventory alerts. |
| `/orders`    | Orders    | Search, filtering, pagination, order details, line items, and status updates.      |
| `/inventory` | Inventory | Product management, search/filtering, stock adjustments, and inventory alerts.     |
| `/revenue`   | Revenue   | Revenue trends, category breakdown, best-selling products, and top customers.      |
| `/settings`  | Settings  | Store configuration and operational settings.                                      |
| `/profile`   | Profile   | Administrator profile management and password changes.                             |

> Every route except `/login` requires a valid JWT access token.

---

# Technology Stack

## Frontend

- React 19
- React Router
- Redux Toolkit
- React Redux
- Tailwind CSS v4
- Vite
- Axios
- Socket.IO Client
- Lucide React

## Backend

- Node.js
- Express
- PostgreSQL
- `pg`
- JSON Web Token (`jsonwebtoken`)
- `bcryptjs`
- Socket.IO
- `cookie-parser`
- `cors`
- `express-rate-limit`

## Database

- PostgreSQL

## Development

- Nodemon
- Docker
- Docker Compose

> The current implementation uses Docker Compose to run PostgreSQL. The frontend and backend are still run with `npm run dev` during local development.

---

# Architecture Overview

The application follows a standard full-stack architecture with PostgreSQL running through Docker Compose during local development:

```text
┌───────────────────────────────┐
│          React 19             │
│                               │
│ Pages / Components / Redux    │
└───────────────┬───────────────┘
                │
                │ HTTP / Axios
                │
                ▼
┌───────────────────────────────┐
│       Express Backend         │
│                               │
│ Routes → Controllers → DB     │
│             │                 │
│             └── Auth          │
└───────────────┬───────────────┘
                │
                │ SQL
                ▼
┌────────────────────────────────────┐
│      Docker Compose Environment    │
│                                    │
│   ┌────────────────────────────┐   │
│   │ PostgreSQL 18 (Alpine)     │   │
│   │                            │   │
│   │ Products / Orders /        │   │
│   │ Customers / Admins /       │   │
│   │ Settings / Alerts /        │   │
│   │ Refresh Tokens             │   │
│   └────────────────────────────┘   │
└────────────────────────────────────┘

             ▲
             │
             │ Socket.IO
             │
┌────────────┴──────────────────┐
│      Real-Time Events         │
│                               │
│ Orders / Inventory / Alerts   │
│ Settings / Authentication     │
└───────────────────────────────┘

```

The frontend communicates with the backend through REST APIs for normal CRUD and analytics operations.

The backend communicates with the PostgreSQL instance running in Docker Compose.

Socket.IO is used for real-time synchronization where changes need to appear across open browser tabs or sessions without manually refreshing the page.

---

# Authentication & Security

Authentication is implemented as a two-token system.

## 1. Password Security

Passwords are never stored in plaintext.

Passwords are hashed using:

```javascript
bcrypt.hash(password, 10)

```

The stored database value is a bcrypt hash rather than the original password.

During login, the submitted password is checked using:

```javascript
bcrypt.compare(password, passwordHash)

```

---

## 2. Access Token

After successful authentication:

```text
User
 │
 │ email + password
 ▼
POST /api/auth/login
 │
 │ bcrypt verification
 ▼
JWT access token

```

The access token is:

- JWT-based
- Signed using `JWT_SECRET`
- Short-lived
- Valid for approximately 15 minutes by default
- Sent by the frontend using the `Authorization` header

Example:

```http
Authorization: Bearer <access-token>

```

---

## 3. Refresh Token

The refresh token is intentionally **not a JWT**.

It is an opaque, randomly generated token.

The server stores only a SHA-256 hash of the refresh token in the database.

```text
Browser
   │
   │ httpOnly refresh cookie
   ▼
Express
   │
   │ hash token
   ▼
PostgreSQL
   │
   └── refresh_tokens

```

This allows the server to revoke refresh sessions without maintaining a JWT blocklist.

---

## 4. Refresh Token Rotation

Every successful refresh request rotates the refresh token.

```text
Old refresh token
       │
       ▼
POST /api/auth/refresh
       │
       ├── revoke old token
       │
       └── create new refresh token
                    │
                    ▼
             New httpOnly cookie

```

This reduces the usefulness of a replayed refresh token.

---

## 5. Logout

Logging out does more than remove frontend state.

The backend:

1. Revokes the refresh-token record.
2. Clears the refresh cookie.
3. Prevents the revoked refresh token from being reused.

Endpoint:

```http
POST /api/auth/logout

```

---

## 6. HTTP-Only Refresh Cookie

The refresh token is stored in an:

```text
httpOnly
sameSite=lax

```

cookie.

Frontend JavaScript cannot directly read the refresh token.

This helps reduce exposure to XSS-based token theft.

The access token is stored separately in `localStorage` and is deliberately short-lived.

---

## 7. Automatic Access-Token Refresh

The frontend uses an Axios interceptor to handle expired or invalid access tokens.

When the frontend makes a protected API request, it sends the current access token in the `Authorization` header.

If the backend determines that the access token is expired or invalid, it responds with:

```http
401 Unauthorized
```

The Axios interceptor then attempts to refresh the access token using the httpOnly refresh-token cookie.

```text
Protected API Request
        │
        ▼
Authorization: Bearer <access-token>
        │
        ▼
     Backend
        │
        │ Token expired/invalid
        ▼
   401 Unauthorized
        │
        ▼
POST /api/auth/refresh
        │
        ▼
New access token
        │
        ▼
Retry original request
```

If the refresh succeeds, the original request is automatically retried with the new access token.

If the refresh fails, the frontend clears the authentication state and redirects the administrator to:

```text
/login
```

The relevant frontend logic is located in:

```text
frontend/src/api/axiosClient.js
```

---

## 8. Authentication Middleware

Protected API routes use:

```text
backend/middleware/auth.js

```

The middleware rejects:

- Missing tokens
- Malformed tokens
- Invalid tokens
- Expired tokens

with:

```http
401 Unauthorized

```

---

## 9. Socket.IO Authentication

REST APIs are not the only protected part of the application.

The Socket.IO handshake is authenticated as well.

This prevents an unauthenticated browser from subscribing to real-time order, inventory, or settings events.

JWT verification explicitly uses:

```text
HS256

```

to prevent algorithm-confusion attacks.

---

## 10. Login Rate Limiting

The login endpoint is protected with `express-rate-limit`.

Current configuration:

```text
10 attempts / 15 minutes / IP

```

This adds protection against repeated credential-guessing attempts while bcrypt deliberately makes password verification computationally expensive.

---

# Real-Time Updates

Commerce Dashboard uses **Socket.IO** to keep multiple open browser sessions synchronized.

Examples include:

```text
Inventory changes
       │
       ▼
Backend
       │
       ├── Update PostgreSQL
       │
       └── Emit Socket.IO event
                    │
             ┌──────┴──────┐
             ▼             ▼
          Browser 1     Browser 2

```

This allows changes made in one browser tab to appear in another without manually refreshing.

Real-time functionality is used for areas such as:

- Inventory changes
- Inventory alerts
- Notification read state
- Order-related updates
- Store settings synchronization

---

# Notifications

The navbar notification bell is backed by the same PostgreSQL inventory-alert system used by the dashboard and inventory pages.

It is **not a hardcoded notification counter**.

## Unread Count

Unread notifications are calculated from real alert records:

```javascript
alerts.filter(alert => !alert.is_read).length

```

Alerts are initially loaded from:

```http
GET /api/inventory/alerts

```

and then kept synchronized through Socket.IO.

---

## Mark Notification as Read

Clicking a notification calls:

```http
PATCH /api/inventory/alerts/:id/read

```

The state change is persisted in PostgreSQL.

The notification then navigates the administrator to:

```text
/inventory

```

---

## Mark All Notifications as Read

The application also supports:

```http
PATCH /api/inventory/alerts/read-all

```

The backend broadcasts events such as:

```text
inventory:alert-read
inventory:alerts-read-all

```

so multiple open tabs remain synchronized.

---

# Mobile Layout

The dashboard uses a responsive navigation system.

## Desktop

On medium-sized screens and larger:

```text
Sidebar
   │
   ├── Navigation
   │
   └── Main Content

```

The sidebar remains visible as a static column.

## Mobile

On smaller screens, the sidebar becomes an off-canvas drawer.

It can be opened using the navbar hamburger button and closed by:

- Tapping the close button
- Tapping the backdrop
- Selecting a navigation link
- Navigating to another route

---

# Prerequisites

Before running the project, make sure the following are installed.

### Required

```text
Node.js
npm
Docker
Docker Compose
Git

```

### Optional

```text
PostgreSQL

```

PostgreSQL is optional for the current development workflow because the database runs through Docker Compose.

A modern Node.js version is recommended. Docker Desktop/Engine with Docker Compose v2 is also required for the current containerized database workflow.

Verify your installation:

```bash
node --version
npm --version
psql --version

```

If using Docker:

```bash
docker --version
docker compose version

```

---

# Project Structure

The repository is organized into separate frontend and backend applications, with PostgreSQL managed through Docker Compose.

```text
commerce-dashboard/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── db/
│   ├── seed.js
│   ├── migrate.js
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   └── ...
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
│
├── docker-compose.yml
├── .gitignore
├── .env
└── README.md

```

> The root `.env` is used for local Docker Compose configuration/secrets. Backend and frontend `.env` files contain application-specific environment variables.

# Environment Configuration

The current implementation uses PostgreSQL connection variables (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`) rather than a single `DATABASE_URL`.

There are two local environment layers:

1. **Root `.env`** — used by Docker Compose for local PostgreSQL configuration/secrets.
2. **`backend/.env`** — used by the Express backend to connect to PostgreSQL and configure authentication/application behavior.
3. **`frontend/.env`** — used for frontend API configuration.


## Backend Environment

Start by creating the backend environment file:

```bash
cd backend
cp .env.example .env

```

Then edit:

```bash
nano .env

```

The backend environment uses configuration in this form:

```env
# PostgreSQL connection
PGHOST=localhost
PGPORT=<port-mapped-by-docker-compose>
PGDATABASE=commerce_dashboard
PGUSER=commerce_admin
PGPASSWORD=*******

# Server
PORT=5000
CORS_ORIGIN=http://localhost:5173

# Inventory / real-time behavior
LOW_STOCK_THRESHOLD=10
SOCKET_IO_PATH=/api/socket.io

# Authentication / administrator initialization
JWT_SECRET=...
DEFAULT_ADMIN_EMAIL=...
DEFAULT_ADMIN_PASSWORD=...

```

Use the PostgreSQL host port configured by `docker-compose.yml` for `PGPORT`. 

The backend must use the same host port that Docker exposes for the PostgreSQL container.

The exact variables available in project are documented in:

```text
backend/.env.example

```

## Docker Environment

The current development setup starts PostgreSQL through:

```bash
docker compose up -d

```

The Docker Compose configuration is the source of truth for the PostgreSQL image, container configuration, and host-port mapping.


## JWT Secret

Generate a strong random secret rather than manually inventing a short password-like value.

For example:

```bash
openssl rand -base64 64

```

Copy the generated value into:

```env
JWT_SECRET=your-generated-secret

```

Never commit the real value to Git.

# Installation & Setup

The current development setup uses **Docker Compose for PostgreSQL** and runs the frontend/backend with npm.

A local PostgreSQL installation is still possible, but it is an alternative setup rather than the primary development path.

---

# 1. Database Setup

## Option A — Docker

From the project root:

```bash
docker compose up -d

```

Verify the database container:

```bash
docker compose ps

```

The current PostgreSQL image is:

```text
postgres:18-alpine
```

The project uses Docker Compose to provide a repeatable local PostgreSQL environment for the backend.

You can also inspect the container directly:

```bash
docker ps

```

---

## Option B — Local PostgreSQL

If you choose not to use Docker, PostgreSQL can be installed and run locally. In that case, create/configure the database and application role according to the values in:

```text
backend/.env

```

Make sure the configured database name, username, password, host, and port match the PostgreSQL instance being used by the backend.

For the current project workflow, Docker Compose is the recommended local database setup.

---

# 2. Install Backend Dependencies

```bash
cd backend
npm install

```

---

# 3. Configure Backend Environment

Create the environment file:

```bash
cp .env.example .env

```

Open it:

```bash
nano .env

```

Set your database credentials and generate a secure JWT secret.

---

# 4. Run Database Migration

Run:

```bash
npm run migrate

```

The migration creates the required database tables and initializes:

- Database schema
- Default administrator account
- Store settings row
- Authentication-related tables

The migration prints the administrator credentials used for the initial account.

The default values are:

```text
Email:
admin@commercehq.io

Password:
changeme123

```

These values can be changed through:

```env
DEFAULT_ADMIN_EMAIL=...
DEFAULT_ADMIN_PASSWORD=...

```

> Change the default administrator password immediately after your first successful login.

---

# 5. Seed Demo Data

After the migration:

```bash
npm run seed

```

The seed script loads realistic randomized demo data for:

- Products
- Customers
- Orders
- Order items
- Inventory-related data

The current seed configuration creates **100 demo orders** and multiple products across the dashboard's supported categories.

The seed operation does **not** modify the administrator or store settings data.

This separation makes it safer to refresh demo/business data without resetting authentication configuration.

---

# Start the Backend

Make sure the PostgreSQL Docker container is already running:

```bash
docker compose ps

```

Then, from the backend directory:

```bash
cd backend
npm run dev

```

The backend should start on:

```text
http://localhost:5000

```

The public health endpoint is:

```text
http://localhost:5000/api/health

```

Test it:

```bash
curl http://localhost:5000/api/health

```

---

# Start the Frontend

Open another terminal.

From the project root:

```bash
cd frontend

```

Create the frontend environment file:

```bash
cp .env.example .env

```

Install dependencies:

```bash
npm install

```

Start Vite:

```bash
npm run dev

```

The frontend should be available at:

```text
http://localhost:5173

```

Open it in your browser:

```text
http://localhost:5173

```

---

# First Login

Use the administrator credentials printed during migration.

Example:

```text
Email:
admin@commercehq.io

Password:
changeme123

```

After logging in:

1. Open **Profile**.
2. Change the default password.
3. Verify that the dashboard loads real data.
4. Verify inventory alerts.
5. Verify orders and revenue.
6. Test the notification bell.
7. Open another browser tab to verify real-time synchronization.

---

# End-to-End Verification

The following commands can be used to verify the complete Docker + database + authentication flow.

## 0. Verify PostgreSQL Container

From the project root:

```bash
docker compose ps

```

Confirm that the PostgreSQL service is running before starting the backend.

---

## 1. Health Check

The health endpoint is public:

```bash
curl http://localhost:5000/api/health

```

---

## 2. Verify Protected Route

A protected endpoint should reject requests without authentication:

```bash
curl http://localhost:5000/api/orders

```

Expected result:

```text
401 Unauthorized

```

---

## 3. Login

Save the refresh cookie into `cookies.txt`:

```bash
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@commercehq.io","password":"changeme123"}'

```

The response should contain an access token.

---

## 4. Use the Access Token

Replace `<ACCESS_TOKEN>` with the token returned from login:

```bash
curl http://localhost:5000/api/orders \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

```

The request should now be authenticated.

---

## 5. Refresh the Access Token

Use the saved refresh cookie:

```bash
curl -b cookies.txt -c cookies.txt \
  -X POST http://localhost:5000/api/auth/refresh

```

The backend should rotate the refresh token and issue a new access token.

---

## 6. Logout

Logout revokes the refresh token server-side:

```bash
curl -b cookies.txt \
  -X POST http://localhost:5000/api/auth/logout

```

The refresh session should no longer be usable.

---

# API Overview

The backend exposes REST APIs under:

```text
/api

```

## Authentication

```http
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout

```

---

## Health

```http
GET /api/health

```

---

## Analytics

```http
GET /api/analytics/summary
GET /api/analytics/revenue
GET /api/analytics/category-breakdown
GET /api/analytics/top-products
GET /api/analytics/top-customers

```

Analytics are calculated from PostgreSQL data using SQL aggregations.

---

## Orders

The orders API supports:

- Searching
- Filtering
- Pagination
- Order details
- Status updates

Example base endpoint:

```http
GET /api/orders

```

---

## Inventory

Inventory endpoints include:

```http
GET /api/inventory/products
GET /api/inventory/alerts
PATCH /api/inventory/products/:id/stock
PATCH /api/inventory/alerts/:id/read
PATCH /api/inventory/alerts/read-all

```

---

## Administrator

Administrator endpoints include profile and password management.

```http
GET /api/admin/profile
PATCH /api/admin/profile
PATCH /api/admin/password

```

---

## Store Settings

Store configuration is available through the settings API.

```http
GET /api/settings
PATCH /api/settings

```

> The exact request bodies and optional query parameters should be checked in the corresponding backend route/controller files.

---

# Data Flow

A typical dashboard request follows this flow:

```text
React Component
      │
      ▼
Redux / Axios
      │
      ▼
Express Route
      │
      ▼
Authentication Middleware
      │
      ▼
Controller
      │
      ▼
PostgreSQL
      │
      ▼
Controller Response
      │
      ▼
Redux Store
      │
      ▼
React UI

```

For real-time changes:

```text
User Action
    │
    ▼
Express Controller
    │
    ├── PostgreSQL update
    │
    └── Socket.IO event
             │
             ▼
       Connected Clients
             │
             ▼
        Redux / UI Update

```

---

# Vercel Deployment

The project is prepared for a **single Vercel Services deployment** containing both the Vite frontend and the Express + Socket.IO backend.

Vercel currently supports WebSocket connections in public beta, including higher-level libraries such as Socket.IO. The deployment uses Vercel's Services routing so the frontend and backend share one origin. This avoids a separate frontend/backend domain and keeps the refresh-token cookie same-origin.

The production request flow is:

```text
Browser
   │
   ├── /              ──────────────► Vite frontend service
   │
   ├── /api/*         ──────────────► Express backend service
   │
   └── /api/socket.io ──────────────► Socket.IO on the backend service
                                      │
                                      ▼
                                  Supabase
                                  PostgreSQL
```

## Why the internal timer was removed

The previous backend used `node-cron` every five seconds to:

1. Sweep every product for inventory-alert changes.
2. Broadcast an `analytics:tick` event so dashboards refetched analytics.

That design depends on a continuously running process. It is unnecessary for the dashboard's normal application flow because product stock changes already call `evaluateProduct()` directly, and the controllers already emit Socket.IO events after real changes.

The Vercel version therefore uses **event-driven realtime updates**:

- Inventory changes → `inventory:updated` + alert evaluation.
- Order status changes → `order:updated` + dashboard analytics refresh.
- Store setting changes → `settings:updated` + dashboard summary refresh.
- Notification changes → existing alert-read events.

This removes the background `node-cron` process and the `REALTIME_TICK_SECONDS` setting.

One trade-off remains: direct database changes made outside the application's API will no longer be discovered automatically by a periodic sweep. The application should therefore make business-data changes through its API/controllers.

## Vercel project configuration

The root `vercel.json` defines two Services:

- `frontend` → Vite
- `backend` → Express

Public routing sends:

```text
/api/*          → backend
everything else → frontend
```

The frontend also has an SPA fallback to `index.html`, so React Router routes such as `/orders` and `/inventory` continue to work after a page refresh.

## Backend environment variables

Configure these in the Vercel project:

```env
PGHOST=<Supabase pooler host>
PGPORT=5432
PGDATABASE=postgres
PGUSER=<Supabase pooler user>
PGPASSWORD=<Supabase pooler password>

JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN_DAYS=7

NODE_ENV=production
CORS_ORIGIN=https://<your-production-domain>
SOCKET_IO_PATH=/api/socket.io
LOW_STOCK_THRESHOLD=10
```

`DEFAULT_ADMIN_*` variables are only needed when running the migration/bootstrap process. Do not put the real database password or JWT secret in the frontend environment.

Vercel's system variables `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` are also accepted automatically for Socket.IO polling-origin checks when system environment variables are exposed.

## Frontend environment variables

For the single-project Vercel Services deployment, no API URL is required because the code defaults to same-origin paths:

```text
/api
/api/socket.io
```

The frontend `.env.example` still contains the localhost values used for normal local development.

## Deploying

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Select the **Services** framework if Vercel asks for the project framework.
4. Keep the repository root as the project root so Vercel can read the root `vercel.json`.
5. Add the backend environment variables above.
6. Make sure your Supabase database already contains the Commerce Dashboard schema/data.
7. Deploy.
8. Test:
   - `/api/health`
   - `/login`
   - login and logout
   - dashboard data
   - inventory update
   - order status update
   - notification read state
   - Socket.IO updates from two browser tabs

### Important realtime limitation

Vercel WebSocket connections are pinned to a Function instance and can be closed when the instance reaches its maximum duration. The frontend already has Socket.IO reconnection enabled, so the browser can reconnect.

This project currently uses the backend instance's Socket.IO emitter as its realtime fan-out mechanism. For a small portfolio dashboard this is a reasonable deployment shape, but if the application later scales to multiple backend instances and must guarantee cross-instance broadcasts, add an external Socket.IO adapter/pub-sub layer such as Redis.

# Development Workflow

For normal development, start PostgreSQL through Docker Compose, then run the backend and frontend in separate terminals.

## Database — Docker Compose

From the project root:

```bash
docker compose up -d

```

Verify:

```bash
docker compose ps

```

## Terminal 1 — Backend

```bash
cd backend
npm run dev

```

## Terminal 2 — Frontend

```bash
cd frontend
npm run dev

```

Then open:

```text
http://localhost:5173

```

---

# Useful Development Commands

## Docker / PostgreSQL

Start the PostgreSQL container:

```bash
docker compose up -d

```

Show service status:

```bash
docker compose ps

```

Stop the services without deleting database volumes:

```bash
docker compose down

```

Inspect PostgreSQL/container logs:

```bash
docker compose logs

```

The current database container can also be inspected directly:

```bash
docker logs commerce_dashboard_db

```

> Avoid `docker compose down -v` unless you intentionally want to delete the persisted PostgreSQL data.

---

## Backend

Install dependencies:

```bash
npm install

```

Start development server:

```bash
npm run dev

```

Run database migration:

```bash
npm run migrate

```

Seed demo data:

```bash
npm run seed

```

---

## Frontend

Install dependencies:

```bash
npm install

```

Start development server:

```bash
npm run dev

```

Build the frontend:

```bash
npm run build

```

Preview the production build:

```bash
npm run preview

```

---

# Production Security Notes

Before deploying the application publicly, review the following items.

## JWT Secret

Never use a simple or predictable secret.

Generate one using:

```bash
openssl rand -base64 64

```

Store it securely as:

```env
JWT_SECRET=...

```

Never commit it to Git.

---

## Administrator Password

Never deploy with:

```text
changeme123

```

Use a strong unique administrator password.

---

## Environment Files

Do not commit:

```text
.env

```

to source control.

Use:

```text
.env.example

```

for documenting required configuration without exposing secrets.

---

## Refresh Cookie

The development configuration uses:

```text
sameSite=lax

```

This works when frontend and backend share the same registrable domain.

For example:

```text
localhost:5173
localhost:5000

```

For production deployments where the frontend and backend are on entirely different domains, configure the refresh cookie appropriately in:

```text
backend/utils/tokens.js

```

A cross-site cookie configuration generally requires:

```text
sameSite=none
secure=true

```

HTTPS is required when using `secure=true`.

---

## CORS

The backend should only allow trusted frontend origins.

For local development:

```env
CORS_ORIGIN=http://localhost:5173

```

Do not use an unrestricted production CORS configuration.

---

## Database Credentials

Never expose database credentials to the frontend.

Database credentials belong exclusively in the backend environment.

For Docker deployments, keep PostgreSQL credentials in environment variables or a secure secret-management system rather than hardcoding them in `docker-compose.yml`.

Avoid exposing the PostgreSQL port publicly in production unless there is a specific operational requirement and the access is appropriately restricted.

---

# Troubleshooting

## Backend Does Not Start

Check:

```bash
cd backend
npm run dev

```

If the server exits because `JWT_SECRET` is missing, verify:

```bash
cat .env

```

and make sure a valid secret exists:

```env
JWT_SECRET=...

```

---

## PostgreSQL Docker Container Does Not Start

Check the Compose service status:

```bash
docker compose ps

```

Then inspect the PostgreSQL/container logs:

```bash
docker compose logs

```

You can also inspect the current database container directly:

```bash
docker logs commerce_dashboard_db

```

Common causes include an occupied host port, an invalid environment value, or an existing container using the same configuration.

If the host PostgreSQL port conflicts with another service, update the host-port mapping in `docker-compose.yml` and make the backend `PGPORT` match that mapping.

---

## Database Connection Error

Verify that PostgreSQL is running.

For Docker Compose:

```bash
docker compose ps

```

If needed, inspect the database logs:

```bash
docker compose logs postgres

```

For local PostgreSQL:

```bash
sudo systemctl status postgresql

```

Then verify the database settings in:

```text
backend/.env

```

For the Dockerized setup, make sure `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` match the PostgreSQL service exposed by `docker-compose.yml`.

---

## Login Returns 401

Check:

1. The administrator exists.
2. The email is correct.
3. The password is correct.
4. `password_hash` contains a bcrypt hash.
5. The account is active.
6. The backend is connected to the expected database.

The administrator can be checked from PostgreSQL:

```sql
SELECT id, name, email, role, is_active
FROM admins;

```

---

## Frontend Cannot Reach Backend

Verify the backend:

```bash
curl http://localhost:5000/api/health

```

Then verify the frontend API configuration.

For local development, the frontend should communicate with:

```text
http://localhost:5000

```

Also verify:

```env
CORS_ORIGIN=http://localhost:5173

```

The browser origin and backend CORS configuration must match.

---

## Dashboard Shows No Data

Make sure the seed script has been executed:

```bash
cd backend
npm run seed

```

Then verify that the database contains products, customers, and orders.

---

## Notifications Are Not Updating

Check:

1. The backend is running.
2. Socket.IO is connecting successfully.
3. The browser has a valid access token.
4. Inventory alerts exist in PostgreSQL.
5. The browser console does not report a Socket.IO connection error.

---

# Database Model

The application uses PostgreSQL to persist core business and authentication data.

Important tables include:

```text
admins
products
customers
orders
order_items
inventory_alerts
store_settings
refresh_tokens

```

### Relationship Overview

```text
customers
    │
    └── orders
           │
           └── order_items
                    │
                    └── products

products
    │
    └── inventory_alerts

admins
    │
    └── refresh_tokens

store_settings

```

This allows the dashboard to generate analytics directly from relational business data.

---

# Documentation

The current repository README is the primary setup and architecture reference for the implemented project.

If the original project walkthrough documents are retained separately, they may include:

- Step-by-step project walkthrough
- ELI5-style explanations
- Data-flow explanations
- Development concepts
- Original implementation guidance

The authentication/security details in this README should be treated as the more current reference for the authentication architecture.

# Package Versions

| Package             | Version   |
| ------------------- | --------- |
| `react`             | `^19.2.0` |
| `react-dom`         | `^19.2.0` |
| `react-router-dom`  | `^7.1.1`  |
| `tailwindcss`       | `^4.3.1`  |
| `@tailwindcss/vite` | `^4.3.1`  |
| `vite`              | `^7.0.0`  |
| `@reduxjs/toolkit`  | `^2.12.0` |
| `react-redux`       | `^9.2.0`  |
| `express`           | `^4.21.2` |
| `jsonwebtoken`      | `^9.0.2`  |
| `bcryptjs`          | `^2.4.3`  |
| `socket.io`         | `^4.8.1`  |
| `socket.io-client`  | `^4.8.1`  |
| `pg`                | `^8.13.1` |

> Database runtime: `postgres:18-alpine` through Docker Compose.

---

# Quick Start — Summary

If the environment is already configured, the shortest current setup path is:

### 1. Start PostgreSQL

From the project root:

```bash
docker compose up -d

```

Verify:

```bash
docker compose ps

```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
npm install

```

Configure the PostgreSQL connection variables, authentication settings, and generate:

```bash
openssl rand -base64 64

```

Use the generated value for:

```env
JWT_SECRET=...

```

### 3. Initialize Database

```bash
npm run migrate
npm run seed

```

### 4. Start Backend

```bash
npm run dev

```

Backend:

```text
http://localhost:5000

```

### 5. Start Frontend

Open another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev

```

Frontend:

```text
http://localhost:5173

```

### 6. Login

Open:

```text
http://localhost:5173/login

```

Use the administrator credentials printed by the migration.

### 7. Change the Default Password

After logging in:

```text
Profile → Change Password

```

### 8. Verify the Dashboard

Confirm that:

```text
✓ PostgreSQL Docker container is running
✓ Dashboard analytics load
✓ Orders are displayed
✓ Inventory is displayed
✓ Revenue data is displayed
✓ Inventory alerts appear
✓ Notification badge works
✓ Real-time updates work
✓ Profile settings work
✓ Logout works

```

# License

This project is intended as a portfolio/full-stack application demonstrating modern e-commerce dashboard architecture, authentication, database integration, REST APIs, state management, and real-time communication.
