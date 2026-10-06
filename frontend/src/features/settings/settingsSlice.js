import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  const { data } = await axiosClient.get('/settings');
  return data;
});

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.patch('/settings', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    data: null,
    status: 'idle',      // idle | loading | succeeded | failed
    saveStatus: 'idle',  // idle | loading | succeeded | failed
    saveError: null,
  },
  reducers: {
    resetSaveStatus: (state) => {
      state.saveStatus = 'idle';
      state.saveError = null;
    },
    // A different tab/browser saved new settings - Socket.IO push handled
    // in useRealtimeSync, this just applies it to this tab's state too.
    settingsUpdatedFromSocket: (state, action) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchSettings.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(updateSettings.pending, (state) => {
        state.saveStatus = 'loading';
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.data = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.saveError = action.payload;
      });
  },
});

export const { resetSaveStatus, settingsUpdatedFromSocket } = settingsSlice.actions;
export default settingsSlice.reducer;
