import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchOrders, setStatusFilter } from "../features/orders/ordersSlice";
import Dropdown from "./Dropdown";

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

export default function OrdersTable() {
  const dispatch = useDispatch();
  const { items, statusFilter } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders({ status: statusFilter, limit: 8 }));
  }, [dispatch, statusFilter]);

  return (
    <div className="dashboard-card col-span-1 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Orders</h3>
        <div className="flex items-center gap-2">
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
            buttonClassName="text-xs px-3 py-1.5"
          />
          <Link
            to="/orders"
            className="text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline whitespace-nowrap"
          >
            View all →
          </Link>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-162.5 text-sm table-fixed">
          <thead>
            <tr className="text-left text-slate-400 dark:text-slate-500 text-xs uppercase">
              <th className="w-[15%] py-2 px-3 font-medium">Order</th>
              <th className="w-[40%] py-2 px-3 font-medium">Customer</th>
              <th className="w-[20%] py-2 px-3 font-medium">Amount</th>
              <th className="w-[25%] py-2 px-3 font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {items.map((order) => (
              <tr
                key={order.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <td className="py-3 px-3 font-medium whitespace-nowrap">
                  #{order.id}
                </td>

                <td className="py-3 px-3 min-w-0">
                  <div className="truncate font-medium">
                    {order.customer_name}
                  </div>

                  <div className="text-xs text-slate-400 break-all">
                    {order.customer_email}
                  </div>
                </td>

                <td className="py-3 px-3 font-semibold whitespace-nowrap">
                  ${parseFloat(order.total_amount).toFixed(2)}
                </td>

                <td className="py-3 px-3 whitespace-nowrap">
                  <span
                    className={`stat-pill capitalize inline-flex ${STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 px-3 text-center text-slate-400"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
