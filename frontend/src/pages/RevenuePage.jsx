import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RevenueChart from '../components/RevenueChart';
import CategoryDonut from '../components/CategoryDonut';
import TopProductsTable from '../components/TopProductsTable';
import TopCustomersTable from '../components/TopCustomersTable';
import {
  fetchRevenueSeries, fetchCategoryBreakdown, fetchTopProducts, fetchTopCustomers,
} from '../features/revenue/revenueSlice';

export default function RevenuePage() {
  const dispatch = useDispatch();
  const range = useSelector((state) => state.revenue.range);

  useEffect(() => {
    dispatch(fetchRevenueSeries(range));
    dispatch(fetchCategoryBreakdown());
    dispatch(fetchTopProducts(range));
    dispatch(fetchTopCustomers());
  }, [dispatch, range]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RevenueChart />
        <CategoryDonut />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopProductsTable />
        <TopCustomersTable />
      </div>
    </div>
  );
}
