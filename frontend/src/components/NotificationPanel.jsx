import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useReadOnly from '../hooks/useReadOnly';
import {
  Bell,
  AlertTriangle,
  PackageX,
  PackageCheck,
  CheckCheck,
} from 'lucide-react';
import {
  markAlertRead,
  markAllAlertsRead,
} from '../features/inventory/inventorySlice';

const ICONS = {
  low_stock: {
    icon: AlertTriangle,
    color: 'text-accent-orange bg-accent-orange/10',
  },
  out_of_stock: {
    icon: PackageX,
    color: 'text-accent-red bg-accent-red/10',
  },
  restocked: {
    icon: PackageCheck,
    color: 'text-accent-green bg-accent-green/10',
  },
};

// Real notifications, not a decorative bell: backed by the same
// inventory_alerts table/API the Inventory page and Dashboard widget use
// (see backend/controllers/inventoryController.js). Unread count and
// read state are persisted in Postgres and pushed live over the same
// Socket.IO connection the rest of the dashboard already uses.
export default function NotificationPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { alerts } = useSelector((state) => state.inventory);
  const readOnly = useReadOnly();

  const [open, setOpen] = useState(false);

  // Reference to the entire notification component:
  // bell + notification dropdown
  const notificationRef = useRef(null);

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  // Close notification panel when clicking outside
 useEffect(() => {
  if (!open) return;

  function handleOutsideClick(event) {
    const notificationElement = notificationRef.current;

    if (!notificationElement) return;

    if (!notificationElement.contains(event.target)) {
      setOpen(false);
    }
  }

  document.addEventListener('click', handleOutsideClick, true);

  return () => {
    document.removeEventListener('click', handleOutsideClick, true);
  };
}, [open]);


  function handleAlertClick(alert) {
    console.log('NOTIFICATION CLICKED:', alert);

    if (!alert.is_read && !readOnly) {
      console.log('MARKING ALERT READ:', alert.id);
      dispatch(markAlertRead(alert.id));
    }

    setOpen(false);

    navigate(`/inventory?productId=${alert.product_id}`);
  }

  return (
    // This is the "parent div" of the panel - it anchors the absolute
    // positioning used from `sm:` (640px) up. On mobile the panel itself
    // switches to `fixed`, which positions relative to the VIEWPORT, not
    // this div - so this wrapper only needs to stay `relative` for the
    // larger-screen case.
    <div
      ref={notificationRef}
      className="relative"
    >
      {/* Notification Bell */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="w-10 h-10 rounded-xl flex items-center justify-center
                   bg-brand-50 dark:bg-white/5 text-brand-600 dark:text-brand-300"
      >
        <Bell size={18} />
      </button>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent-red
                     text-white text-[10px] flex items-center justify-center font-bold pointer-events-none"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {open && (
        <div
          className="fixed inset-x-3 top-16 max-h-[calc(100vh-5rem)]
                     sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 sm:max-h-none
                     dashboard-card p-0 z-20 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5">
            <div>
              <p className="text-sm font-semibold">
                Notifications
              </p>

              <p className="text-xs text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'You’re all caught up'}
              </p>
            </div>

            {unreadCount > 0 && !readOnly && (
              <button
                onClick={() => dispatch(markAllAlertsRead())}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="max-h-[calc(100vh-9rem)] sm:max-h-96 overflow-y-auto scrollbar-thin">
            {alerts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                No notifications yet.
              </p>
            )}

            {alerts.map((alert) => {
              const cfg =
                ICONS[alert.alert_type] || ICONS.low_stock;

              const Icon = cfg.icon;

              return (
                <button
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-black/5 dark:border-white/5
                              last:border-b-0 hover:bg-brand-50/60 dark:hover:bg-white/5
                              ${alert.is_read ? 'opacity-60' : ''}`}
                >
                  {/* Notification Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}
                  >
                    <Icon size={16} />
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      {alert.message}
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(
                        alert.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!alert.is_read && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
