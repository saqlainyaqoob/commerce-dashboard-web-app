import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

// A themed, portal-rendered replacement for native <select>.
//
// Why this exists: a native <select>'s option list is painted by the
// browser/OS chrome, not by our page's DOM. That's exactly why it can't
// reliably pick up Tailwind's `dark:` classes (hence the reported
// "white background, unreadable text" in dark mode) and why nothing in
// our CSS can guarantee where it renders on screen. Rendering the panel
// ourselves - into a React portal on document.body, positioned from the
// trigger's real getBoundingClientRect() - puts every pixel of it under
// our own styling and makes it immune to any ancestor's overflow/
// transform/z-index (tables, modals, cards, sidebars all become
// irrelevant to where it opens).
//
// `options` accepts either plain strings/numbers or {value, label}
// objects. `value`/`onChange` behave like a native select's.
export default function Dropdown({
  value,
  options,
  onChange,
  className = '',
  buttonClassName = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const normalized = options.map((o) =>
    o !== null && typeof o === 'object' ? o : { value: o, label: String(o) }
  );
  const selected = normalized.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const estimatedPanelHeight = Math.min(normalized.length * 36 + 8, 256);
    const spaceBelow = viewportH - rect.bottom;
    const openUp = spaceBelow < estimatedPanelHeight && rect.top > spaceBelow;
    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  }, [normalized.length]);

  // Recompute position every time the panel opens, and keep it pinned to
  // the trigger while the page scrolls or the viewport resizes - this is
  // what keeps it "remaining visually anchored" per the requirement,
  // instead of a one-shot position that goes stale.
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

  function handleSelect(optValue) {
    onChange(optValue);
    setOpen(false);
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center justify-between gap-2 w-full text-left
                    bg-brand-50 dark:bg-white/5 text-slate-700 dark:text-slate-200
                    border-none rounded-lg px-3 py-2 font-medium
                    hover:bg-brand-100 dark:hover:bg-white/10 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown size={14} className={`shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: coords.openUp ? undefined : coords.top,
            bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
            left: coords.left,
            minWidth: coords.width,
          }}
          className="z-50 max-h-64 overflow-y-auto scrollbar-thin rounded-xl border
                     border-black/5 dark:border-white/10 bg-white dark:bg-card-dark
                     shadow-lg dark:shadow-black/40 py-1"
        >
          {normalized.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-sm
                          text-slate-700 dark:text-slate-200
                          hover:bg-brand-50 dark:hover:bg-white/10
                          ${opt.value === value ? 'font-semibold bg-brand-50/70 dark:bg-white/5' : ''}`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check size={14} className="text-brand-600 dark:text-brand-300 shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
