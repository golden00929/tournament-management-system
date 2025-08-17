import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './i18n/i18n'; // i18n 설정 초기화

// Core components (not lazy loaded)
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LazyLoadingFallback from './components/Loading/LazyLoadingFallback';

// Lazy loaded components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Tournaments = lazy(() => import('./pages/Tournaments/Tournaments'));
const Players = lazy(() => import('./pages/Players/Players'));
const Matches = lazy(() => import('./pages/Matches/Matches'));
const WebSocketTest = lazy(() => import('./pages/WebSocketTest'));

// Player components
const Player = lazy(() => import('./pages/Player/Player'));

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});


function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Admin Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Player Routes */}
            <Route path="/player/*" element={
              <Suspense fallback={<LazyLoadingFallback message="선수 페이지를 로딩중입니다..." />}>
                <Player />
              </Suspense>
            } />
            
            {/* Admin Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                <Suspense fallback={<LazyLoadingFallback message="대시보드를 로딩중입니다..." />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="tournaments/*" element={
                <Suspense fallback={<LazyLoadingFallback message="대회 관리를 로딩중입니다..." />}>
                  <Tournaments />
                </Suspense>
              } />
              <Route path="players/*" element={
                <Suspense fallback={<LazyLoadingFallback message="선수 관리를 로딩중입니다..." />}>
                  <Players />
                </Suspense>
              } />
              <Route path="matches/*" element={
                <Suspense fallback={<LazyLoadingFallback message="경기 관리를 로딩중입니다..." />}>
                  <Matches />
                </Suspense>
              } />
              <Route path="websocket-test" element={
                <Suspense fallback={<LazyLoadingFallback message="WebSocket 테스트를 로딩중입니다..." />}>
                  <WebSocketTest />
                </Suspense>
              } />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
