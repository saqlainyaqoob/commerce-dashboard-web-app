import React from 'react';
import { useSelector } from 'react-redux';

export default function TopCustomersTable() {
  const { topCustomers } = useSelector((state) => state.revenue);

  return (
    <div className="dashboard-card">
      <h3 className="font-semibold mb-1">Top Customers</h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Ranked by lifetime spend</p>
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-2">
        {topCustomers.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 mr-2">
            <span className="w-6 text-xs font-bold text-slate-400">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <p className="text-xs text-slate-400 pr-10">{c.email} · {c.order_count} orders</p>
            </div>
            <span className="text-sm font-semibold">${parseFloat(c.total_spent).toFixed(2)}</span>
          </div>
        ))}
        {topCustomers.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No customer orders yet.</p>
        )}
      </div>
    </div>
  );
}
