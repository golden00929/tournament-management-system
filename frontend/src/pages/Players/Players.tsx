import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Lazy load player components
const PlayerList = lazy(() => import('./PlayerList'));
const PlayerForm = lazy(() => import('./PlayerForm'));
const PlayerDetail = lazy(() => import('./PlayerDetail'));

// Loading component
const PlayerLoadingFallback = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="300px"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress size={32} />
    <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
      선수 데이터를 로딩중입니다...
    </Box>
  </Box>
);

const Players: React.FC = () => {
  return (
    <Suspense fallback={<PlayerLoadingFallback />}>
      <Routes>
        <Route index element={<PlayerList />} />
        <Route path="create" element={<PlayerForm />} />
        <Route path=":id" element={<PlayerDetail />} />
        <Route path=":id/edit" element={<PlayerForm />} />
      </Routes>
    </Suspense>
  );
};

export default Players;