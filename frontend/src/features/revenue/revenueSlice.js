import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

// Thunks = the "async logic" layer. A component dispatches these,
// Redux Toolkit handles the pending/fulfilled/rejected lifecycle for us.
export const fetchSummary = createAsyncThunk('revenue/fetchSummary', async () => {
  const { data } = await axiosClient.get('/analytics/summary');
  return data;
});

export const fetchRevenueSeries = createAsyncThunk(
  'revenue/fetchSeries',
  async (range = '7d') => {
    const { data } = await axiosClient.get(`/analytics/revenue?range=${range}`);
    return data;
  }
);

export const fetchCategoryBreakdown = createAsyncThunk(
  'revenue/fetchCategoryBreakdown',
  async () => {
    const { data } = await axiosClient.get('/analytics/category-breakdown');
    return data;
  }
);

// Real aggregations for the Revenue page - best-selling products and
// highest-spending customers, both computed server-side from actual orders.
export const fetchTopProducts = createAsyncThunk(
  'revenue/fetchTopProducts',
  async (range = '30d') => {
    const { data } = await axiosClient.get('/analytics/top-products', { params: { range, limit: 10 } });
    return data;
  }
);

export const fetchTopCustomers = createAsyncThunk(
  'revenue/fetchTopCustomers',
  async () => {
    const { data } = await axiosClient.get('/analytics/top-customers', { params: { limit: 10 } });
    return data;
  }
);

const revenueSlice = createSlice({
  name: 'revenue',
  initialState: {
    summary: {
      total_revenue: 0, total_orders: 0, avg_order_value: 0, active_customers: 0,
      deltas: { revenue: null, orders: null, avg_order_value: null, active_customers: null },
    },
    series: [],
    categoryBreakdown: [],
    topProducts: [],
    topCustomers: [],
    range: '7d',
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    setRange: (state, action) => {
      state.range = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(fetchRevenueSeries.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRevenueSeries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.series = action.payload;
      })
      .addCase(fetchRevenueSeries.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchCategoryBreakdown.fulfilled, (state, action) => {
        state.categoryBreakdown = action.payload;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProducts = action.payload;
      })
      .addCase(fetchTopCustomers.fulfilled, (state, action) => {
        state.topCustomers = action.payload;
      });
  },
});

export const { setRange } = revenueSlice.actions;
export default revenueSlice.reducer;
