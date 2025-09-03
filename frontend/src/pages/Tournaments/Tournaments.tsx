import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Lazy load tournament components
const TournamentList = lazy(() => import('./TournamentList'));
const TournamentForm = lazy(() => import('./TournamentForm'));
const TournamentWizard = lazy(() => import('../../components/Tournament/TournamentWizard'));
const TournamentDetail = lazy(() => import('./TournamentDetail'));
const TournamentBracket = lazy(() => import('./TournamentBracket'));

// Loading component
const TournamentLoadingFallback = () => (
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
      대회 데이터를 로딩중입니다...
    </Box>
  </Box>
);

const Tournaments: React.FC = () => {
  return (
    <Suspense fallback={<TournamentLoadingFallback />}>
      <Routes>
        <Route index element={<TournamentList />} />
        <Route path="create" element={<TournamentWizard />} />
        <Route path="create-simple" element={<TournamentForm />} />
        <Route path=":id" element={<TournamentDetail />} />
        <Route path=":id/edit" element={<TournamentForm />} />
        <Route path=":id/bracket" element={<TournamentBracket />} />
      </Routes>
    </Suspense>
  );
};

export default Tournaments;