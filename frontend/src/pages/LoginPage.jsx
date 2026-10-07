import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogIn, Eye } from 'lucide-react';
import { login, demoLogin } from '../features/auth/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, status, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Already logged in - don't show the login form again.
  if (token) {
    const redirectTo = location.state?.from?.pathname || '/';
    return <Navigate to={redirectTo} replace />;
  }

  async function signIn(action) {
    const result = await dispatch(action);
    if (result.meta.requestStatus === 'fulfilled') {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    signIn(login({ email, password }));
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-light dark:bg-surface-dark p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-brand shadow-glow mb-3" />
          <h1 className="text-xl font-bold bg-gradient-brand bg-clip-text text-transparent">CommerceHQ</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="dashboard-card space-y-4">
          {error && (
            <div className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@commercehq.io"
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-gradient-brand text-white font-semibold
                       text-sm py-2.5 rounded-lg shadow-glow disabled:opacity-60"
          >
            <LogIn size={16} />
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex-1 h-px bg-black/5 dark:bg-white/10" />
              or
              <span className="flex-1 h-px bg-black/5 dark:bg-white/10" />
            </div>
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => signIn(demoLogin())}
              className="w-full flex items-center justify-center gap-2 bg-brand-50 dark:bg-white/5
                         text-brand-600 dark:text-brand-300 font-semibold text-sm py-2.5 rounded-lg disabled:opacity-60"
            >
              <Eye size={16} />
              Try Demo (read-only)
            </button>
        </form>
      </div>
    </div>
  );
}
