import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// A single KPI card. `gradient` picks one of the Tailwind bg-gradient-*
// utilities so every card can have its own vibrant accent while sharing
// the same layout/spacing - this is the "consistent but colorful" look.
//
// `delta` is a real percentage computed on the backend from the prior
// 30-day window (see analyticsController.getSummary) - it can be:
//   - a finite number: real period-over-period change, shown with an arrow
//   - null: no prior-period data to compare against (e.g. a brand-new
//     store) - deliberately rendered as "No prior data" instead of a
//     fabricated 0%/arrow
//   - undefined: this card doesn't track a delta at all - row omitted
export default function StatCard({ label, value, delta, gradient = 'bg-gradient-brand', icon: Icon }) {
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const isPositive = hasDelta && delta >= 0;
  return (
    <div className="dashboard-card flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${gradient} flex items-center justify-center text-white`}>
          {Icon && <Icon size={16} />}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {delta !== undefined && (
        hasDelta ? (
          <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(delta).toFixed(1)}% vs last period
          </div>
        ) : (
          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">No prior-period data yet</div>
        )
      )}
    </div>
  );
}
