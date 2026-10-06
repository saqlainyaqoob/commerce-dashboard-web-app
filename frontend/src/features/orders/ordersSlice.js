import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ page = 1, limit = 10, status = 'all', search = '', startDate = '', endDate = '' } = {}) => {
    const { data } = await axiosClient.get('/orders', {
      params: { page, limit, status, search, startDate, endDate },
    });
    return data;
  }
);

// Full order detail (with line items) for the order detail modal.
export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id) => {
  const { data } = await axiosClient.get(`/orders/${id}`);
  return data;
});

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, status }) => {
    const { data } = await axiosClient.patch(`/orders/${id}/status`, { status });
    return data;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    pagination: { page: 1, limit: 10, total: 0 },
    statusFilter: 'all',
    status: 'idle',
    error: null,
    selectedOrder: null,
    selectedOrderStatus: 'idle', // idle | loading | succeeded | failed
  },
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
      state.selectedOrderStatus = 'idle';
    },
    // Called when the socket pushes a live order update - keeps the
    // table in sync without waiting for the next fetch.
    orderUpdatedFromSocket: (state, action) => {
      const idx = state.items.findIndex((o) => o.id === action.payload.id);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = { ...state.selectedOrder, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.selectedOrderStatus = 'loading';
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.selectedOrderStatus = 'succeeded';
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state) => {
        state.selectedOrderStatus = 'failed';
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = { ...state.selectedOrder, ...action.payload };
        }
      });
  },
});

export const { setStatusFilter, clearSelectedOrder, orderUpdatedFromSocket } = ordersSlice.actions;
export default ordersSlice.reducer;
