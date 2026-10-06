import axios from 'axios';

const TOKEN_KEY = 'commercehq_token';
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

// One shared axios instance so the base URL / headers live in one place.
// withCredentials lets the browser send/receive the httpOnly refresh-token
// cookie (see backend/utils/tokens.js) - the cookie itself is never
// touched by this file or any frontend JS, only the browser handles it.
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// A separate, un-intercepted instance for the refresh call itself - using
// axiosClient here would recurse into its own response interceptor.
const refreshClient = axios.create({ baseURL: BASE_URL, withCredentials: true });

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Concurrent requests that all 401 at once (e.g. several widgets fetching
// on page load with an expired access token) must trigger only ONE
// refresh call, not one per request - every request awaits the same
// in-flight promise.
let refreshPromise = null;

function attemptRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh')
      .then(({ data }) => {
        localStorage.setItem(TOKEN_KEY, data.token);
        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function goToLogin() {
  localStorage.removeItem(TOKEN_KEY);
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// If an access token has expired (401), first try the silent refresh
// flow - the httpOnly cookie may still be valid even though the short
// -lived access token isn't - and only fall back to a full logout/redirect
// if that refresh itself fails. This is what "handle expired/invalid auth
// properly" means in a refresh-token architecture: most expirations
// should be invisible to the user, not an interruption.
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const status = response?.status;
    const isLoginCall = config?.url?.startsWith('/auth/login');

    // A failed login (wrong password) is an expected, user-facing 401 -
    // let LoginPage show its own error, with no refresh attempt or redirect.
    if (status === 401 && isLoginCall) {
      return Promise.reject(error);
    }

    if (status === 401 && !config._retried) {
      config._retried = true;
      try {
        const newToken = await attemptRefresh();
        config.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(config);
      } catch (refreshErr) {
        goToLogin();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export { TOKEN_KEY };
export default axiosClient;
