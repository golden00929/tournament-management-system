import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error('Error:', err);

  // Prisma error handling
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    switch (prismaError.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: '중복된 데이터입니다.',
          error: 'DUPLICATE_ENTRY'
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: '요청한 데이터를 찾을 수 없습니다.',
          error: 'NOT_FOUND'
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          message: '관련 데이터가 존재하지 않습니다.',
          error: 'FOREIGN_KEY_CONSTRAINT'
        });
      default:
        return res.status(500).json({
          success: false,
          message: '데이터베이스 오류가 발생했습니다.',
          error: 'DATABASE_ERROR'
        });
    }
  }

  // Validation error handling
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '입력 데이터가 올바르지 않습니다.',
      error: 'VALIDATION_ERROR',
      details: err.message
    });
  }

  // JWT error handling
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 유효하지 않습니다.',
      error: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 만료되었습니다.',
      error: 'TOKEN_EXPIRED'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 내부 오류가 발생했습니다.';

  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : 'INTERNAL_SERVER_ERROR'
  });
};