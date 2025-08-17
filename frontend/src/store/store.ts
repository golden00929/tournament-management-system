import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authSlice from './slices/authSlice';
import tournamentSlice from './slices/tournamentSlice';
import playerSlice from './slices/playerSlice';
import { apiSlice } from './api/apiSlice';
import authMiddleware from './middleware/authMiddleware';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    tournaments: tournamentSlice,
    players: playerSlice,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(authMiddleware),
});

setupListeners(store.dispatch);

// Redux DevTools를 위한 전역 store 노출 (개발용)
if (process.env.NODE_ENV === 'development') {
  (window as any).store = store;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;