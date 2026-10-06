import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AlertTriangle, PackageX } from 'lucide-react';

export default function InventoryAlerts() {
  const { products } = useSelector((state) => state.inventory);

  const lowStockProducts = products.filter(
    (product) => product.stock_quantity <= product.reorder_level
  );

  return (
    <div className="dashboard-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold">Inventory Alerts</h3>

        <Link
          to="/inventory"
          className="text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline"
        >
          View all →
        </Link>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        Live - pushed the instant stock changes
      </p>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 max-h-130">
        {lowStockProducts.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            All stock levels look healthy 🎉
          </p>
        )}

        {lowStockProducts.map((product) => {
          const isOutOfStock = product.stock_quantity === 0;
          const Icon = isOutOfStock ? PackageX : AlertTriangle;

          return (
            <div
              key={product.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-brand-50/60 dark:bg-white/5"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isOutOfStock
                    ? 'text-accent-red bg-accent-red/10'
                    : 'text-accent-orange bg-accent-orange/10'
                }`}
              >
                <Icon size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">
                  {isOutOfStock
                    ? `${product.name} is out of stock`
                    : `${product.name} is low in stock`}
                </p>

                <p className="text-xs text-slate-400 mt-0.5">
                  {product.stock_quantity} units remaining
                  {' · '}
                  Reorder at {product.reorder_level}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}