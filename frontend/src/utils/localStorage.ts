// localStorage 안전 처리 유틸리티

export const clearInvalidLocalStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    let shouldClear = false;
    
    // 'undefined' 문자열이나 null 체크
    if (!token || token === 'undefined' || token === 'null') {
      shouldClear = true;
    }
    
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      shouldClear = true;
    } else {
      // JSON 파싱 테스트
      try {
        JSON.parse(userStr);
      } catch (error) {
        console.warn('Invalid user JSON in localStorage, clearing...', error);
        shouldClear = true;
      }
    }
    
    // 한 번에 정리
    if (shouldClear) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    // 전체 localStorage 정리
    localStorage.clear();
  }
};

export const getValidUser = (): any | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.warn('Failed to parse user from localStorage:', error);
    return null;
  }
};

export const getValidToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
};