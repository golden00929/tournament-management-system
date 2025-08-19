import { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

/**
 * 토큰 자동 갱신 훅
 * 토큰이 만료되기 전에 자동으로 갱신하여 세션 유지
 */
export const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 토큰 디코딩 함수
  const decodeToken = useCallback((token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }, []);

  // 토큰 만료 시간 확인
  const getTokenExpiration = useCallback((token: string): Date | null => {
    const decoded = decodeToken(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  }, [decodeToken]);

  // 토큰이 곧 만료되는지 확인 (30분 이내)
  const isTokenExpiringSoon = useCallback((token: string): boolean => {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    
    const now = new Date();
    const timeUntilExpiry = expiration.getTime() - now.getTime();
    const thirtyMinutes = 30 * 60 * 1000; // 30분을 밀리초로
    
    return timeUntilExpiry <= thirtyMinutes;
  }, [getTokenExpiration]);

  // 토큰 갱신 함수
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      console.log('🔄 Attempting to refresh token...');
      
      // 현재 경로가 선수 페이지인지 확인하여 적절한 API 엔드포인트 사용
      const isPlayerPage = window.location.pathname.startsWith('/player/');
      const refreshEndpoint = isPlayerPage ? '/player-auth/refresh' : '/auth/refresh';
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}${refreshEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // 새로운 토큰 저장
          localStorage.setItem('token', data.data.accessToken);
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
          
          console.log('✅ Token refreshed successfully');
          
          // 다음 갱신 스케줄 설정
          scheduleTokenRefresh(data.data.accessToken);
          return true;
        }
      }
      
      console.log('❌ Token refresh failed');
      return false;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }, []);

  // 토큰 갱신 스케줄 설정
  const scheduleTokenRefresh = useCallback((token: string) => {
    // 기존 타이머 클리어
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const expiration = getTokenExpiration(token);
    if (!expiration) {
      console.log('❌ Cannot schedule refresh - invalid token');
      return;
    }

    const now = new Date();
    const timeUntilExpiry = expiration.getTime() - now.getTime();
    
    // 만료 30분 전에 갱신 (최소 1분 후)
    const refreshTime = Math.max(timeUntilExpiry - (30 * 60 * 1000), 60 * 1000);
    
    console.log(`⏰ Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);

    refreshTimerRef.current = setTimeout(async () => {
      console.log('🔄 Auto-refreshing token...');
      const success = await refreshToken();
      
      if (!success) {
        console.log('❌ Auto-refresh failed, logging out...');
        // 갱신 실패 시 로그아웃
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        dispatch(logout());
        
        // 선수 페이지라면 선수 로그인으로, 아니면 관리자 로그인으로
        if (window.location.pathname.startsWith('/player/')) {
          window.location.href = '/player/login';
        } else {
          window.location.href = '/login';
        }
      }
    }, refreshTime);
  }, [getTokenExpiration, refreshToken, dispatch]);

  // 토큰 체크 및 갱신 시작
  const startTokenRefresh = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔍 Checking token expiration...');
      
      // 즉시 만료 확인
      if (isTokenExpiringSoon(token)) {
        console.log('⚠️ Token expires soon, refreshing immediately...');
        refreshToken();
      } else {
        // 미래 갱신 스케줄
        scheduleTokenRefresh(token);
      }
    }
  }, [isTokenExpiringSoon, refreshToken, scheduleTokenRefresh]);

  // 정리 함수
  const cleanup = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // 컴포넌트 마운트 시 토큰 갱신 시작
    startTokenRefresh();

    // storage 이벤트 리스너 (다른 탭에서 토큰 변경 시)
    const handleStorageChange = () => {
      startTokenRefresh();
    };

    window.addEventListener('storage', handleStorageChange);

    // 클린업
    return () => {
      cleanup();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [startTokenRefresh, cleanup]);

  return {
    refreshToken,
    startTokenRefresh,
    cleanup
  };
};

export default useTokenRefresh;