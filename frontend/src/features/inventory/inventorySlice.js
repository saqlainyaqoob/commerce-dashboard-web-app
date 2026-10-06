import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

export const fetchProducts = createAsyncThunk(
  "inventory/fetchProducts",
  async (filters = {}) => {
    const { data } = await axiosClient.get("/inventory/products", {
      params: filters,
    });
    return data;
  },
);

export const fetchAlerts = createAsyncThunk(
  "inventory/fetchAlerts",
  async () => {
    const { data } = await axiosClient.get("/inventory/alerts", {
      params: { unreadOnly: true },
    });
    return data;
  },
);


// Real, persisted read-state changes (not a client-only dismiss) - both
// hit the backend, which also broadcasts over Socket.IO so every other
// open tab/browser stays in sync.
export const markAlertRead = createAsyncThunk(
  "inventory/markAlertRead",
  async (id) => {
    const { data } = await axiosClient.patch(`/inventory/alerts/${id}/read`);
    return data; // { id, is_read: true }
  },
);

export const markAllAlertsRead = createAsyncThunk(
  "inventory/markAllAlertsRead",
  async () => {
    const { data } = await axiosClient.patch("/inventory/alerts/read-all");
    return data; // { updated: <count> }
  },
);

export const createProduct = createAsyncThunk(
  "inventory/createProduct",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post("/inventory/products", payload);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to create product",
      );
    }
  },
);

export const updateProduct = createAsyncThunk(
  "inventory/updateProduct",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.patch(
        `/inventory/products/${id}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to update product",
      );
    }
  },
);

// Quick +/- stock adjustment (used by the inline stock controls).
export const adjustStock = createAsyncThunk(
  "inventory/adjustStock",
  async ({ id, quantityChange }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.patch(
        `/inventory/products/${id}/stock`,
        { quantityChange },
      );
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || "Failed to adjust stock",
      );
    }
  },
);

function replaceOrPrepend(list, product) {
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx !== -1) {
    list[idx] = product;
  } else {
    list.unshift(product);
  }
}

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    products: [],
    alerts: [],
    status: "idle",
    error: null,
    saveStatus: "idle", // create/update product: idle | loading | succeeded | failed
    saveError: null,
  },
  reducers: {
    resetSaveStatus: (state) => {
      state.saveStatus = "idle";
      state.saveError = null;
    },
    // A new alert arrived over the socket - unshift it so it's
    // instantly visible at the top of the alert feed.
    alertReceivedFromSocket: (state, action) => {
      state.alerts.unshift(action.payload);
    },
    productUpdatedFromSocket: (state, action) => {
      replaceOrPrepend(state.products, action.payload);
    },
    dismissAlert: (state, action) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
    // Another tab/browser (or this one, via the socket echo) marked an
    // alert read/all-read - keep every open dashboard's unread count correct.
    alertReadFromSocket: (state, action) => {
      const alert = state.alerts.find((a) => a.id === action.payload.id);
      if (alert) alert.is_read = true;
    },
    allAlertsReadFromSocket: (state) => {
      state.alerts.forEach((a) => {
        a.is_read = true;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.products = action.payload;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload;
      })
      .addCase(markAlertRead.fulfilled, (state, action) => {
        state.alerts = state.alerts.filter(
          (alert) => alert.id !== action.payload.id,
        );
      })
      .addCase(markAllAlertsRead.fulfilled, (state) => {
        state.alerts = [];
      })
      .addCase(createProduct.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        replaceOrPrepend(state.products, action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(updateProduct.pending, (state) => {
        state.saveStatus = "loading";
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        replaceOrPrepend(state.products, action.payload);
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      .addCase(adjustStock.fulfilled, (state, action) => {
        replaceOrPrepend(state.products, action.payload);
      });
  },
});

export const {
  resetSaveStatus,
  alertReceivedFromSocket,
  productUpdatedFromSocket,
  dismissAlert,
  alertReadFromSocket,
  allAlertsReadFromSocket,
} = inventorySlice.actions;
export default inventorySlice.reducer;
