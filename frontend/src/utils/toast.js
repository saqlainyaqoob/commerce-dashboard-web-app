// Minimal app-wide toast bus with no dependencies. Anything (including
// non-React code like the axios interceptor) can call showToast(); the single
// <ToastContainer /> mounted in App.jsx subscribes and renders them.
const listeners = new Set();
let nextId = 1;

export function showToast(message, { type = 'error', duration = 4500 } = {}) {
  const toast = { id: nextId++, message, type, duration };
  listeners.forEach((fn) => fn(toast));
}

export function subscribeToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
