import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { setRange } from '../features/revenue/revenueSlice';

const RANGES = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '12m', label: '12M' },
];

function formatPeriod(period, range) {
  const d = new Date(period);
  return range === '12m'
    ? d.toLocaleDateString(undefined, { month: 'short' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RevenueChart() {
  const { series, range } = useSelector((state) => state.revenue);
  const dispatch = useDispatch();

  const data = series.map((row) => ({
    label: formatPeriod(row.period, range),
    revenue: parseFloat(row.revenue),
    orders: parseInt(row.orders),
  }));

  return (
    <div className="dashboard-card col-span-1 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Revenue Trend</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Updates live every few seconds</p>
        </div>
        <div className="flex bg-brand-50 dark:bg-white/5 rounded-lg p-1 gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => dispatch(setRange(r.key))}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all
                ${range === r.key
                  ? 'bg-gradient-brand text-white shadow-glow'
                  : 'text-slate-500 dark:text-slate-400'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-black/5 dark:stroke-white/10" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
          <YAxis tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            formatter={(value, name) => [name === 'revenue' ? `$${value.toFixed(2)}` : value, name]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} fill="url(#revenueGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
