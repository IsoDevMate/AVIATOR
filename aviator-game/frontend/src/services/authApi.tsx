import { createApi, fetchBaseQuery, RootState } from '@reduxjs/toolkit/query/react';
import { clearAuth } from '../features/auth/authslice';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

interface LogoutRequest {
  token: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/auth', // Updated base URL to include /auth
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<void, RegisterRequest>({
      query: (credentials) => ({
        url: 'register',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: 'logout',
        method: 'POST',
        // Token will be sent automatically in headers
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearAuth());
          localStorage.removeItem('token');
          window.location.href = '/login';
        } catch (error) {
          console.error('Logout failed:', error);
          // Optionally show error notification to user
        }
      },
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => 'me',
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
} = authApi;
