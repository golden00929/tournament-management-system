import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { env, isProduction } from '../config/environment';

/**
 * 🛡️ 보안 미들웨어 설정
 * 프로덕션 환경에서 안전한 웹 애플리케이션을 위한 보안 설정들
 */

/**
 * Helmet 미들웨어 설정
 * HTTP 헤더를 통한 다양한 보안 취약점 방지
 */
export const helmetConfig = helmet({
  // Content Security Policy 설정
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["'none'"],
    },
  },
  
  // Cross-Origin-Embedder-Policy 설정
  crossOriginEmbedderPolicy: false, // React 호환성을 위해 비활성화
  
  // X-DNS-Prefetch-Control 설정
  dnsPrefetchControl: { allow: false },
  
  // X-Frame-Options 설정 (클릭재킹 방지)
  frameguard: { action: 'deny' },
  
  // X-Powered-By 헤더 숨김
  hidePoweredBy: true,
  
  // HSTS (HTTP Strict Transport Security) 설정
  hsts: isProduction ? {
    maxAge: 31536000, // 1년
    includeSubDomains: true,
    preload: true
  } : false,
  
  // IE8+ XSS 필터 활성화
  ieNoOpen: true,
  
  // MIME 타입 스니핑 방지
  noSniff: true,
  
  // Origin-Agent-Cluster 헤더 설정
  originAgentCluster: true,
  
  // Permissions-Policy 설정
  permittedCrossDomainPolicies: false,
  
  // Referrer-Policy 설정
  referrerPolicy: { policy: 'no-referrer' },
  
  // X-XSS-Protection 설정
  xssFilter: true,
});

/**
 * CORS 설정
 * 크로스 오리진 요청을 안전하게 관리
 */
export const corsConfig = cors({
  // 허용할 도메인 설정
  origin: (origin, callback) => {
    // 개발 환경에서는 모든 도메인 허용
    if (!isProduction) {
      return callback(null, true);
    }
    
    // 프로덕션 환경에서는 화이트리스트 도메인만 허용
    const allowedOrigins = [
      env.CLIENT_URL,
      'https://sportsgamemanager.netlify.app',
      'https://magnificent-entremet-27d825.netlify.app', // 이전 URL 백업용
      'https://your-frontend-domain.com',
      'https://www.your-frontend-domain.com'
    ];
    
    // Origin이 없는 경우 (모바일 앱, Postman 등) 허용
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단된 요청입니다.'));
    }
  },
  
  // 허용할 HTTP 메서드
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // 허용할 헤더
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Token-Refresh-Required'
  ],
  
  // 클라이언트가 접근할 수 있는 헤더
  exposedHeaders: ['X-Token-Refresh-Required'],
  
  // 인증 정보 포함 허용
  credentials: true,
  
  // Preflight 요청 캐시 시간 (초)
  maxAge: 86400, // 24시간
});

/**
 * 일반 API 요청에 대한 Rate Limiting
 * 15분 동안 100회 요청 제한
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: {
    success: false,
    message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    error: 'TOO_MANY_REQUESTS',
    retryAfter: '15분'
  },
  
  // 제한 초과 시 응답 상태 코드
  statusCode: 429,
  
  // 헤더에 제한 정보 포함
  standardHeaders: true,
  
  // X-RateLimit-* 헤더 사용
  legacyHeaders: false,
  
  // IP 주소 기반 제한
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  
  // 제한 도달 시 실행할 함수
  onLimitReached: (req: Request, res: Response) => {
    console.warn(`⚠️  Rate limit reached for IP: ${req.ip}`);
  },
});

/**
 * 로그인 요청에 대한 엄격한 Rate Limiting
 * 15분 동안 5회 로그인 시도 제한 (브루트포스 공격 방지)
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 로그인 시도
  message: {
    success: false,
    message: '로그인 시도 횟수가 초과되었습니다. 15분 후 다시 시도해주세요.',
    error: 'LOGIN_RATE_LIMIT_EXCEEDED',
    retryAfter: '15분'
  },
  
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  
  // IP와 이메일 조합으로 제한 (더 정교한 제한)
  keyGenerator: (req: Request) => {
    const ip = req.ip || 'unknown';
    const email = req.body?.email || 'no-email';
    return `${ip}:${email}`;
  },
  
  // 로그인 제한 도달 시 보안 로그 기록
  onLimitReached: (req: Request, res: Response) => {
    const ip = req.ip;
    const email = req.body?.email;
    console.error(`🚨 Login rate limit exceeded - IP: ${ip}, Email: ${email}`);
    
    // 필요시 보안 알림이나 로그 시스템으로 전송
    // sendSecurityAlert({ type: 'LOGIN_RATE_LIMIT', ip, email });
  },
  
  // 성공적인 로그인 시 카운터 리셋
  skipSuccessfulRequests: true,
});

/**
 * 회원가입 요청에 대한 Rate Limiting
 * 1시간 동안 3회 회원가입 시도 제한
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 최대 3회 회원가입 시도
  message: {
    success: false,
    message: '회원가입 시도 횟수가 초과되었습니다. 1시간 후 다시 시도해주세요.',
    error: 'REGISTER_RATE_LIMIT_EXCEEDED',
    retryAfter: '1시간'
  },
  
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  
  onLimitReached: (req: Request, res: Response) => {
    console.warn(`⚠️  Register rate limit reached for IP: ${req.ip}`);
  },
});

/**
 * 비밀번호 재설정 요청에 대한 Rate Limiting
 * 1시간 동안 3회 요청 제한
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 최대 3회 요청
  message: {
    success: false,
    message: '비밀번호 재설정 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.',
    error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: '1시간'
  },
  
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req: Request) => {
    const ip = req.ip || 'unknown';
    const email = req.body?.email || 'no-email';
    return `password-reset:${ip}:${email}`;
  },
});

/**
 * 보안 헤더 추가 미들웨어
 * 추가적인 보안 헤더들을 설정
 */
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // 서버 정보 숨김
  res.removeHeader('X-Powered-By');
  
  // 추가 보안 헤더
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // API 응답임을 명시
  res.setHeader('X-API-Version', '1.0');
  
  // 캐시 제어 (민감한 데이터가 캐시되지 않도록)
  if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  next();
};

/**
 * IP 화이트리스트 체크 미들웨어 (관리자 전용 엔드포인트용)
 * 특정 IP에서만 관리자 기능에 접근할 수 있도록 제한
 */
export const adminIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  // 개발 환경에서는 IP 제한 비활성화
  if (!isProduction) {
    return next();
  }
  
  const clientIP = req.ip;
  const allowedIPs = [
    '127.0.0.1',
    '::1',
    // 프로덕션 환경에서 허용할 관리자 IP 주소들을 여기에 추가
    // '192.168.1.100',
    // '10.0.0.50'
  ];
  
  if (allowedIPs.includes(clientIP)) {
    next();
  } else {
    console.error(`🚨 Unauthorized admin access attempt from IP: ${clientIP}`);
    res.status(403).json({
      success: false,
      message: '접근이 거부되었습니다.',
      error: 'IP_NOT_WHITELISTED'
    });
  }
};

/**
 * 요청 로깅 미들웨어
 * 보안 관련 요청들을 로깅
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 응답 완료 시 로그 기록
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    // 인증 관련 요청이나 에러 응답은 더 자세히 로깅
    if (req.url.includes('/auth/') || res.statusCode >= 400) {
      console.log('🔍 Security Log:', JSON.stringify(logData, null, 2));
    }
  });
  
  next();
};

/**
 * 모든 보안 미들웨어를 하나로 결합한 함수
 * Express 앱에서 쉽게 사용할 수 있도록 제공
 */
export const setupSecurityMiddleware = () => {
  return [
    helmetConfig,
    corsConfig,
    additionalSecurityHeaders,
    securityLogger,
    generalRateLimit
  ];
};