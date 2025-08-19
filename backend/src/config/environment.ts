import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

/**
 * 환경변수 관리 중앙화
 * 모든 환경변수를 이 파일에서 관리하여 보안성과 유지보수성을 향상시킵니다.
 */

// 환경변수 타입 정의
interface EnvironmentConfig {
  // 서버 설정
  NODE_ENV: string;
  PORT: number;
  
  // 데이터베이스 설정
  DATABASE_URL: string;
  
  // JWT 보안 설정
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // 관리자 계정 설정
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  
  // 외부 서비스 설정
  OPENAI_API_KEY?: string;
  
  // 클라이언트 URL 설정 (CORS용)
  CLIENT_URL: string;
  
  // 보안 설정
  BCRYPT_SALT_ROUNDS: number;
  SESSION_SECRET: string;
  
  // 이메일 서비스 설정 (선택사항)
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  
  // 파일 업로드 설정
  MAX_FILE_SIZE: string;
  UPLOAD_DIR: string;
}

/**
 * 환경변수 검증 함수
 * 필수 환경변수가 설정되어 있는지 확인합니다.
 */
function validateEnvironment(): EnvironmentConfig {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD'
  ];

  // 필수 환경변수 검증
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`필수 환경변수 ${envVar}가 설정되지 않았습니다.`);
    }
  }

  // JWT SECRET 강도 검증
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET이 32자 미만입니다. 보안을 위해 더 긴 키를 사용하세요.');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    console.warn('⚠️  JWT_REFRESH_SECRET이 32자 미만입니다. 보안을 위해 더 긴 키를 사용하세요.');
  }

  return {
    // 서버 설정
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    
    // 데이터베이스 설정
    DATABASE_URL: process.env.DATABASE_URL!,
    
    // JWT 보안 설정 (개발환경: 24시간, 프로덕션: 1시간 액세스 토큰, 7일 리프레시 토큰)
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || (process.env.NODE_ENV === 'development' ? '24h' : '1h'),
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // 관리자 계정 설정
    ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,
    
    // 외부 서비스 설정
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    
    // 클라이언트 URL 설정
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    
    // 보안 설정 (saltRounds를 10으로 조정)
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    SESSION_SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET!,
    
    // 이메일 서비스 설정
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    
    // 파일 업로드 설정
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10MB',
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads'
  };
}

// 환경변수 설정 및 내보내기
export const env = validateEnvironment();

/**
 * 개발 모드 확인
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * 프로덕션 모드 확인
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * 테스트 모드 확인
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * 데이터베이스 URL 파싱 (SQLite vs PostgreSQL 등)
 */
export const getDatabaseConfig = () => {
  const dbUrl = env.DATABASE_URL;
  
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return {
      type: 'postgresql',
      url: dbUrl
    };
  } else if (dbUrl.includes('.db') || dbUrl.includes('.sqlite')) {
    return {
      type: 'sqlite',
      url: dbUrl
    };
  } else {
    return {
      type: 'unknown',
      url: dbUrl
    };
  }
};

// 환경변수 로딩 성공 로그
console.log(`🔧 환경변수 로드 완료: ${env.NODE_ENV} 모드`);
console.log(`📊 데이터베이스: ${getDatabaseConfig().type}`);
console.log(`🚀 서버 포트: ${env.PORT}`);