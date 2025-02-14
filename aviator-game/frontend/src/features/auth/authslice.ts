import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  balance?: number;
}


const initialState: AuthState = {
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.token = payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('token', payload.token);
      }
    );
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
