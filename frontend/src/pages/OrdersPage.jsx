import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search } from "lucide-react";
import {
  fetchOrders,
  fetchOrderById,
  setStatusFilter,
} from "../features/orders/ordersSlice";
import Pagination from "../components/Pagination";
import OrderDetailModal from "../components/OrderDetailModal";
import Dropdown from "../components/Dropdown";
import DateDropdown from "../components/DateDropdown";

const STATUS_STYLES = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  processing:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  shipped: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export default function OrdersPage() {
  const dispatch = useDispatch();
  const { items, pagination, statusFilter, status } = useSelector(
    (state) => state.orders,
  );
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Debounce free-text search so we're not firing a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      dispatch(
        fetchOrders({
          page: 1,
          limit: 10,
          status: statusFilter,
          search,
          startDate,
          endDate,
        }),
      );
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, startDate, endDate]);

  useEffect(() => {
    dispatch(
      fetchOrders({
        page,
        limit: 10,
        status: statusFilter,
        search,
        startDate,
        endDate,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-5">
      <div className="dashboard-card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-55">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, email, or order #"
              className="w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <Dropdown
            value={statusFilter}
            onChange={(v) => dispatch(setStatusFilter(v))}
            options={[
              "all",
              "pending",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
            ].map((s) => ({
              value: s,
              label: s[0].toUpperCase() + s.slice(1),
            }))}
            buttonClassName="text-sm py-2"
          />
          <DateDropdown
            value={startDate}
            onChange={setStartDate}
            placeholder="Start date"
            buttonClassName="text-sm py-2"
          />
          <span className="text-slate-400 text-sm">to</span>
          <DateDropdown
            value={endDate}
            onChange={setEndDate}
            placeholder="End date"
            buttonClassName="text-sm py-2"
          />
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 dark:text-slate-500 text-xs uppercase">
                <th className="py-2 font-medium">Order</th>
                <th className="py-2 pl-4 font-medium">Customer</th>
                <th className="py-2 pl-6 font-medium">Date</th>
                <th className="py-2 pl-3 font-medium">Amount</th>
                <th className="py-2 pl-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => dispatch(fetchOrderById(order.id))}
                  className="border-t border-black/5 dark:border-white/5 cursor-pointer hover:bg-brand-50/50 dark:hover:bg-white/5"
                >
                  <td className="py-3 px-3 font-medium whitespace-nowrap">
                    #{order.id}
                  </td>

                  <td className="py-3 px-3">
                    <div className="whitespace-nowrap">
                      {order.customer_name}
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {order.customer_email}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-3 font-semibold whitespace-nowrap">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`stat-pill capitalize whitespace-nowrap ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}

              {status === "succeeded" && items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 px-3 text-center text-slate-400"
                  >
                    No orders match these filters.
                  </td>
                </tr>
              )}

              {status === "loading" && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 px-3 text-center text-slate-400"
                  >
                    Loading orders…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={setPage}
        />
      </div>

      <OrderDetailModal />
    </div>
  );
}
