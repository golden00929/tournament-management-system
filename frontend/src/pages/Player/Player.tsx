import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PlayerLogin from './PlayerAuth/PlayerLogin';
import PlayerRegister from './PlayerAuth/PlayerRegister';
import PlayerDashboard from './PlayerDashboard';
import PlayerProfile from './PlayerProfile';
import PlayerTournaments from './PlayerTournaments';
import PlayerApplications from './PlayerApplications';
import PlayerRankings from './PlayerRankings';
import PlayerMatches from './PlayerMatches';
import PlayerTournamentBracket from './PlayerTournamentBracket';
import { getValidUser, getValidToken } from '../../utils/localStorage';
import { RootState } from '../../store/store';

const Player: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Redux store에서 인증 상태 확인
  const authState = useSelector((state: RootState) => state.auth);

  // 통합된 인증 상태 확인 함수
  const checkAuthenticationState = React.useCallback(() => {
    const token = getValidToken();
    const user = getValidUser();
    const reduxToken = authState.token;
    const reduxUser = authState.user;
    
    // 우선순위: Redux > localStorage
    let authenticated = false;
    let authSource = 'none';
    
    if (reduxToken && reduxUser && reduxUser.role === 'player') {
      authenticated = true;
      authSource = 'redux';
    } else if (token && user && user.role === 'player') {
      authenticated = true;
      authSource = 'localStorage';
    }
    
    console.log('🔍 Player: Unified auth check', {
      authenticated,
      authSource,
      redux: { token: !!reduxToken, user: reduxUser?.role, userId: reduxUser?.id },
      localStorage: { token: !!token, user: user?.role, userId: user?.id },
      rawLocalStorage: {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      }
    });
    
    return authenticated;
  }, [authState.token, authState.user]);

  // 단일 통합 인증 체크
  useEffect(() => {
    const authenticated = checkAuthenticationState();
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  }, [checkAuthenticationState]);

  // localStorage 변경 감지만 유지
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('📢 Storage event detected');
      const authenticated = checkAuthenticationState();
      setIsAuthenticated(authenticated);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthenticationState]);

  // 로딩 중일 때는 빈 화면 (또는 로딩 스피너)
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* 인증되지 않은 경우 인증 페이지로 */}
      <Route path="/login" element={<PlayerLogin />} />
      <Route path="/register" element={<PlayerRegister />} />
      
      {/* 인증된 선수만 접근 가능한 페이지들 */}
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? (
            <PlayerDashboard />
          ) : (
            <Navigate to="/player/login" replace />
          )
        } 
      />
      <Route 
        path="/profile" 
        element={
          isAuthenticated ? (
            <PlayerProfile />
          ) : (
            <Navigate to="/player/login" replace />
          )
        } 
      />
      <Route 
        path="/tournaments" 
        element={
          isAuthenticated ? (
            <PlayerTournaments />
          ) : (
            <Navigate to="/player/login" replace />
          )
        } 
      />
      <Route 
        path="/applications" 
        element={
          isAuthenticated ? (
            <PlayerApplications />
          ) : (
            <Navigate to="/player/login" replace />
          )
        } 
      />
      <Route 
        path="/rankings" 
        element={
          isAuthenticated ? (
            <PlayerRankings />
          ) : (
            <Navigate to="/player/login" replace />
          )
        } 
      />
      <Route 
        path="/matches" 
        element={
          isAuthenticated ? (
            <PlayerMatches />
          ) : (
            <Navigate to="/player/login" replace />
          )
        } 
      />
      <Route 
        path="/tournament/:tournamentId/bracket" 
        element={
          isAuthenticated ? (
            <PlayerTournamentBracket />
          ) : (
            <Navigate to="/player/login" replace />
          )
        } 
      />
      
      {/* 기본 경로 처리 */}
      <Route 
        path="/" 
        element={
          <Navigate 
            to={isAuthenticated ? "/player/dashboard" : "/player/login"} 
            replace 
          />
        } 
      />
      
      {/* 존재하지 않는 경로 처리 */}
      <Route 
        path="*" 
        element={
          <Navigate 
            to={isAuthenticated ? "/player/dashboard" : "/player/login"} 
            replace 
          />
        } 
      />
    </Routes>
  );
};

export default Player;