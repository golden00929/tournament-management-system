import { body, ValidationChain } from 'express-validator';

/**
 * 🔍 인증 관련 유효성 검사 규칙
 * express-validator를 사용한 입력값 검증
 */

/**
 * 이메일 유효성 검사 공통 규칙
 */
const emailValidation = (): ValidationChain => {
  return body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요.')
    .normalizeEmail() // 이메일 정규화 (소문자 변환 등)
    .isLength({ min: 5, max: 254 })
    .withMessage('이메일은 5자 이상 254자 이하여야 합니다.');
};

/**
 * 비밀번호 유효성 검사 공통 규칙
 */
const passwordValidation = (fieldName: string = 'password'): ValidationChain => {
  return body(fieldName)
    .isLength({ min: 8, max: 128 })
    .withMessage(`${fieldName === 'password' ? '비밀번호' : '새 비밀번호'}는 8자 이상 128자 이하여야 합니다.`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(`${fieldName === 'password' ? '비밀번호' : '새 비밀번호'}는 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.`);
};

/**
 * 이름 유효성 검사 공통 규칙
 */
const nameValidation = (): ValidationChain => {
  return body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하여야 합니다.')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('이름은 한글, 영문, 공백만 입력 가능합니다.');
};

/**
 * 관리자 로그인 유효성 검사
 */
export const validateAdminLogin = [
  emailValidation(),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.')
    .isLength({ min: 1, max: 128 })
    .withMessage('비밀번호가 너무 깁니다.'),
];

/**
 * 선수 로그인 유효성 검사
 */
export const validatePlayerLogin = [
  emailValidation(),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.')
    .isLength({ min: 1, max: 128 })
    .withMessage('비밀번호가 너무 깁니다.'),
];

/**
 * 선수 회원가입 유효성 검사
 */
export const validatePlayerRegister = [
  emailValidation(),
  passwordValidation(),
];

/**
 * 관리자 계정 생성 유효성 검사
 */
export const validateAdminCreate = [
  emailValidation(),
  passwordValidation(),
  nameValidation(),
];

/**
 * 비밀번호 변경 유효성 검사
 */
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('현재 비밀번호를 입력해주세요.'),
    
  passwordValidation('newPassword'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('비밀번호 확인을 입력해주세요.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      }
      return value;
    }),
];

/**
 * 비밀번호 재설정 요청 유효성 검사
 */
export const validateForgotPassword = [
  emailValidation(),
];

/**
 * 비밀번호 재설정 실행 유효성 검사
 */
export const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('재설정 토큰이 필요합니다.')
    .isUUID()
    .withMessage('올바른 토큰 형식이 아닙니다.'),
    
  passwordValidation('newPassword'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('비밀번호 확인을 입력해주세요.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      }
      return value;
    }),
];

/**
 * 이메일 인증 유효성 검사
 */
export const validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('인증 토큰이 필요합니다.')
    .isUUID()
    .withMessage('올바른 토큰 형식이 아닙니다.'),
];

/**
 * 리프레시 토큰 유효성 검사
 */
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('리프레시 토큰이 필요합니다.')
    .isJWT()
    .withMessage('올바른 JWT 토큰 형식이 아닙니다.'),
];

/**
 * 선수 프로필 업데이트 유효성 검사
 */
export const validatePlayerProfileUpdate = [
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
    .withMessage('올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)'),
    
  body('skillLevel')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'])
    .withMessage('올바른 실력 수준을 선택해주세요.'),
    
  body('preferredPlayStyle')
    .optional()
    .isLength({ max: 200 })
    .withMessage('선호하는 플레이 스타일은 200자 이하로 입력해주세요.'),
];

/**
 * 관리자 프로필 업데이트 유효성 검사
 */
export const validateAdminProfileUpdate = [
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
];