import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError, isOperationalError } from '../utils/AppError';
import { env, isDevelopment, isProduction } from '../config/environment';

/**
 * 🚨 중앙화된 에러 처리 미들웨어
 * 모든 에러를 일관된 형태로 처리하고 응답
 */

/**
 * 에러 로깅 인터페이스
 */
interface ErrorLogData {
  message: string;
  statusCode: number;
  errorCode: string;
  timestamp: string;
  requestUrl: string;
  requestMethod: string;
  userAgent?: string;
  userId?: string;
  userRole?: string;
  requestBody?: any;
  stack?: string;
  isOperational: boolean;
}

/**
 * 에러 로깅 함수
 */
const logError = (error: Error | AppError, req: Request): void => {
  const logData: ErrorLogData = {
    message: error.message,
    statusCode: isAppError(error) ? error.statusCode : 500,
    errorCode: isAppError(error) ? error.errorCode : 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    requestUrl: req.url,
    requestMethod: req.method,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    userRole: (req as any).user?.role,
    requestBody: sanitizeRequestBody(req.body),
    isOperational: isAppError(error) ? error.isOperational : false,
  };

  // 스택 트레이스는 개발 환경이나 운영 에러에만 포함
  if (isDevelopment || !isOperationalError(error)) {
    logData.stack = error.stack;
  }

  // 에러 심각도에 따른 로깅
  if (logData.statusCode >= 500 || !logData.isOperational) {
    // 서버 에러는 error 레벨로 로깅
    console.error('🚨 Server Error:', JSON.stringify(logData, null, 2));
  } else if (logData.statusCode >= 400) {
    // 클라이언트 에러는 warn 레벨로 로깅
    console.warn('⚠️  Client Error:', JSON.stringify(logData, null, 2));
  }

  // 프로덕션 환경에서는 외부 로깅 서비스로 전송
  if (isProduction && (!isOperationalError(error) || logData.statusCode >= 500)) {
    // 여기에 외부 로깅 서비스 (Sentry, LogRocket 등) 연동
    // sendToExternalLoggingService(logData);
  }
};

/**
 * 요청 본문에서 민감한 정보 제거
 */
const sanitizeRequestBody = (body: any): any => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'refreshToken',
    'resetToken',
    'verifyToken',
    'secret',
    'apiKey'
  ];

  const sanitized = { ...body };

  const sanitizeObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    }
    
    return obj;
  };

  return sanitizeObject(sanitized);
};

/**
 * Prisma 데이터베이스 에러 처리
 */
const handlePrismaError = (error: any): AppError => {
  const { AppError, ValidationError, NotFoundError, BusinessLogicError } = require('../utils/AppError');

  switch (error.code) {
    case 'P2002':
      // 고유 제약 조건 위반
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target.join(', ') : target;
      return new ValidationError(
        `${field ? `${field} 필드가` : '입력값이'} 이미 존재합니다.`,
        { constraint: 'unique', field: target }
      );

    case 'P2025':
      // 레코드를 찾을 수 없음
      return new NotFoundError('요청한 데이터');

    case 'P2003':
      // 외래 키 제약 조건 위반
      return new ValidationError(
        '참조하는 데이터가 존재하지 않습니다.',
        { constraint: 'foreign_key' }
      );

    case 'P2014':
      // 관련 레코드가 필요함
      return new BusinessLogicError(
        '삭제하려는 데이터가 다른 곳에서 사용 중입니다.'
      );

    case 'P1008':
      // 연결 시간 초과
      return new AppError(
        '데이터베이스 연결 시간이 초과되었습니다.',
        503,
        'DATABASE_TIMEOUT'
      );

    case 'P1017':
      // 연결 끊김
      return new AppError(
        '데이터베이스 연결이 끊어졌습니다.',
        503,
        'DATABASE_CONNECTION_LOST'
      );

    default:
      return new AppError(
        '데이터베이스 처리 중 오류가 발생했습니다.',
        500,
        'DATABASE_ERROR',
        false,
        { originalCode: error.code, originalMessage: error.message }
      );
  }
};

/**
 * JWT 에러 처리
 */
const handleJWTError = (error: any): AppError => {
  const { AuthError } = require('../utils/AppError');

  if (error.name === 'JsonWebTokenError') {
    return AuthError.invalidToken();
  }
  
  if (error.name === 'TokenExpiredError') {
    return AuthError.tokenExpired();
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthError(
      '토큰이 아직 활성화되지 않았습니다.',
      401,
      'TOKEN_NOT_ACTIVE'
    );
  }

  return new AuthError('토큰 처리 중 오류가 발생했습니다.');
};

/**
 * Multer 파일 업로드 에러 처리
 */
const handleMulterError = (error: any): AppError => {
  const { FileError } = require('../utils/AppError');

  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return FileError.fileTooLarge(error.field);
    
    case 'LIMIT_FILE_COUNT':
      return new FileError('업로드할 수 있는 파일 개수를 초과했습니다.');
    
    case 'LIMIT_UNEXPECTED_FILE':
      return new FileError('예상하지 못한 파일 필드입니다.');
    
    default:
      return new FileError('파일 업로드 중 오류가 발생했습니다.');
  }
};

/**
 * 개발 환경용 에러 응답 생성
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    error: err.errorCode,
    statusCode: err.statusCode,
    timestamp: err.timestamp,
    stack: err.stack,
    details: err.details
  });
};

/**
 * 프로덕션 환경용 에러 응답 생성
 */
const sendErrorProd = (err: AppError, res: Response): void => {
  // 운영 에러(예상된 에러)인 경우 클라이언트에게 에러 정보 전송
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode,
      timestamp: err.timestamp,
      ...(err.details && { details: err.details })
    });
  } else {
    // 프로그래밍 에러인 경우 일반적인 메시지만 전송
    console.error('💥 Programming Error:', err);
    
    res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 글로벌 에러 핸들러 미들웨어
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = isAppError(err) ? err : new AppError(err.message, 500, 'INTERNAL_SERVER_ERROR', false);

  // 특정 에러 타입별 처리
  if (err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientUnknownRequestError') {
    error = handlePrismaError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
    error = handleJWTError(err);
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  } else if (err.name === 'ValidationError') {
    // express-validator나 다른 validation 라이브러리 에러
    const { ValidationError } = require('../utils/AppError');
    error = new ValidationError(err.message);
  }

  // 에러 로깅
  logError(error, req);

  // 환경별 에러 응답
  if (isDevelopment) {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * 404 에러 핸들러 (라우트를 찾을 수 없는 경우)
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const { NotFoundError } = require('../utils/AppError');
  const error = new NotFoundError(`경로 ${req.originalUrl}`);
  next(error);
};

/**
 * 비동기 함수 에러 처리를 위한 래퍼
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Promise rejection 처리
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    
    // 프로덕션 환경에서는 graceful shutdown
    if (isProduction) {
      console.log('💀 Shutting down due to unhandled rejection...');
      process.exit(1);
    }
  });
};

/**
 * Uncaught Exception 처리
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (err: Error) => {
    console.error('💥 Uncaught Exception:', err.name, err.message);
    console.error('Stack:', err.stack);
    
    console.log('💀 Shutting down due to uncaught exception...');
    process.exit(1);
  });
};

/**
 * Graceful shutdown 처리
 */
export const setupGracefulShutdown = (server: any): void => {
  const shutdown = (signal: string) => {
    console.log(`🛑 ${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });

    // 강제 종료 타이머 (30초)
    setTimeout(() => {
      console.error('💀 Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * 에러 핸들러 설정 함수
 */
export const setupErrorHandling = (app: any, server?: any): void => {
  // 글로벌 에러 처리 설정
  handleUncaughtException();
  handleUnhandledRejection();
  
  // 404 핸들러 등록
  app.use(notFoundHandler);
  
  // 글로벌 에러 핸들러 등록
  app.use(globalErrorHandler);
  
  // Graceful shutdown 설정 (서버 인스턴스가 있는 경우)
  if (server) {
    setupGracefulShutdown(server);
  }
};

// 기본 export
export default {
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  setupErrorHandling
};