import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { subscribeToasts } from '../utils/toast';

// Renders toasts raised through utils/toast.js. Identical messages are
// de-duplicated (a repeat click just refreshes the existing toast).
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const timers = new Map();

    function dismiss(id) {
      clearTimeout(timers.get(id));
      timers.delete(id);
      setToasts((list) => list.filter((t) => t.id !== id));
    }

    const unsubscribe = subscribeToasts((toast) => {
      setToasts((list) => {
        const dup = list.find((t) => t.message === toast.message);
        if (dup) {
          clearTimeout(timers.get(dup.id));
          timers.delete(dup.id);
        }
        return [...list.filter((t) => t !== dup), toast].slice(-3);
      });
      timers.set(toast.id, setTimeout(() => dismiss(toast.id), toast.duration));
    });

    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto dashboard-card flex items-start gap-3 py-3 px-4 shadow-soft"
        >
          <p className={`flex-1 text-sm ${t.type === 'error' ? 'text-accent-red' : ''}`}>{t.message}</p>
          <button
            onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            aria-label="Dismiss"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
