import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { clearSelectedOrder, updateOrderStatus } from '../features/orders/ordersSlice';
import Dropdown from './Dropdown';
import useReadOnly from '../hooks/useReadOnly';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrderDetailModal() {
  const dispatch = useDispatch();
  const { selectedOrder, selectedOrderStatus } = useSelector((state) => state.orders);
  const readOnly = useReadOnly();

  if (!selectedOrder) return null;

  const items = selectedOrder.items || [];
  const itemsTotal = items.reduce((sum, it) => sum + it.quantity * parseFloat(it.unit_price), 0);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
         onClick={() => dispatch(clearSelectedOrder())}>
      <div
        className="dashboard-card w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Order #{selectedOrder.id}</h3>
            <p className="text-xs text-slate-400">
              {new Date(selectedOrder.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={() => dispatch(clearSelectedOrder())} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {selectedOrderStatus === 'loading' ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading order…</p>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm font-medium">{selectedOrder.customer_name}</p>
              <p className="text-xs text-slate-400">{selectedOrder.customer_email}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 uppercase">Status</label>
              <Dropdown
                value={selectedOrder.status}
                onChange={(v) => dispatch(updateOrderStatus({ id: selectedOrder.id, status: v }))}
                options={STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
                className="mt-1 w-full"
                buttonClassName="text-sm py-2"
                disabled={readOnly}
              />
            </div>

            <div className="border-t border-black/5 dark:border-white/5 pt-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Items</h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-slate-400">{item.sku} · Qty {item.quantity}</p>
                    </div>
                    <span className="font-semibold">
                      ${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                    </span>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-slate-400">No items on this order.</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 dark:border-white/5 font-semibold">
                <span>Total</span>
                <span>${itemsTotal.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
