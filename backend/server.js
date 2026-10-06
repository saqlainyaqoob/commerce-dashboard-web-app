require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const requireAuth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const registerSocketHandlers = require('./sockets');

if (!process.env.JWT_SECRET) {
  console.error(' JWT_SECRET is not set - copy backend/.env.example to backend/.env and set a real secret.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

const socketPath = process.env.SOCKET_IO_PATH || '/api/socket.io';
const configuredCorsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (configuredCorsOrigins.includes(origin)) return true;

  // Vercel provides VERCEL_URL as the active deployment hostname. This keeps
  // Socket.IO's polling handshake working on preview deployments too.
  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter(Boolean);

  if (vercelHosts.some((host) => origin === `https://${host}`)) {
    return true;
  }

  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  path: socketPath,
});

// Make io reachable from inside controllers via req.app.get('io')
app.set('io', io);

// Keep credentials enabled for the refresh-token cookie. In the Vercel
// Services deployment the browser talks to the API and Socket.IO on the same
// origin; CORS_ORIGIN remains available for local/separate-domain setups.
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Public - issuing a token is the only thing that happens without one.
app.use('/api/auth', authRoutes);

// Every other route is a private dashboard route and requires a valid
// JWT (see backend/middleware/auth.js). This is real request-level
// authorization, not just a login screen the API ignores afterwards.
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/orders', requireAuth, orderRoutes);
app.use('/api/inventory', requireAuth, inventoryRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

app.use(errorHandler);

// Socket.IO connections carry the same JWT (sent as the client's
// `auth.token` handshake field) so real-time order/inventory/settings
// events aren't reachable by an unauthenticated websocket connection -
// closing the gap a REST-only auth check would leave open.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

registerSocketHandlers(io);

// Vercel runs this HTTP server for both Express requests and Socket.IO
// WebSocket upgrades. During local development, `npm start`/`npm run dev`
// still starts the server normally.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Commerce Dashboard API running on http://localhost:${PORT}`);
  });
}

module.exports = server;
