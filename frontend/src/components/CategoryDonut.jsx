import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSelector } from 'react-redux';

const COLORS = ['#7c3aed', '#ec4899', '#06b6d4', '#f97316', '#22c55e'];

export default function CategoryDonut() {
  const { categoryBreakdown } = useSelector((state) => state.revenue);
  const data = categoryBreakdown.map((c) => ({ name: c.category, value: parseFloat(c.revenue) }));

  return (
    <div className="dashboard-card">
      <h3 className="font-semibold mb-1">Revenue by Category</h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Last 30 days</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
