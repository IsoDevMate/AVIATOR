import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authslice';
import { authApi } from './services/authApi';
import websocketReducer from './features/ws/websocketslice';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
     websocket: websocketReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
