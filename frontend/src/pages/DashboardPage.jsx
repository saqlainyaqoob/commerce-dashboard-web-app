import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Users, Receipt } from 'lucide-react';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/RevenueChart';
import CategoryDonut from '../components/CategoryDonut';
import OrdersTable from '../components/OrdersTable';
import InventoryAlerts from '../components/InventoryAlerts';
import { fetchSummary, fetchRevenueSeries, fetchCategoryBreakdown } from '../features/revenue/revenueSlice';
import { fetchProducts } from '../features/inventory/inventorySlice';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { summary, range } = useSelector((state) => state.revenue);

  // Initial load - after this, the socket + cron tick keep everything fresh.
  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchRevenueSeries(range));
    dispatch(fetchCategoryBreakdown());
    dispatch(fetchProducts());
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(fetchRevenueSeries(range));
  }, [dispatch, range]);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total Revenue (30d)"
          value={`$${parseFloat(summary.total_revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta={summary.deltas?.revenue}
          gradient="bg-gradient-brand"
          icon={DollarSign}
        />
        <StatCard
          label="Total Orders"
          value={summary.total_orders}
          delta={summary.deltas?.orders}
          gradient="bg-gradient-cyan"
          icon={ShoppingBag}
        />
        <StatCard
          label="Avg Order Value"
          value={`$${parseFloat(summary.avg_order_value).toFixed(2)}`}
          delta={summary.deltas?.avg_order_value}
          gradient="bg-gradient-orange"
          icon={Receipt}
        />
        <StatCard
          label="Active Customers"
          value={summary.active_customers}
          delta={summary.deltas?.active_customers}
          gradient="bg-gradient-green"
          icon={Users}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RevenueChart />
        <CategoryDonut />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <OrdersTable />
        <InventoryAlerts />
      </div>
    </div>
  );
}
