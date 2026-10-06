import { io } from 'socket.io-client';

const TOKEN_KEY = 'commercehq_token';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/api/socket.io';

// A single socket connection shared by the whole app. In production the
// frontend and backend are served by the same Vercel project/origin, while
// local development can still point at the standalone backend on port 5000.
// The JWT is sent in the handshake `auth` payload so the server can reject
// unauthenticated websocket connections.
const socket = io(SOCKET_URL, {
  path: SOCKET_PATH,
  autoConnect: false,
  reconnectionAttempts: 5,
  auth: (cb) => cb({ token: localStorage.getItem(TOKEN_KEY) }),
});

export default socket;
