import { configureStore } from '@reduxjs/toolkit';
import revenueReducer from '../features/revenue/revenueSlice';
import ordersReducer from '../features/orders/ordersSlice';
import inventoryReducer from '../features/inventory/inventorySlice';
import themeReducer from '../features/theme/themeSlice';
import adminReducer from '../features/admin/adminSlice';
import settingsReducer from '../features/settings/settingsSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    revenue: revenueReducer,
    orders: ordersReducer,
    inventory: inventoryReducer,
    theme: themeReducer,
    admin: adminReducer,
    settings: settingsReducer,
    auth: authReducer,
  },
});
