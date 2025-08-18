/**
 * 🚨 중앙화된 에러 처리 시스템
 * 모든 애플리케이션 에러를 표준화하여 관리
 */

/**
 * 기본 애플리케이션 에러 클래스
 * 모든 커스텀 에러의 부모 클래스
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly timestamp: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_SERVER_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    this.details = details;

    // 스택 트레이스에서 이 생성자 제거
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 에러 객체를 JSON으로 변환
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      error: this.errorCode,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(this.details && { details: this.details })
    };
  }
}

/**
 * 🔍 유효성 검사 에러 (400)
 * 입력값이 잘못되었을 때 사용
 */
export class ValidationError extends AppError {
  constructor(message: string = '입력값이 올바르지 않습니다.', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }

  /**
   * 여러 필드 검증 에러를 위한 팩토리 메서드
   */
  static fromValidationResults(validationErrors: any[]) {
    return new ValidationError(
      '입력값 검증에 실패했습니다.',
      { validationErrors }
    );
  }

  /**
   * 단일 필드 검증 에러를 위한 팩토리 메서드
   */
  static forField(field: string, value: any, expectedFormat: string) {
    return new ValidationError(
      `${field} 필드가 올바르지 않습니다.`,
      { field, value, expectedFormat }
    );
  }
}

/**
 * 🔐 인증/인가 에러 (401, 403)
 * 로그인이나 권한과 관련된 에러
 */
export class AuthError extends AppError {
  constructor(
    message: string = '인증에 실패했습니다.',
    statusCode: number = 401,
    errorCode: string = 'AUTH_ERROR'
  ) {
    super(message, statusCode, errorCode, true);
  }

  /**
   * 로그인 실패 에러
   */
  static loginFailed(attempts?: number) {
    return new AuthError(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
      401,
      'LOGIN_FAILED'
    );
  }

  /**
   * 토큰 만료 에러
   */
  static tokenExpired() {
    return new AuthError(
      '토큰이 만료되었습니다. 다시 로그인해주세요.',
      401,
      'TOKEN_EXPIRED'
    );
  }

  /**
   * 토큰 유효하지 않음 에러
   */
  static invalidToken() {
    return new AuthError(
      '유효하지 않은 토큰입니다.',
      401,
      'INVALID_TOKEN'
    );
  }

  /**
   * 권한 부족 에러
   */
  static forbidden(resource?: string) {
    return new AuthError(
      resource ? `${resource}에 대한 권한이 없습니다.` : '권한이 부족합니다.',
      403,
      'FORBIDDEN'
    );
  }

  /**
   * 계정 비활성화 에러
   */
  static accountDeactivated() {
    return new AuthError(
      '비활성화된 계정입니다. 관리자에게 문의해주세요.',
      401,
      'ACCOUNT_DEACTIVATED'
    );
  }

  /**
   * 이메일 미인증 에러
   */
  static emailNotVerified() {
    return new AuthError(
      '이메일 인증이 필요합니다.',
      401,
      'EMAIL_NOT_VERIFIED'
    );
  }
}

/**
 * 🔍 리소스 없음 에러 (404)
 * 요청한 리소스를 찾을 수 없을 때 사용
 */
export class NotFoundError extends AppError {
  constructor(resource: string = '리소스', id?: string) {
    const message = id 
      ? `${resource}(ID: ${id})를 찾을 수 없습니다.`
      : `${resource}를 찾을 수 없습니다.`;
    
    super(message, 404, 'NOT_FOUND', true, { resource, id });
  }

  /**
   * 사용자 없음 에러
   */
  static user(userId?: string) {
    return new NotFoundError('사용자', userId);
  }

  /**
   * 토너먼트 없음 에러
   */
  static tournament(tournamentId?: string) {
    return new NotFoundError('토너먼트', tournamentId);
  }

  /**
   * 선수 없음 에러
   */
  static player(playerId?: string) {
    return new NotFoundError('선수', playerId);
  }

  /**
   * 경기 없음 에러
   */
  static match(matchId?: string) {
    return new NotFoundError('경기', matchId);
  }

  /**
   * 관리자 없음 에러
   */
  static admin(adminId?: string) {
    return new NotFoundError('관리자', adminId);
  }
}

/**
 * ⚠️ 비즈니스 로직 에러 (400)
 * 비즈니스 규칙 위반 시 사용
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'BUSINESS_LOGIC_ERROR', true, details);
  }

  /**
   * 토너먼트 등록 불가 에러
   */
  static tournamentRegistrationClosed() {
    return new BusinessLogicError('토너먼트 등록 기간이 마감되었습니다.');
  }

  /**
   * 중복 등록 에러
   */
  static alreadyRegistered(resource: string) {
    return new BusinessLogicError(`이미 ${resource}에 등록되었습니다.`);
  }

  /**
   * 정원 초과 에러
   */
  static capacityExceeded(maxCapacity: number) {
    return new BusinessLogicError(
      `최대 참가 인원(${maxCapacity}명)을 초과했습니다.`,
      { maxCapacity }
    );
  }

  /**
   * 실력 수준 미달 에러
   */
  static skillLevelNotMet(required: string, current: string) {
    return new BusinessLogicError(
      `이 토너먼트는 ${required} 이상 실력자만 참가 가능합니다. (현재: ${current})`,
      { required, current }
    );
  }

  /**
   * 경기 결과 이미 입력됨 에러
   */
  static matchAlreadyCompleted() {
    return new BusinessLogicError('이미 완료된 경기입니다.');
  }

  /**
   * 잘못된 경기 상태 에러
   */
  static invalidMatchState(currentState: string, requiredState: string) {
    return new BusinessLogicError(
      `경기 상태가 올바르지 않습니다. (현재: ${currentState}, 필요: ${requiredState})`,
      { currentState, requiredState }
    );
  }
}

/**
 * 🌐 외부 서비스 에러 (502, 503)
 * 외부 API나 서비스 연동 실패 시 사용
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = '외부 서비스 연동에 실패했습니다.',
    statusCode: number = 502
  ) {
    super(
      `${service}: ${message}`,
      statusCode,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { service }
    );
  }

  /**
   * 데이터베이스 연결 에러
   */
  static databaseConnection() {
    return new ExternalServiceError(
      'Database',
      '데이터베이스 연결에 실패했습니다.',
      503
    );
  }

  /**
   * 이메일 서비스 에러
   */
  static emailService() {
    return new ExternalServiceError(
      'Email Service',
      '이메일 발송에 실패했습니다.'
    );
  }

  /**
   * 파일 업로드 서비스 에러
   */
  static fileUpload() {
    return new ExternalServiceError(
      'File Upload Service',
      '파일 업로드에 실패했습니다.'
    );
  }
}

/**
 * 🚫 Rate Limit 에러 (429)
 * 요청 빈도 제한 초과 시 사용
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
  }

  /**
   * 로그인 시도 제한 에러
   */
  static loginAttempts(retryAfter: number = 900) {
    return new RateLimitError(
      '로그인 시도 횟수가 초과되었습니다. 15분 후 다시 시도해주세요.',
      retryAfter
    );
  }

  /**
   * API 요청 제한 에러
   */
  static apiRequests(retryAfter: number = 900) {
    return new RateLimitError(
      'API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.',
      retryAfter
    );
  }
}

/**
 * 💾 파일 관련 에러 (400, 413)
 * 파일 업로드, 처리 관련 에러
 */
export class FileError extends AppError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode, 'FILE_ERROR', true);
  }

  /**
   * 파일 크기 초과 에러
   */
  static fileTooLarge(maxSize: string) {
    return new FileError(
      `파일 크기가 너무 큽니다. (최대: ${maxSize})`,
      413
    );
  }

  /**
   * 지원하지 않는 파일 형식 에러
   */
  static unsupportedFileType(allowedTypes: string[]) {
    return new FileError(
      `지원하지 않는 파일 형식입니다. (지원 형식: ${allowedTypes.join(', ')})`
    );
  }

  /**
   * 파일 처리 실패 에러
   */
  static processingFailed() {
    return new FileError('파일 처리 중 오류가 발생했습니다.');
  }
}

/**
 * 🔧 시스템 에러 (500)
 * 예상치 못한 서버 내부 에러
 */
export class SystemError extends AppError {
  constructor(
    message: string = '서버 내부 오류가 발생했습니다.',
    originalError?: Error
  ) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, {
      originalError: originalError?.message,
      stack: originalError?.stack
    });
  }

  /**
   * 데이터베이스 에러
   */
  static database(originalError: Error) {
    return new SystemError(
      '데이터베이스 처리 중 오류가 발생했습니다.',
      originalError
    );
  }

  /**
   * 구성 에러
   */
  static configuration(configKey: string) {
    return new SystemError(
      `시스템 구성 오류: ${configKey}가 올바르지 않습니다.`
    );
  }
}

/**
 * 에러 타입 체크 헬퍼 함수들
 */
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isOperationalError = (error: any): boolean => {
  return isAppError(error) && error.isOperational;
};

/**
 * 에러 팩토리 - 자주 사용되는 에러들을 쉽게 생성
 */
export const ErrorFactory = {
  // 인증 관련
  invalidCredentials: () => AuthError.loginFailed(),
  tokenExpired: () => AuthError.tokenExpired(),
  insufficientPermissions: () => AuthError.forbidden(),
  
  // 리소스 관련
  userNotFound: (id?: string) => NotFoundError.user(id),
  tournamentNotFound: (id?: string) => NotFoundError.tournament(id),
  playerNotFound: (id?: string) => NotFoundError.player(id),
  
  // 비즈니스 로직 관련
  tournamentFull: (capacity: number) => BusinessLogicError.capacityExceeded(capacity),
  alreadyRegistered: () => BusinessLogicError.alreadyRegistered('토너먼트'),
  
  // 시스템 관련
  databaseError: (error: Error) => SystemError.database(error),
  configurationError: (key: string) => SystemError.configuration(key),
  
  // 파일 관련
  fileTooLarge: (maxSize: string) => FileError.fileTooLarge(maxSize),
  invalidFileType: (allowed: string[]) => FileError.unsupportedFileType(allowed),
  
  // Rate Limiting
  tooManyRequests: () => new RateLimitError(),
  tooManyLoginAttempts: () => RateLimitError.loginAttempts(),
};

// 기본 내보내기
export default AppError;