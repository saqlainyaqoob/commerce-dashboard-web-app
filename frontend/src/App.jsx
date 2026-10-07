import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ToastContainer from './components/ToastContainer';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import RevenuePage from './pages/RevenuePage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import useRealtimeSync from './hooks/useRealtimeSync';
import useReadOnly from './hooks/useReadOnly';
import { fetchProfile } from './features/admin/adminSlice';
import { fetchSettings } from './features/settings/settingsSlice';
import { fetchAlerts } from './features/inventory/inventorySlice';

// Gate for every private route: no token -> bounce to /login, remembering
// where the user was headed so login can send them back afterwards.
function RequireAuth() {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Everything that needs the sidebar/navbar chrome and the live socket
// connection - only ever rendered once RequireAuth has confirmed a token.
function DashboardLayout() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  const revenueRange = useSelector((state) => state.revenue.range);
  const token = useSelector((state) => state.auth.token);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const readOnly = useReadOnly();
  const location = useLocation();

  // Keep the <html> class in sync with Redux theme state.
  // Tailwind's darkMode:'class' strategy reads this class to flip
  // every dark: utility in the app at once.
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [themeMode]);

  // Close the mobile drawer on every route change (NavLink clicks already
  // do this too, but this also covers programmatic navigation).
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // One hook call wires up all socket -> redux live updates for the app
  // (and only opens the socket once `token` is present).
  useRealtimeSync(revenueRange, token);

  // Admin profile, store settings, and inventory alerts (for the real
  // notification bell) are used across pages regardless of which one the
  // admin lands on first, so load them once here rather than only inside
  // whichever page widget happens to render them.
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSettings());
    dispatch(fetchAlerts());
  }, [dispatch]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={() => setMobileSidebarOpen((v) => !v)} />
        {readOnly && (
          <div className="px-4 sm:px-6 py-1.5 text-xs text-center font-medium text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-white/5">
            Demo mode - you can explore everything, but changes are disabled.
          </div>
        )}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/revenue" element={<RevenuePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
