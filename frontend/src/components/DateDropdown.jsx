import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function fromISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatDisplay(iso) {
  const d = fromISO(iso);
  if (!d) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// A themed, portal-rendered replacement for native <input type="date">.
//
// Why this exists: Chrome's native date-picker calendar popup follows
// the OPERATING SYSTEM's theme setting, not the page's own CSS - not
// even the `color-scheme` property, which *does* work for native
// <select> (verified separately). If the user's OS is in light mode,
// the popup renders light no matter what dark-mode state this app is
// in, and no page-level CSS can override that. Rendering our own
// calendar (portal + fixed position anchored to the trigger, exactly
// like components/Dropdown.jsx) puts every pixel back under our own
// dark: styling and removes the OS as a variable entirely.
export default function DateDropdown({
  value,             // ISO 'YYYY-MM-DD' or ''
  onChange,          // (isoStringOrEmpty) => void
  placeholder = 'Select date',
  className = '',
  buttonClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
  const [viewMonth, setViewMonth] = useState(() => fromISO(value) || new Date());
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) setViewMonth(fromISO(value) || new Date());
  }, [open, value]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const estimatedPanelHeight = 320;
    const spaceBelow = viewportH - rect.bottom;
    const openUp = spaceBelow < estimatedPanelHeight && rect.top > spaceBelow;
    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function selectDay(day) {
    onChange(toISO(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)));
    setOpen(false);
  }
  function clear() {
    onChange('');
    setOpen(false);
  }
  function goToday() {
    const now = new Date();
    setViewMonth(now);
    onChange(toISO(now));
    setOpen(false);
  }

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selected = fromISO(value);
  const isSelectedDay = (day) =>
    selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
  const todayDate = new Date();
  const isToday = (day) =>
    todayDate.getFullYear() === year && todayDate.getMonth() === month && todayDate.getDate() === day;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 text-left
                    bg-brand-50 dark:bg-white/5 text-slate-700 dark:text-slate-200
                    border-none rounded-lg px-3 py-2
                    hover:bg-brand-100 dark:hover:bg-white/10 transition-colors
                    ${buttonClassName}`}
      >
        <CalendarIcon size={14} className="opacity-60 shrink-0" />
        <span className={value ? '' : 'text-slate-400 dark:text-slate-500'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: coords.openUp ? undefined : coords.top,
            bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
            left: coords.left,
          }}
          className="z-50 w-64 rounded-xl border border-black/5 dark:border-white/10
                     bg-white dark:bg-card-dark shadow-lg dark:shadow-black/40 p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-white/10"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-white/10"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => (
              <button
                key={i}
                type="button"
                disabled={day === null}
                onClick={() => day && selectDay(day)}
                className={`h-7 w-7 rounded-lg text-xs flex items-center justify-center
                            ${day === null ? 'invisible' : 'text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-white/10'}
                            ${isSelectedDay(day) ? 'bg-gradient-brand text-white font-semibold hover:opacity-90' : ''}
                            ${isToday(day) && !isSelectedDay(day) ? 'ring-1 ring-brand-400 dark:ring-brand-300' : ''}`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/10">
            <button type="button" onClick={clear} className="text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline">
              Clear
            </button>
            <button type="button" onClick={goToday} className="text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline">
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
