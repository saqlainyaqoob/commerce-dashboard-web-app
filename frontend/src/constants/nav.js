import { LayoutDashboard, ShoppingCart, Boxes, TrendingUp, Settings } from 'lucide-react';

// Single source of truth for the sidebar links and the page titles the
// Navbar shows for each route - keeps both in sync without duplicating
// the list of pages in two files.
export const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', subtitle: 'Live e-commerce analytics' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', subtitle: 'Track and manage customer orders' },
  { to: '/inventory', icon: Boxes, label: 'Inventory', subtitle: 'Products, stock levels and alerts' },
  { to: '/revenue', icon: TrendingUp, label: 'Revenue', subtitle: 'Deeper revenue and sales analytics' },
  { to: '/settings', icon: Settings, label: 'Settings', subtitle: 'Store configuration' },
];

export const PROFILE_ROUTE = { to: '/profile', label: 'Profile', subtitle: 'Your admin account' };
