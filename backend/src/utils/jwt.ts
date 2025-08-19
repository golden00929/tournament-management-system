import * as jwt from 'jsonwebtoken';
import { env } from '../config/environment';

/**
 * JWT 토큰 관리 유틸리티
 * 보안 강화: 액세스 토큰 1시간, 리프레시 토큰 7일로 설정
 */

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
  tokenType?: 'access' | 'refresh'; // 토큰 타입 구분
  iat?: number; // 발급 시간
  exp?: number; // 만료 시간
}

/**
 * 액세스 토큰 생성 (역할에 따라 다른 만료 시간)
 * 관리자: 2시간, 선수: 12시간 (프로덕션 기준)
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  // 선수용 토큰은 더 긴 만료 시간 적용
  const isPlayer = payload.role === 'player';
  const expiresIn = isPlayer 
    ? (process.env.NODE_ENV === 'development' ? '24h' : '12h') // 선수용: 12시간
    : env.JWT_ACCESS_EXPIRES_IN; // 관리자용: 기본 설정 (2시간)

  return jwt.sign(
    { 
      userId: payload.userId, 
      email: payload.email, 
      role: payload.role,
      name: payload.name,
      tokenType: 'access'
    },
    env.JWT_SECRET,
    { 
      expiresIn,
      issuer: 'tournament-management-system',
      audience: 'tournament-users'
    }
  );
};

/**
 * 리프레시 토큰 생성 (7일 만료)
 * 액세스 토큰 갱신에만 사용됩니다.
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(
    { 
      userId: payload.userId, 
      email: payload.email, 
      role: payload.role,
      tokenType: 'refresh'
    },
    env.JWT_REFRESH_SECRET,
    { 
      expiresIn: env.JWT_REFRESH_EXPIRES_IN, // 7일
      issuer: 'tournament-management-system',
      audience: 'tournament-users'
    }
  );
};

/**
 * 토큰 쌍 생성 (액세스 + 리프레시)
 * 로그인 시 사용됩니다.
 */
export const generateTokenPair = (payload: JwtPayload) => {
  // 선수용 토큰은 더 긴 만료 시간 적용
  const isPlayer = payload.role === 'player';
  const actualExpiresIn = isPlayer 
    ? (process.env.NODE_ENV === 'development' ? '24h' : '12h') // 선수용: 12시간
    : env.JWT_ACCESS_EXPIRES_IN; // 관리자용: 기본 설정 (2시간)

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: actualExpiresIn // 실제 만료 시간 반환
  };
};

/**
 * 액세스 토큰 검증
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'tournament-management-system',
      audience: 'tournament-users'
    }) as JwtPayload;
    
    // 토큰 타입 검증
    if (decoded.tokenType !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Access token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 리프레시 토큰 검증
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'tournament-management-system',
      audience: 'tournament-users'
    }) as JwtPayload;
    
    // 토큰 타입 검증
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Refresh token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 기존 verifyToken 함수 (하위 호환성 유지)
 * 새로운 코드에서는 verifyAccessToken 사용을 권장합니다.
 */
export const verifyToken = (token: string): JwtPayload => {
  return verifyAccessToken(token);
};

/**
 * 토큰 디코딩 (검증 없이)
 * 만료된 토큰의 정보를 확인할 때 사용합니다.
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

/**
 * 토큰 만료 시간 확인
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = decodeToken(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * 토큰이 곧 만료되는지 확인 (15분 이내)
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  const now = new Date();
  const timeUntilExpiry = expiration.getTime() - now.getTime();
  const fifteenMinutes = 15 * 60 * 1000; // 15분을 밀리초로
  
  return timeUntilExpiry <= fifteenMinutes;
};

/**
 * 하위 호환성을 위한 기존 generateToken 함수
 * 새로운 코드에서는 generateTokenPair 사용을 권장합니다.
 */
export const generateToken = (payload: JwtPayload): string => {
  return generateAccessToken(payload);
};