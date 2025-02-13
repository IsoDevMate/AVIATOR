// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// interface User {
//   id: string;
//   email: string;
//   username: string;
//   role: string;
// }

// interface AuthState {
//   user: User | null;
//   token: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: string | null;
// }

// const initialState: AuthState = {
//   user: null,
//   token: localStorage.getItem('token'),
//   isAuthenticated: false,
//   isLoading: false,
//   error: null,
// };

// // Async thunks
// export const register = createAsyncThunk(
//   'auth/register',
//   async (credentials: { email: string; password: string; username: string }, { rejectWithValue }) => {
//     try {
//       const response = await axios.post('/api/auth/register', credentials);
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response.data.message || 'Registration failed');
//     }
//   }
// );

// export const login = createAsyncThunk(
//   'auth/login',
//   async (credentials: { email: string; password: string }, { rejectWithValue }) => {
//     try {
//       const response = await axios.post('/api/auth/login', credentials);
//       const { token } = response.data;
//       localStorage.setItem('token', token);
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response.data.message || 'Login failed');
//     }
//   }
// );

// export const logout = createAsyncThunk(
//   'auth/logout',
//   async () => {
//     localStorage.removeItem('token');
//   }
// );

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Register
//       .addCase(register.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(register.fulfilled, (state) => {
//         state.isLoading = false;
//       })
//       .addCase(register.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload as string;
//       })
//       // Login
//       .addCase(login.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(login.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isAuthenticated = true;
//         state.token = action.payload.token;
//         state.user = action.payload.user;
//       })
//       .addCase(login.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload as string;
//       })
//       // Logout
//       .addCase(logout.fulfilled, (state) => {
//         state.user = null;
//         state.token = null;
//         state.isAuthenticated = false;
//       });
//   },
// });

// export const { clearError } = authSlice.actions;
// export default authSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
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
