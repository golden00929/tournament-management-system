# 베트남 대회 관리 시스템 아키텍처

## 전체 시스템 구조

```
Frontend (React 19)          Backend (Node.js/Express)         Database (PostgreSQL)
├── Netlify 배포             ├── Railway 배포                  ├── Railway 호스팅
├── SPA 라우팅               ├── RESTful API                   ├── Prisma ORM
├── Redux Toolkit            ├── JWT 인증                      ├── 관계형 데이터베이스
├── Material-UI              ├── WebSocket 지원                └── 실시간 동기화
└── 다국어 지원 (i18next)     └── TypeScript                    
```

## 배포 환경

### 프론트엔드 (Netlify)
- **URL**: https://magnificent-entremet-27d825.netlify.app
- **빌드**: React 19 + TypeScript
- **라우팅**: React Router (SPA)
- **상태관리**: Redux Toolkit
- **UI**: Material-UI v6
- **배포**: 자동 GitHub 연동

### 백엔드 (Railway)
- **URL**: https://tournament-management-system-production.up.railway.app
- **런타임**: Node.js + Express
- **언어**: TypeScript
- **ORM**: Prisma
- **인증**: JWT
- **WebSocket**: Socket.io

### 데이터베이스 (Railway PostgreSQL)
- **타입**: PostgreSQL 16
- **ORM**: Prisma
- **마이그레이션**: 자동화
- **시드 데이터**: 관리자 계정 자동 생성

## API 엔드포인트 구조

### 인증 관련
- `POST /api/auth/login` - 관리자 로그인
- `POST /api/auth/register` - 관리자 등록
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/profile` - 프로필 조회

### 선수 관련
- `GET /api/players` - 선수 목록
- `POST /api/players` - 선수 등록
- `PUT /api/players/:id` - 선수 정보 수정
- `DELETE /api/players/:id` - 선수 삭제

### 대회 관련
- `GET /api/tournaments` - 대회 목록
- `POST /api/tournaments` - 대회 생성
- `GET /api/tournaments/:id` - 대회 상세 정보
- `PUT /api/tournaments/:id` - 대회 정보 수정

### 대진표 관련
- `GET /api/brackets/:tournamentId` - 대진표 조회
- `POST /api/brackets/:tournamentId/generate` - 대진표 생성
- `PUT /api/brackets/:id` - 대진표 수정

### 경기 관련
- `GET /api/matches` - 경기 목록
- `POST /api/matches` - 경기 생성
- `PUT /api/matches/:id` - 경기 결과 입력

### 시스템 관련
- `GET /health` - 헬스체크
- `GET /api/setup/status` - 데이터베이스 상태
- `POST /api/setup/initialize` - 시스템 초기화

## 데이터베이스 스키마

### 주요 테이블
1. **Admin** - 관리자 계정
2. **Player** - 선수 정보
3. **Tournament** - 대회 정보
4. **Participant** - 대회 참가자
5. **Match** - 경기 정보
6. **Bracket** - 대진표
7. **Team** - 팀 정보
8. **SystemConfig** - 시스템 설정

### 관계 구조
```
Tournament (1) ←→ (N) Participant ←→ (1) Player
Tournament (1) ←→ (N) Bracket
Bracket (1) ←→ (N) Match
Player (N) ←→ (N) Team (N) ←→ (N) Tournament
```

## 보안 설정

### JWT 인증
- 토큰 기반 인증 시스템
- 관리자와 선수 권한 분리
- 토큰 만료 시간 관리

### CORS 정책
```typescript
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://magnificent-entremet-27d825.netlify.app']
  : ['http://localhost:3000', 'http://localhost:3001'];
```

### 보안 헤더
- Helmet 미들웨어 적용
- Rate Limiting (15분에 100개 요청)
- XSS 보호
- CSRF 보호

## 실시간 기능

### WebSocket 연결
- Socket.io 기반
- 실시간 경기 결과 업데이트
- 대회 상태 변경 알림
- 선수 등록 알림

### 이벤트 종류
- `tournament:update` - 대회 정보 변경
- `match:result` - 경기 결과 입력
- `bracket:update` - 대진표 업데이트
- `player:registered` - 선수 등록

## 캐싱 전략

### 메모리 캐싱
- 대회 데이터 캐싱 (5분)
- 선수 데이터 캐싱 (3분)
- 일정 데이터 캐싱 (1분)

### 캐시 무효화
- 데이터 변경 시 자동 캐시 클리어
- WebSocket을 통한 실시간 업데이트

## 모니터링 및 로깅

### 헬스체크
- `/health` - 기본 상태 확인
- `/api/health` - API 상태 확인
- 데이터베이스 연결 상태 모니터링

### 로깅
- 모든 POST 요청 로깅
- 대진표 API 상세 로깅
- 오류 상황 상세 로깅

## 성능 최적화

### 프론트엔드
- 코드 스플리팅
- 레이지 로딩
- 메모이제이션

### 백엔드
- 데이터베이스 쿼리 최적화
- API 응답 압축
- 연결 풀링

## 확장성 고려사항

### 수평 확장
- Stateless 서버 설계
- 데이터베이스 분리 가능
- 마이크로서비스 전환 가능

### 부하 분산
- Railway 자동 스케일링
- 캐싱을 통한 부하 감소
- CDN 활용 (Netlify)