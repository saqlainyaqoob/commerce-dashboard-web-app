import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from './ThemeToggle';
import NotificationPanel from './NotificationPanel';
import { NAV_ITEMS, PROFILE_ROUTE } from '../constants/nav';
import { logoutUser } from '../features/auth/authSlice';

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Real admin data from Postgres (see adminSlice.fetchProfile / GET
  // /api/admin/profile) - stays in sync automatically because this reads
  // the same Redux slice the Profile page writes back to after a save.
  const profile = useSelector((state) => state.admin.profile);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const profileMenuRef = useRef(null);

  // Real logout: revokes the refresh token server-side, clears the local
  // access token + socket connection, then leaves this page entirely.
  async function handleLogout() {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  }

  const current =
    NAV_ITEMS.find((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to))) ||
    (pathname.startsWith('/profile') ? PROFILE_ROUTE : NAV_ITEMS[0]);

    useEffect(() => {
  function handleOutsideClick(event) {
    if (
      menuOpen &&
      profileMenuRef.current &&
      !profileMenuRef.current.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  }

  document.addEventListener('mousedown', handleOutsideClick);

  return () => {
    document.removeEventListener('mousedown', handleOutsideClick);
  };
}, [menuOpen]);

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6
                        bg-card-light dark:bg-card-dark border-b border-black/5 dark:border-white/5
                        transition-colors duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden w-9 h-9 -ml-1 rounded-lg flex items-center justify-center shrink-0
                     text-slate-500 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-white/5"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">{current.label}</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{current.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <NotificationPanel />
        <ThemeToggle />

        {/* Real profile button - links to the actual admin account (name,
            avatar) fetched from Postgres, not a decorative placeholder. */}
        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Admin menu"
            className="w-10 h-10 rounded-full bg-gradient-cyan shadow-soft
                       flex items-center justify-center text-white text-sm font-bold
                       overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              initialsOf(profile?.name)
            )}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 dashboard-card p-2 z-20">
              <div className="px-2 py-1.5 mb-1 border-b border-black/5 dark:border-white/5">
                <p className="text-sm font-semibold truncate">{profile?.name || 'Loading…'}</p>
                <p className="text-xs text-slate-400 truncate">{profile?.email || ''}</p>
              </div>
              <Link
                to="/profile"
                className="block px-2 py-1.5 rounded-lg text-sm hover:bg-brand-50 dark:hover:bg-white/5"
              >
                View Profile
              </Link>
              <Link
                to="/settings"
                className="block px-2 py-1.5 rounded-lg text-sm hover:bg-brand-50 dark:hover:bg-white/5"
              >
                Store Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 mt-1 rounded-lg text-sm
                           text-accent-red hover:bg-accent-red/10 border-t border-black/5 dark:border-white/5 pt-2"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


