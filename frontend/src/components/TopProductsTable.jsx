import { useSelector } from 'react-redux';

export default function TopProductsTable() {
  const { topProducts } = useSelector((state) => state.revenue);

  return (
    <div className="dashboard-card pr-6">
      <h3 className="font-semibold mb-1">Best-Selling Products</h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Ranked by real revenue generated</p>
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
        {topProducts.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 mr-4">
            <span className="w-6 text-xs font-bold text-slate-400">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-slate-400">{p.sku} · {p.units_sold} sold</p>
            </div>
            <span className="text-sm font-semibold">${parseFloat(p.revenue).toFixed(2)}</span>
          </div>
        ))}
        {topProducts.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No sales in this range yet.</p>
        )}
      </div>
    </div>
  );
}
