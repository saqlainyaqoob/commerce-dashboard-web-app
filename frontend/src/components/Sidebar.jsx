import React from "react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../constants/nav";

// Static column on desktop; on mobile it's an off-canvas drawer toggled
// by the hamburger button in Navbar (mobileOpen/onClose, lifted to
// DashboardLayout so both components share one source of truth).
export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 flex flex-col
                    bg-card-light dark:bg-card-dark border-r border-black/5 dark:border-white/5
                    transition-transform duration-200 ease-in-out
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="h-16 flex items-center gap-2 px-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand shadow-glow" />
          <span className="font-bold text-lg bg-gradient-brand bg-clip-text text-transparent">
            CommerceHQ
          </span>
          <span className="ml-auto md:hidden" onClick={onClose}>
            X
          </span>
        </div>
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-gradient-brand text-white shadow-glow"
                    : "text-slate-500 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-white/5"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-slate-400 dark:text-slate-500">
          v1.0 · Real-time analytics
        </div>
      </aside>
    </>
  );
}
