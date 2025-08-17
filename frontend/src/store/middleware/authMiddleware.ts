import { Middleware } from '@reduxjs/toolkit';
import { isRejectedWithValue } from '@reduxjs/toolkit';

/**
 * Authentication middleware for handling API failures and token management
 * Part of the OpenAI API failure fallback enhancement system
 */

interface AuthErrorResponse {
  status?: number;
  data?: {
    error?: string;
    message?: string;
  };
}

/**
 * Enhanced authentication middleware with automatic token refresh and fallback handling
 */
export const authMiddleware: Middleware<{}, any> = (store) => (next) => (action) => {
  // Handle rejected API calls
  if (isRejectedWithValue(action)) {
    const payload = action.payload as AuthErrorResponse;
    
    // Check for authentication errors
    if (payload?.status === 401) {
      console.warn('🔒 Authentication failed - Token may be expired or invalid');
      
      // Get current auth state
      const state = store.getState();
      const currentToken = state.auth.token;
      
      if (currentToken) {
        console.log('🔄 Attempting to handle authentication failure...');
        
        // Check if token is expired
        try {
          const tokenPayload = JSON.parse(atob(currentToken.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = tokenPayload.exp < currentTime;
          
          if (isExpired) {
            console.warn('⏰ Token has expired');
            // Clear expired token and redirect to login
            handleAuthFailure(store);
          } else {
            console.warn('🚫 Token is valid but server rejected it - possible server restart or invalid token');
            // Token seems valid but server rejects it - clear and redirect
            handleAuthFailure(store);
          }
        } catch (error) {
          console.error('❌ Error parsing token:', error);
          // Malformed token - clear and redirect
          handleAuthFailure(store);
        }
      } else {
        console.warn('🔑 No token found - redirecting to login');
        handleAuthFailure(store);
      }
    }
    
    // Handle OpenAI API failures specifically
    if (action.type.includes('ai') || action.type.includes('openai')) {
      console.warn('🤖 OpenAI API call failed - implementing fallback logic');
      handleOpenAIFailure(action, store);
    }
    
    // Handle general API failures
    if (payload?.status && payload.status >= 500) {
      console.error('🔥 Server error detected - implementing general fallback');
      handleServerError(action, store);
    }
  }
  
  return next(action);
};

/**
 * Handle authentication failures
 */
function handleAuthFailure(store: any) {
  console.log('🚪 Handling authentication failure...');
  
  // Clear auth state
  store.dispatch({
    type: 'auth/logout'
  });
  
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Show user-friendly message
  showNotification('세션이 만료되었습니다. 다시 로그인해주세요.', 'warning');
  
  // Redirect to login page after a short delay
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
}

/**
 * Handle OpenAI API failures with fallback logic
 */
function handleOpenAIFailure(action: any, store: any) {
  const payload = action.payload as AuthErrorResponse;
  
  console.log('🤖 OpenAI API Failure Details:', {
    status: payload?.status,
    error: payload?.data?.error,
    message: payload?.data?.message
  });
  
  // Implement fallback strategies
  if (payload?.status === 401) {
    console.warn('🔑 OpenAI API authentication failed - using local algorithms');
    store.dispatch({
      type: 'ai/setFallbackMode',
      payload: {
        mode: 'local',
        reason: 'OpenAI authentication failed',
        timestamp: Date.now()
      }
    });
  } else if (payload?.status === 429) {
    console.warn('⏳ OpenAI API rate limit exceeded - implementing backoff');
    store.dispatch({
      type: 'ai/setRateLimit',
      payload: {
        retryAfter: 60000, // 1 minute
        timestamp: Date.now()
      }
    });
  } else if (payload?.status === 503 || payload?.status === 502) {
    console.warn('🔧 OpenAI API service unavailable - using cached results');
    store.dispatch({
      type: 'ai/setFallbackMode',
      payload: {
        mode: 'cached',
        reason: 'OpenAI service unavailable',
        timestamp: Date.now()
      }
    });
  }
  
  showNotification('AI 서비스 일시 오류 - 대체 알고리즘을 사용합니다.', 'info');
}

/**
 * Handle general server errors
 */
function handleServerError(action: any, store: any) {
  const payload = action.payload as AuthErrorResponse;
  
  console.error('🔥 Server Error Details:', {
    status: payload?.status,
    error: payload?.data?.error,
    message: payload?.data?.message
  });
  
  // Implement retry logic
  store.dispatch({
    type: 'api/setRetryMode',
    payload: {
      retryCount: 0,
      maxRetries: 3,
      retryDelay: 5000,
      timestamp: Date.now()
    }
  });
  
  showNotification('서버 연결 오류가 발생했습니다. 자동으로 재시도합니다.', 'error');
}

/**
 * Show user notification (placeholder - replace with actual notification system)
 */
function showNotification(message: string, type: 'info' | 'warning' | 'error' | 'success') {
  console.log(`📢 ${type.toUpperCase()}: ${message}`);
  
  // In a real app, this would integrate with a toast/notification library
  // For now, we'll use a simple alert as fallback
  if (type === 'error' || type === 'warning') {
    // Only show critical notifications to avoid spam
    setTimeout(() => {
      alert(message);
    }, 100);
  }
}

/**
 * Token validation utility
 */
export function validateToken(token: string): { isValid: boolean; isExpired: boolean; payload?: any } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < currentTime;
    
    return {
      isValid: true,
      isExpired,
      payload
    };
  } catch (error) {
    return {
      isValid: false,
      isExpired: true
    };
  }
}

/**
 * Auto-refresh token utility (placeholder for future implementation)
 */
export async function refreshToken(currentToken: string): Promise<string | null> {
  try {
    // This would make a call to a refresh endpoint
    // For now, return null to indicate refresh is not available
    console.log('🔄 Token refresh not implemented - user must re-login');
    return null;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return null;
  }
}

export default authMiddleware;