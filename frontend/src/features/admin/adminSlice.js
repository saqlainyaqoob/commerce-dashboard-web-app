import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

// This app has no login/session system - these calls always operate on
// the one admin account (see backend/controllers/adminController.js).
export const fetchProfile = createAsyncThunk('admin/fetchProfile', async () => {
  const { data } = await axiosClient.get('/admin/profile');
  return data;
});

export const updateProfile = createAsyncThunk(
  'admin/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.patch('/admin/profile', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update profile');
    }
  }
);

export const changePassword = createAsyncThunk(
  'admin/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.patch('/admin/password', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to change password');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    profile: null,
    status: 'idle',       // profile fetch: idle | loading | succeeded | failed
    saveStatus: 'idle',   // profile edit save: idle | loading | succeeded | failed
    saveError: null,
    passwordStatus: 'idle', // idle | loading | succeeded | failed
    passwordError: null,
  },
  reducers: {
    resetSaveStatus: (state) => {
      state.saveStatus = 'idle';
      state.saveError = null;
    },
    resetPasswordStatus: (state) => {
      state.passwordStatus = 'idle';
      state.passwordError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(updateProfile.pending, (state) => {
        state.saveStatus = 'loading';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.saveError = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.passwordStatus = 'loading';
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordStatus = 'succeeded';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordStatus = 'failed';
        state.passwordError = action.payload;
      });
  },
});

export const { resetSaveStatus, resetPasswordStatus } = adminSlice.actions;
export default adminSlice.reducer;
