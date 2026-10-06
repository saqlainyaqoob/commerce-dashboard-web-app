import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socket from '../api/socket';
import {
  alertReceivedFromSocket, productUpdatedFromSocket,
  alertReadFromSocket, allAlertsReadFromSocket,
} from '../features/inventory/inventorySlice';
import { orderUpdatedFromSocket } from '../features/orders/ordersSlice';
import { fetchSummary, fetchRevenueSeries } from '../features/revenue/revenueSlice';
import { settingsUpdatedFromSocket } from '../features/settings/settingsSlice';

// This hook is the bridge between "the server pushed something" and
// "Redux state (and therefore the UI) reflects it". Mount it once,
// high up in the tree (App.jsx), and every slice stays live.
// `token` gates the actual socket connection - we never open a websocket
// before the user is authenticated, and we tear it down on logout.
export default function useRealtimeSync(revenueRange, token) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) {
      socket.disconnect();
      return;
    }
    if (!socket.connected) socket.connect();

    function handleAlert(alert) {
      dispatch(alertReceivedFromSocket(alert));
    }
    function handleAlertRead({ id }) {
      dispatch(alertReadFromSocket({ id }));
    }
    function handleAllAlertsRead() {
      dispatch(allAlertsReadFromSocket());
    }
    function handleInventoryUpdate(product) {
      dispatch(productUpdatedFromSocket(product));
      // Recompute dashboard inventory KPIs after a real inventory change.
      dispatch(fetchSummary());
    }
    function handleOrderUpdate(order) {
      dispatch(orderUpdatedFromSocket(order));
      // Orders affect revenue and order KPIs, so refresh the affected
      // aggregates when the backend broadcasts an actual order change.
      dispatch(fetchSummary());
      dispatch(fetchRevenueSeries(revenueRange));
    }
    // Another tab/browser saved store settings - apply them here too so
    // every open dashboard reflects the same configuration.
    function handleSettingsUpdate(settings) {
      dispatch(settingsUpdatedFromSocket(settings));
      // Settings such as the low-stock threshold can affect dashboard KPIs.
      dispatch(fetchSummary());
    }
    socket.on('inventory:alert', handleAlert);
    socket.on('inventory:alert-read', handleAlertRead);
    socket.on('inventory:alerts-read-all', handleAllAlertsRead);
    socket.on('inventory:updated', handleInventoryUpdate);
    socket.on('order:updated', handleOrderUpdate);
    socket.on('settings:updated', handleSettingsUpdate);

    return () => {
      socket.off('inventory:alert', handleAlert);
      socket.off('inventory:alert-read', handleAlertRead);
      socket.off('inventory:alerts-read-all', handleAllAlertsRead);
      socket.off('inventory:updated', handleInventoryUpdate);
      socket.off('order:updated', handleOrderUpdate);
      socket.off('settings:updated', handleSettingsUpdate);
    };
  }, [dispatch, revenueRange, token]);
}
