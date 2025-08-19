import { body, query, param, ValidationChain } from 'express-validator';

/**
 * 👥 선수 관리 관련 유효성 검사 규칙
 * 선수 등록, 수정, 검색 등에 대한 입력값 검증
 */

/**
 * 선수 생성 유효성 검사 (관리자용)
 */
export const validatePlayerCreate = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하여야 합니다.')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글, 영문, 공백만 입력 가능합니다.'),

  body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요.')
    .normalizeEmail()
    .isLength({ min: 5, max: 254 })
    .withMessage('이메일은 5자 이상 254자 이하여야 합니다.'),

  body('phoneNumber')
    .optional()
    .matches(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/)
    .withMessage('올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)'),

  body('skillLevel')
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'])
    .withMessage('올바른 실력 수준을 선택해주세요.'),

  body('eloRating')
    .optional()
    .isInt({ min: 100, max: 3000 })
    .withMessage('ELO 레이팅은 100 이상 3000 이하여야 합니다.'),

  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('올바른 생년월일을 입력해주세요.')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 10 || age > 100) {
        throw new Error('나이는 10세 이상 100세 이하여야 합니다.');
      }
      return value;
    }),

  body('preferredPlayStyle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('선호하는 플레이 스타일은 200자 이하로 입력해주세요.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('선수 메모는 500자 이하로 입력해주세요.'),
];

/**
 * 선수 정보 수정 유효성 검사
 */
export const validatePlayerUpdate = [
  param('id')
    .isUUID()
    .withMessage('올바른 선수 ID를 입력해주세요.'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하여야 합니다.')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글, 영문, 공백만 입력 가능합니다.'),

  body('phoneNumber')
    .optional()
    .matches(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/)
    .withMessage('올바른 휴대폰 번호 형식을 입력해주세요.'),

  body('skillLevel')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'])
    .withMessage('올바른 실력 수준을 선택해주세요.'),

  body('eloRating')
    .optional()
    .isInt({ min: 100, max: 3000 })
    .withMessage('ELO 레이팅은 100 이상 3000 이하여야 합니다.'),

  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('올바른 생년월일을 입력해주세요.'),

  body('preferredPlayStyle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('선호하는 플레이 스타일은 200자 이하로 입력해주세요.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('선수 메모는 500자 이하로 입력해주세요.'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('활성 상태는 true 또는 false여야 합니다.'),
];

/**
 * 선수 검색 유효성 검사
 */
export const validatePlayerSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지 번호는 1 이상이어야 합니다.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('페이지 크기는 1 이상 100 이하여야 합니다.'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('검색어는 1자 이상 100자 이하여야 합니다.'),

  query('skillLevel')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'])
    .withMessage('올바른 실력 수준을 선택해주세요.'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('활성 상태는 true 또는 false여야 합니다.'),

  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'eloRating', 'createdAt', 'lastLoginAt'])
    .withMessage('올바른 정렬 기준을 선택해주세요.'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('정렬 순서는 asc 또는 desc여야 합니다.'),

  query('minEloRating')
    .optional()
    .isInt({ min: 100, max: 3000 })
    .withMessage('최소 ELO 레이팅은 100 이상 3000 이하여야 합니다.'),

  query('maxEloRating')
    .optional()
    .isInt({ min: 100, max: 3000 })
    .withMessage('최대 ELO 레이팅은 100 이상 3000 이하여야 합니다.')
    .custom((value, { req }) => {
      if (req.query.minEloRating && parseInt(value) < parseInt(req.query.minEloRating as string)) {
        throw new Error('최대 ELO 레이팅은 최소 ELO 레이팅보다 커야 합니다.');
      }
      return value;
    }),
];

/**
 * 선수 통계 조회 유효성 검사
 */
export const validatePlayerStats = [
  param('id')
    .isUUID()
    .withMessage('올바른 선수 ID를 입력해주세요.'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('올바른 시작일을 입력해주세요.'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('올바른 종료일을 입력해주세요.')
    .custom((value, { req }) => {
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('종료일은 시작일 이후여야 합니다.');
        }
      }
      return value;
    }),
];

/**
 * 선수 대결 기록 조회 유효성 검사
 */
export const validatePlayerMatchHistory = [
  param('id')
    .isUUID()
    .withMessage('올바른 선수 ID를 입력해주세요.'),

  query('opponentId')
    .optional()
    .isUUID()
    .withMessage('올바른 상대 선수 ID를 입력해주세요.'),

  query('tournamentId')
    .optional()
    .isUUID()
    .withMessage('올바른 토너먼트 ID를 입력해주세요.'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지 번호는 1 이상이어야 합니다.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('페이지 크기는 1 이상 50 이하여야 합니다.'),
];

/**
 * ELO 레이팅 수동 조정 유효성 검사 (관리자용)
 */
export const validateEloRatingAdjustment = [
  param('id')
    .isUUID()
    .withMessage('올바른 선수 ID를 입력해주세요.'),

  body('newRating')
    .isInt({ min: 100, max: 3000 })
    .withMessage('새로운 ELO 레이팅은 100 이상 3000 이하여야 합니다.'),

  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('조정 사유는 5자 이상 200자 이하로 입력해주세요.'),

  body('adjustmentType')
    .isIn(['MANUAL_CORRECTION', 'PENALTY', 'BONUS', 'RESET'])
    .withMessage('올바른 조정 유형을 선택해주세요.'),
];

/**
 * 선수 계정 활성화/비활성화 유효성 검사
 */
export const validatePlayerActivation = [
  param('id')
    .isUUID()
    .withMessage('올바른 선수 ID를 입력해주세요.'),

  body('isActive')
    .isBoolean()
    .withMessage('활성 상태는 true 또는 false여야 합니다.'),

  body('reason')
    .if(body('isActive').equals(false))
    .notEmpty()
    .withMessage('비활성화 시 사유를 입력해주세요.')
    .isLength({ max: 200 })
    .withMessage('사유는 200자 이하여야 합니다.'),
];

/**
 * 선수 배치 정보 유효성 검사
 */
export const validatePlayerRanking = [
  query('skillLevel')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'])
    .withMessage('올바른 실력 수준을 선택해주세요.'),

  query('region')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('지역은 2자 이상 50자 이하여야 합니다.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('조회할 선수 수는 1명 이상 100명 이하여야 합니다.'),
];

/**
 * 선수 ID 파라미터 유효성 검사
 */
export const validatePlayerIdParam = [
  param('id')
    .isUUID()
    .withMessage('올바른 선수 ID를 입력해주세요.'),
];

/**
 * 선수 일괄 등록 유효성 검사 (CSV 업로드용)
 */
export const validatePlayerBulkCreate = [
  body('players')
    .isArray({ min: 1, max: 100 })
    .withMessage('선수 목록은 1명 이상 100명 이하여야 합니다.'),

  body('players.*.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하여야 합니다.'),

  body('players.*.email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요.'),

  body('players.*.skillLevel')
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'])
    .withMessage('올바른 실력 수준을 선택해주세요.'),

  body('overwriteExisting')
    .optional()
    .isBoolean()
    .withMessage('기존 데이터 덮어쓰기 여부는 true 또는 false여야 합니다.'),
];