# Claude 학습 컨텍스트 - 베트남 대회 관리 시스템

## 프로젝트 개요
베트남어를 지원하는 완전한 대회 관리 시스템으로, 선수 등록부터 브라켓 생성, 경기 결과 관리까지 모든 기능을 포함합니다.

## 현재 배포 상태 (2025-01-17)

### ✅ 완료된 배포
- **프론트엔드**: https://magnificent-entremet-27d825.netlify.app (Netlify)
- **백엔드**: https://tournament-management-system-production.up.railway.app (Railway)
- **데이터베이스**: PostgreSQL (Railway 호스팅)
- **관리자 계정**: admin@tournament.com / admin123

### 🎯 시스템 핵심 기능
1. **관리자 시스템**: 대회 생성, 선수 관리, 브라켓 생성
2. **선수 시스템**: 개별 로그인, 대회 참가 신청, 개인 통계
3. **브라켓 시스템**: 단일/더블 엘리미네이션, Swiss 시스템
4. **실시간 시스템**: WebSocket 기반 실시간 업데이트
5. **다국어 지원**: 한국어, 베트남어, 영어

## 주요 해결된 기술적 문제

### 1. React 19 호환성 문제
**문제**: react-i18next와 React 19 peer dependency 충돌
**해결**: `.npmrc` 파일 생성 + `--legacy-peer-deps` 플래그 사용

### 2. TypeScript 인터페이스 문제  
**문제**: AuthRequest 인터페이스에서 body, params, query 프로퍼티 접근 불가
**해결**: 인터페이스에 명시적 프로퍼티 선언 추가

### 3. Railway 배포 문제
**문제**: Docker 환경 감지 및 헬스체크 실패
**해결**: 
- HOST='0.0.0.0' 바인딩
- 다중 헬스체크 엔드포인트 추가 (/, /health, /api/health)
- railway.json 설정 최적화

### 4. 데이터베이스 마이그레이션
**문제**: SQLite → PostgreSQL 전환 필요
**해결**: 
- Prisma 스키마 수정 (provider = "postgresql")
- 연결 문자열 형식 변경
- 시드 스크립트 PostgreSQL 호환

## 파일 구조 및 핵심 설정

### 배포 설정 파일
```
netlify.toml          # Netlify SPA 배포 설정
railway.json          # Railway Node.js 배포 설정  
frontend/.npmrc       # npm 의존성 해결 설정
backend/setup-db.sh   # 데이터베이스 초기화 스크립트
```

### 환경변수 구성
**Railway 백엔드**:
- DATABASE_URL: PostgreSQL 연결 문자열
- NODE_ENV: production
- CORS_ORIGIN: Netlify 프론트엔드 URL
- JWT_SECRET: JWT 토큰 시크릿

**Netlify 프론트엔드**:
- REACT_APP_API_URL: Railway 백엔드 API URL

### 핵심 API 엔드포인트
```
POST /api/auth/login          # 관리자 로그인
GET  /api/setup/status        # 데이터베이스 상태 확인
POST /api/setup/initialize    # 시스템 초기화
GET  /health                  # 헬스체크
```

## 중요한 코드 수정 내역

### 1. AuthRequest 인터페이스 (backend/src/middleware/auth.ts)
```typescript
export interface AuthRequest extends Request {
  user?: JwtPayload & {
    id: string;
    name: string;
    isActive: boolean;
  };
  body: any;      // 추가됨
  params: any;    // 추가됨  
  query: any;     // 추가됨
}
```

### 2. 서버 설정 (backend/src/server.ts)
```typescript
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';  // Railway 호환성

// 다중 헬스체크 엔드포인트
app.get('/', (req, res) => { /* 기본 상태 */ });
app.get('/health', (req, res) => { /* 상세 상태 */ });
app.get('/api/health', (req, res) => { /* API 상태 */ });

server.listen(PORT, HOST, () => { /* HOST 바인딩 */ });
```

### 3. API 기본 URL (frontend/src/store/api/apiSlice.ts)
```typescript
baseUrl: process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://tournament-management-system-production.up.railway.app/api' 
    : 'http://localhost:5000/api')
```

## 배포 프로세스

### 자동 배포 플로우
1. GitHub에 코드 푸시
2. Netlify: 자동 빌드 및 프론트엔드 배포
3. Railway: 자동 빌드 및 백엔드 배포
4. 데이터베이스 마이그레이션 자동 실행

### 수동 초기화 (필요시)
```bash
# 데이터베이스 상태 확인
curl https://tournament-management-system-production.up.railway.app/api/setup/status

# 관리자 계정 생성
curl -X POST https://tournament-management-system-production.up.railway.app/api/setup/initialize
```

## 다음 작업을 위한 컨텍스트

### 현재 작업 상태
- ✅ 전체 시스템 배포 완료
- ✅ 관리자 로그인 기능 정상 작동
- ✅ 데이터베이스 연결 및 초기화 완료
- ✅ API 통신 정상

### 향후 작업 방향
1. **기능 테스트**: 선수 등록, 대회 생성, 브라켓 시스템 검증
2. **성능 최적화**: 캐싱 전략 개선, 쿼리 최적화
3. **모니터링**: 로깅 시스템 강화, 에러 추적
4. **사용자 경험**: UI/UX 개선, 반응형 디자인 최적화

### 주의사항
- React 19 사용으로 일부 라이브러리 호환성 주의
- Railway 무료 플랜 제한 고려 (슬립 모드)
- PostgreSQL 연결 문자열 형식 엄격함
- CORS 설정이 프로덕션/개발 환경별로 다름

## 문제 발생 시 디버깅 순서

1. **프론트엔드 문제**: Netlify 배포 로그 확인
2. **백엔드 문제**: Railway 배포 로그 및 헬스체크 확인
3. **데이터베이스 문제**: setup/status API로 연결 상태 확인
4. **인증 문제**: JWT 토큰 및 환경변수 확인
5. **CORS 문제**: 브라우저 네트워크 탭에서 요청 헤더 확인

이 시스템은 현재 완전히 배포되어 있으며, 모든 핵심 기능이 작동 중입니다.