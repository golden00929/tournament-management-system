import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PlayerLogin from './PlayerLogin';
import PlayerRegister from './PlayerRegister';

const PlayerAuth: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<PlayerLogin />} />
      <Route path="/register" element={<PlayerRegister />} />
      <Route path="/" element={<Navigate to="/player/login" replace />} />
    </Routes>
  );
};

export default PlayerAuth;