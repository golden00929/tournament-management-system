import { body, query, param, ValidationChain } from 'express-validator';

/**
 * 🏆 토너먼트 관련 유효성 검사 규칙
 * 토너먼트 생성, 수정, 참가 등에 대한 입력값 검증
 */

/**
 * 토너먼트 생성 유효성 검사
 */
export const validateTournamentCreate = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('토너먼트 이름은 2자 이상 100자 이하여야 합니다.')
    .matches(/^[가-힣a-zA-Z0-9\s\-_()]+$/)
    .withMessage('토너먼트 이름에는 한글, 영문, 숫자, 공백, 하이픈, 언더스코어, 괄호만 사용 가능합니다.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('토너먼트 설명은 1000자 이하여야 합니다.'),

  body('type')
    .isIn(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS_SYSTEM'])
    .withMessage('올바른 토너먼트 타입을 선택해주세요.'),

  body('maxParticipants')
    .isInt({ min: 4, max: 256 })
    .withMessage('최대 참가자 수는 4명 이상 256명 이하여야 합니다.'),

  body('registrationStartDate')
    .isISO8601()
    .withMessage('올바른 등록 시작일을 입력해주세요.')
    .custom((value) => {
      const now = new Date();
      const startDate = new Date(value);
      if (startDate < now) {
        throw new Error('등록 시작일은 현재 시간 이후여야 합니다.');
      }
      return value;
    }),

  body('registrationEndDate')
    .isISO8601()
    .withMessage('올바른 등록 마감일을 입력해주세요.')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.registrationStartDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('등록 마감일은 등록 시작일 이후여야 합니다.');
      }
      return value;
    }),

  body('tournamentStartDate')
    .isISO8601()
    .withMessage('올바른 토너먼트 시작일을 입력해주세요.')
    .custom((value, { req }) => {
      const registrationEndDate = new Date(req.body.registrationEndDate);
      const tournamentStartDate = new Date(value);
      if (tournamentStartDate <= registrationEndDate) {
        throw new Error('토너먼트 시작일은 등록 마감일 이후여야 합니다.');
      }
      return value;
    }),

  body('venue')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('경기장은 2자 이상 200자 이하여야 합니다.'),

  body('entryFee')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('참가비는 0원 이상 100만원 이하여야 합니다.'),

  body('prizePool')
    .optional()
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('상금은 0원 이상 1000만원 이하여야 합니다.'),

  body('skillLevelRestriction')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL', 'ALL'])
    .withMessage('올바른 실력 제한을 선택해주세요.'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('공개 여부는 true 또는 false여야 합니다.'),
];

/**
 * 토너먼트 수정 유효성 검사
 */
export const validateTournamentUpdate = [
  param('id')
    .isUUID()
    .withMessage('올바른 토너먼트 ID를 입력해주세요.'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('토너먼트 이름은 2자 이상 100자 이하여야 합니다.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('토너먼트 설명은 1000자 이하여야 합니다.'),

  body('venue')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('경기장은 2자 이상 200자 이하여야 합니다.'),

  body('entryFee')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('참가비는 0원 이상 100만원 이하여야 합니다.'),

  body('prizePool')
    .optional()
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('상금은 0원 이상 1000만원 이하여야 합니다.'),
];

/**
 * 토너먼트 참가 신청 유효성 검사
 */
export const validateTournamentRegistration = [
  param('tournamentId')
    .isUUID()
    .withMessage('올바른 토너먼트 ID를 입력해주세요.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('참가 신청 메모는 500자 이하여야 합니다.'),
];

/**
 * 토너먼트 참가자 승인/거절 유효성 검사
 */
export const validateRegistrationApproval = [
  param('tournamentId')
    .isUUID()
    .withMessage('올바른 토너먼트 ID를 입력해주세요.'),

  param('playerId')
    .isUUID()
    .withMessage('올바른 선수 ID를 입력해주세요.'),

  body('approved')
    .isBoolean()
    .withMessage('승인 여부는 true 또는 false여야 합니다.'),

  body('rejectionReason')
    .if(body('approved').equals(false))
    .notEmpty()
    .withMessage('거절 시 사유를 입력해주세요.')
    .isLength({ max: 500 })
    .withMessage('거절 사유는 500자 이하여야 합니다.'),
];

/**
 * 경기 결과 입력 유효성 검사
 */
export const validateMatchResult = [
  param('matchId')
    .isUUID()
    .withMessage('올바른 경기 ID를 입력해주세요.'),

  body('winnerId')
    .isUUID()
    .withMessage('올바른 승자 ID를 입력해주세요.'),

  body('player1Score')
    .isInt({ min: 0, max: 100 })
    .withMessage('선수1 점수는 0점 이상 100점 이하여야 합니다.'),

  body('player2Score')
    .isInt({ min: 0, max: 100 })
    .withMessage('선수2 점수는 0점 이상 100점 이하여야 합니다.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('경기 메모는 1000자 이하여야 합니다.'),
];

/**
 * 토너먼트 검색 유효성 검사
 */
export const validateTournamentSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지 번호는 1 이상이어야 합니다.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('페이지 크기는 1 이상 100 이하여야 합니다.'),

  query('status')
    .optional()
    .isIn(['UPCOMING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('올바른 토너먼트 상태를 선택해주세요.'),

  query('type')
    .optional()
    .isIn(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS_SYSTEM'])
    .withMessage('올바른 토너먼트 타입을 선택해주세요.'),

  query('skillLevel')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL', 'ALL'])
    .withMessage('올바른 실력 수준을 선택해주세요.'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('검색어는 1자 이상 100자 이하여야 합니다.'),
];

/**
 * 브래킷 생성 유효성 검사
 */
export const validateBracketGeneration = [
  param('tournamentId')
    .isUUID()
    .withMessage('올바른 토너먼트 ID를 입력해주세요.'),

  body('seedingMethod')
    .optional()
    .isIn(['RANDOM', 'ELO_RATING', 'MANUAL'])
    .withMessage('올바른 시드 배치 방법을 선택해주세요.'),

  body('enableEloUpdate')
    .optional()
    .isBoolean()
    .withMessage('ELO 레이팅 업데이트 여부는 true 또는 false여야 합니다.'),
];

/**
 * 토너먼트 시간표 설정 유효성 검사
 */
export const validateTournamentSchedule = [
  param('tournamentId')
    .isUUID()
    .withMessage('올바른 토너먼트 ID를 입력해주세요.'),

  body('rounds')
    .isArray({ min: 1 })
    .withMessage('라운드 정보를 입력해주세요.'),

  body('rounds.*.roundNumber')
    .isInt({ min: 1 })
    .withMessage('라운드 번호는 1 이상이어야 합니다.'),

  body('rounds.*.startTime')
    .isISO8601()
    .withMessage('올바른 시작 시간을 입력해주세요.'),

  body('rounds.*.estimatedDuration')
    .isInt({ min: 15, max: 480 })
    .withMessage('예상 소요 시간은 15분 이상 8시간 이하여야 합니다.'),
];

/**
 * 토너먼트 ID 파라미터 유효성 검사
 */
export const validateTournamentId = [
  param('id')
    .isUUID()
    .withMessage('올바른 토너먼트 ID를 입력해주세요.'),
];

/**
 * 선수 ID 파라미터 유효성 검사
 */
export const validatePlayerId = [
  param('playerId')
    .isUUID()
    .withMessage('올바른 선수 ID를 입력해주세요.'),
];

/**
 * 경기 ID 파라미터 유효성 검사
 */
export const validateMatchId = [
  param('matchId')
    .isUUID()
    .withMessage('올바른 경기 ID를 입력해주세요.'),
];