import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient, { TOKEN_KEY } from '../../api/axiosClient';
import socket from '../../api/socket';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/auth/login', { email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      return data; // { token, admin }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

// One-click read-only demo sign-in. Same result shape and same stored token
// as login() - the backend issues the normal JWT + refresh cookie for the
// demo account, so everything after this is the existing session flow.
export const demoLogin = createAsyncThunk(
  'auth/demoLogin',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/auth/demo-login');
      localStorage.setItem(TOKEN_KEY, data.token);
      return data; // { token, admin }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Could not start the demo');
    }
  }
);

// Real logout: tells the backend to revoke the refresh-token row (so the
// httpOnly cookie can never be used to mint a new access token again),
// then clears local state regardless of whether that call succeeded -
// the user must never get stuck "logged in" client-side just because
// the network hiccuped on the way out.
export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await axiosClient.post('/auth/logout');
  } catch (err) {
    // best-effort - local state is cleared unconditionally below
  }
  return true;
});

// Shared by the sync `logout` reducer and both outcomes of logoutUser -
// same real cleanup every time: drop the access token, disconnect the
// authenticated socket, reset auth state. Refreshing the page afterwards
// reads an empty TOKEN_KEY, so the session does not come back.
function clearAuthState(state) {
  localStorage.removeItem(TOKEN_KEY);
  socket.disconnect();
  state.token = null;
  state.status = 'idle';
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem(TOKEN_KEY) || null,
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    logout: clearAuthState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(demoLogin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(demoLogin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
      })
      .addCase(demoLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, clearAuthState)
      .addCase(logoutUser.rejected, clearAuthState);
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
