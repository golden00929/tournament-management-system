/**
 * 📚 중앙화된 에러 처리 시스템 사용 예시
 * 다양한 에러 타입과 사용법을 보여주는 예제 코드
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  AppError, 
  ValidationError, 
  AuthError, 
  NotFoundError, 
  BusinessLogicError,
  SystemError,
  FileError,
  RateLimitError,
  ErrorFactory
} from '../utils/AppError';

/**
 * 🔍 ValidationError 사용 예시
 * 입력값 검증 실패 시 사용
 */
export const validationErrorExamples = {
  // 기본 유효성 검사 에러
  basicValidation: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email) {
      throw new ValidationError('이메일을 입력해주세요.');
    }
    
    if (!password || password.length < 8) {
      throw new ValidationError('비밀번호는 8자 이상이어야 합니다.', {
        field: 'password',
        minLength: 8,
        actualLength: password?.length || 0
      });
    }
    
    res.json({ success: true });
  }),

  // 여러 필드 검증 에러
  multipleFieldValidation: asyncHandler(async (req: Request, res: Response) => {
    const validationErrors = [];
    
    if (!req.body.name) {
      validationErrors.push({ field: 'name', message: '이름은 필수입니다.' });
    }
    
    if (!req.body.email) {
      validationErrors.push({ field: 'email', message: '이메일은 필수입니다.' });
    }
    
    if (validationErrors.length > 0) {
      throw ValidationError.fromValidationResults(validationErrors);
    }
    
    res.json({ success: true });
  }),

  // 팩토리 메서드 사용
  fieldValidation: asyncHandler(async (req: Request, res: Response) => {
    const { age } = req.body;
    
    if (age && (age < 0 || age > 150)) {
      throw ValidationError.forField('age', age, '0-150 사이의 숫자');
    }
    
    res.json({ success: true });
  })
};

/**
 * 🔐 AuthError 사용 예시
 * 인증/인가 관련 에러
 */
export const authErrorExamples = {
  // 로그인 실패
  loginFailed: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = null; // 실제로는 DB에서 조회
    
    if (!user) {
      throw AuthError.loginFailed();
    }
    
    res.json({ success: true });
  }),

  // 토큰 관련 에러
  tokenErrors: asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw AuthError.invalidToken();
    }
    
    // JWT 검증 로직...
    const isExpired = true; // 예시
    if (isExpired) {
      throw AuthError.tokenExpired();
    }
    
    res.json({ success: true });
  }),

  // 권한 부족
  forbidden: asyncHandler(async (req: Request, res: Response) => {
    const userRole = 'player'; // 실제로는 토큰에서 추출
    
    if (userRole !== 'admin') {
      throw AuthError.forbidden('관리자 페이지');
    }
    
    res.json({ success: true });
  }),

  // 계정 상태 에러
  accountStatus: asyncHandler(async (req: Request, res: Response) => {
    const user = { isActive: false, isVerified: false }; // 예시
    
    if (!user.isActive) {
      throw AuthError.accountDeactivated();
    }
    
    if (!user.isVerified) {
      throw AuthError.emailNotVerified();
    }
    
    res.json({ success: true });
  })
};

/**
 * 🔍 NotFoundError 사용 예시
 * 리소스를 찾을 수 없을 때
 */
export const notFoundErrorExamples = {
  // 기본 사용법
  basicNotFound: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = null; // 실제로는 DB에서 조회
    
    if (!user) {
      throw new NotFoundError('사용자', id);
    }
    
    res.json({ user });
  }),

  // 팩토리 메서드 사용
  factoryMethods: asyncHandler(async (req: Request, res: Response) => {
    const { userId, tournamentId, playerId } = req.params;
    
    // 사용자 없음
    if (!userId) {
      throw NotFoundError.user(userId);
    }
    
    // 토너먼트 없음
    if (!tournamentId) {
      throw NotFoundError.tournament(tournamentId);
    }
    
    // 선수 없음
    if (!playerId) {
      throw NotFoundError.player(playerId);
    }
    
    res.json({ success: true });
  })
};

/**
 * ⚠️ BusinessLogicError 사용 예시
 * 비즈니스 규칙 위반 시
 */
export const businessLogicErrorExamples = {
  // 토너먼트 등록 관련
  tournamentRegistration: asyncHandler(async (req: Request, res: Response) => {
    const tournament = { 
      registrationEndDate: new Date('2023-01-01'),
      maxParticipants: 16,
      currentParticipants: 16
    };
    
    // 등록 기간 만료
    if (new Date() > tournament.registrationEndDate) {
      throw BusinessLogicError.tournamentRegistrationClosed();
    }
    
    // 정원 초과
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw BusinessLogicError.capacityExceeded(tournament.maxParticipants);
    }
    
    res.json({ success: true });
  }),

  // 중복 등록 체크
  duplicateRegistration: asyncHandler(async (req: Request, res: Response) => {
    const isAlreadyRegistered = true; // 실제로는 DB에서 체크
    
    if (isAlreadyRegistered) {
      throw BusinessLogicError.alreadyRegistered('토너먼트');
    }
    
    res.json({ success: true });
  }),

  // 실력 수준 체크
  skillLevelCheck: asyncHandler(async (req: Request, res: Response) => {
    const playerSkill = 'BEGINNER';
    const requiredSkill = 'ADVANCED';
    
    if (playerSkill !== requiredSkill) {
      throw BusinessLogicError.skillLevelNotMet(requiredSkill, playerSkill);
    }
    
    res.json({ success: true });
  }),

  // 경기 상태 체크
  matchStateCheck: asyncHandler(async (req: Request, res: Response) => {
    const matchState = 'IN_PROGRESS';
    const requiredState = 'PENDING';
    
    if (matchState !== requiredState) {
      throw BusinessLogicError.invalidMatchState(matchState, requiredState);
    }
    
    res.json({ success: true });
  })
};

/**
 * 💾 FileError 사용 예시
 * 파일 관련 에러
 */
export const fileErrorExamples = {
  // 파일 크기 체크
  fileSizeCheck: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const maxSize = '10MB';
    
    if (file && file.size > 10 * 1024 * 1024) {
      throw FileError.fileTooLarge(maxSize);
    }
    
    res.json({ success: true });
  }),

  // 파일 타입 체크
  fileTypeCheck: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (file && !allowedTypes.includes(file.mimetype)) {
      throw FileError.unsupportedFileType(['JPEG', 'PNG', 'GIF']);
    }
    
    res.json({ success: true });
  })
};

/**
 * 🚫 RateLimitError 사용 예시
 * 요청 빈도 제한
 */
export const rateLimitErrorExamples = {
  // 로그인 시도 제한
  loginRateLimit: asyncHandler(async (req: Request, res: Response) => {
    const loginAttempts = 6; // 실제로는 Redis나 DB에서 조회
    
    if (loginAttempts > 5) {
      throw RateLimitError.loginAttempts();
    }
    
    res.json({ success: true });
  }),

  // API 요청 제한
  apiRateLimit: asyncHandler(async (req: Request, res: Response) => {
    const requestCount = 101; // 실제로는 Redis에서 조회
    
    if (requestCount > 100) {
      throw RateLimitError.apiRequests();
    }
    
    res.json({ success: true });
  })
};

/**
 * 🔧 SystemError 사용 예시
 * 시스템 레벨 에러
 */
export const systemErrorExamples = {
  // 데이터베이스 에러
  databaseError: asyncHandler(async (req: Request, res: Response) => {
    try {
      // 데이터베이스 작업...
      throw new Error('Connection timeout');
    } catch (originalError) {
      throw SystemError.database(originalError as Error);
    }
  }),

  // 구성 에러
  configurationError: asyncHandler(async (req: Request, res: Response) => {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw SystemError.configuration('JWT_SECRET');
    }
    
    res.json({ success: true });
  })
};

/**
 * 🏭 ErrorFactory 사용 예시
 * 자주 사용되는 에러들을 쉽게 생성
 */
export const errorFactoryExamples = {
  // 인증 관련
  authExamples: asyncHandler(async (req: Request, res: Response) => {
    // 잘못된 자격 증명
    throw ErrorFactory.invalidCredentials();
    
    // 토큰 만료
    // throw ErrorFactory.tokenExpired();
    
    // 권한 부족
    // throw ErrorFactory.insufficientPermissions();
  }),

  // 리소스 관련
  resourceExamples: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    // 사용자 없음
    throw ErrorFactory.userNotFound(userId);
    
    // 토너먼트 없음
    // throw ErrorFactory.tournamentNotFound(tournamentId);
  }),

  // 비즈니스 로직 관련
  businessExamples: asyncHandler(async (req: Request, res: Response) => {
    // 토너먼트 정원 초과
    throw ErrorFactory.tournamentFull(16);
    
    // 중복 등록
    // throw ErrorFactory.alreadyRegistered();
  })
};

/**
 * 🔄 복합 에러 처리 예시
 * 여러 조건을 체크하는 복잡한 로직
 */
export const complexErrorExample = asyncHandler(async (req: Request, res: Response) => {
  const { tournamentId, playerId } = req.params;
  
  // 1. 토너먼트 존재 확인
  const tournament = null; // 실제로는 DB에서 조회
  if (!tournament) {
    throw NotFoundError.tournament(tournamentId);
  }
  
  // 2. 선수 존재 확인
  const player = null; // 실제로는 DB에서 조회
  if (!player) {
    throw NotFoundError.player(playerId);
  }
  
  // 3. 등록 기간 확인
  if (new Date() > new Date('2023-12-31')) {
    throw BusinessLogicError.tournamentRegistrationClosed();
  }
  
  // 4. 정원 확인
  if (16 >= 16) {
    throw BusinessLogicError.capacityExceeded(16);
  }
  
  // 5. 중복 등록 확인
  const isAlreadyRegistered = true;
  if (isAlreadyRegistered) {
    throw BusinessLogicError.alreadyRegistered('토너먼트');
  }
  
  // 6. 실력 수준 확인
  const playerSkill = 'BEGINNER';
  const requiredSkill = 'ADVANCED';
  if (playerSkill !== requiredSkill) {
    throw BusinessLogicError.skillLevelNotMet(requiredSkill, playerSkill);
  }
  
  res.json({ 
    success: true, 
    message: '토너먼트 등록이 완료되었습니다.' 
  });
});

/**
 * 📊 에러 통계 수집 예시
 * 에러 발생 패턴을 분석하기 위한 로깅
 */
export const errorAnalyticsExample = asyncHandler(async (req: Request, res: Response) => {
  try {
    // 비즈니스 로직...
    res.json({ success: true });
  } catch (error) {
    // 에러 통계 수집
    if (error instanceof AppError) {
      console.log('📊 Error Analytics:', {
        errorType: error.constructor.name,
        errorCode: error.errorCode,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        endpoint: req.path,
        method: req.method,
        userId: (req as any).user?.userId,
        timestamp: new Date().toISOString()
      });
    }
    
    throw error; // 에러를 다시 throw하여 글로벌 핸들러가 처리
  }
});