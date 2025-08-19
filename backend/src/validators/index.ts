import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

/**
 * 📝 유효성 검사 유틸리티 및 미들웨어
 * express-validator 결과를 처리하고 에러 응답을 생성
 */

/**
 * 유효성 검사 결과를 확인하고 에러 응답을 생성하는 미들웨어
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors.array());
    
    // 유효성 검사 실패 로그 기록
    console.warn('🔍 Validation failed:', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      errors: formattedErrors,
      body: sanitizeRequestBody(req.body)
    });
    
    res.status(400).json({
      success: false,
      message: '입력값이 올바르지 않습니다.',
      error: 'VALIDATION_ERROR',
      details: formattedErrors
    });
    return;
  }
  
  next();
};

/**
 * 유효성 검사 에러를 사용자 친화적인 형태로 포맷팅
 */
const formatValidationErrors = (errors: ValidationError[]): any[] => {
  return errors.map(error => ({
    field: error.type === 'field' ? error.path : error.type,
    message: error.msg,
    value: error.type === 'field' ? error.value : undefined,
    location: error.type === 'field' ? error.location : undefined
  }));
};

/**
 * 요청 본문에서 민감한 정보를 제거하여 로그에 안전하게 기록
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
    'verifyToken'
  ];
  
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * 커스텀 유효성 검사 규칙들
 */

/**
 * 한국어 이름 유효성 검사
 */
export const isValidKoreanName = (value: string): boolean => {
  return /^[가-힣\s]+$/.test(value) && value.trim().length >= 2;
};

/**
 * 한국 휴대폰 번호 유효성 검사
 */
export const isValidKoreanPhoneNumber = (value: string): boolean => {
  return /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(value);
};

/**
 * 강력한 비밀번호 유효성 검사
 */
export const isStrongPassword = (value: string): boolean => {
  // 최소 8자, 대문자, 소문자, 숫자, 특수문자 포함
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
};

/**
 * 안전한 파일 이름 유효성 검사
 */
export const isSafeFileName = (value: string): boolean => {
  // 파일 이름에 위험한 문자가 포함되지 않았는지 확인
  return !/[<>:"/\\|?*\x00-\x1f]/.test(value) && !value.startsWith('.');
};

/**
 * 날짜 범위 유효성 검사
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

/**
 * 미래 날짜 유효성 검사
 */
export const isFutureDate = (value: string): boolean => {
  const inputDate = new Date(value);
  const now = new Date();
  return inputDate > now;
};

/**
 * 유효한 ELO 레이팅 범위 검사
 */
export const isValidEloRating = (rating: number): boolean => {
  return rating >= 100 && rating <= 3000;
};

/**
 * 토너먼트 타입 유효성 검사
 */
export const isValidTournamentType = (type: string): boolean => {
  const validTypes = ['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS_SYSTEM'];
  return validTypes.includes(type);
};

/**
 * 실력 수준 유효성 검사
 */
export const isValidSkillLevel = (level: string): boolean => {
  const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'];
  return validLevels.includes(level);
};

/**
 * UUID 형식 유효성 검사
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * JWT 토큰 형식 유효성 검사
 */
export const isValidJWT = (token: string): boolean => {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * 안전한 HTML 입력 검사 (XSS 방지)
 */
export const isSafeHtmlInput = (value: string): boolean => {
  // 기본적인 HTML 태그나 스크립트 패턴 검사
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b/gi,
    /<embed\b/gi
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(value));
};

/**
 * 파일 크기 검증 (바이트 단위)
 */
export const isValidFileSize = (size: number, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
};

/**
 * 이미지 파일 확장자 검증
 */
export const isValidImageExtension = (filename: string): boolean => {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return validExtensions.includes(extension);
};

/**
 * 문서 파일 확장자 검증
 */
export const isValidDocumentExtension = (filename: string): boolean => {
  const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return validExtensions.includes(extension);
};

// 모든 유효성 검사 규칙을 export
export * from './authValidators';
export * from './tournamentValidators';
export * from './playerValidators';