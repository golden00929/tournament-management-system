# 빠른 참조 가이드

## 🔗 배포된 서비스 링크

### 프론트엔드 (Netlify)
```
URL: https://magnificent-entremet-27d825.netlify.app
관리자 로그인: https://magnificent-entremet-27d825.netlify.app/login
```

### 백엔드 (Railway)
```
URL: https://tournament-management-system-production.up.railway.app
헬스체크: https://tournament-management-system-production.up.railway.app/health
API 베이스: https://tournament-management-system-production.up.railway.app/api
```

## 🔑 관리자 계정
```
이메일: admin@tournament.com
비밀번호: admin123
```

## 🛠 개발 명령어

### 로컬 개발 시작
```bash
# 백엔드 시작
cd backend && npm run dev

# 프론트엔드 시작
cd frontend && npm start
```

### 데이터베이스 관리
```bash
# 마이그레이션 실행
npx prisma migrate dev

# 시드 데이터 생성
npx prisma db seed

# 데이터베이스 스튜디오
npx prisma studio
```

### 빌드 및 배포
```bash
# 프론트엔드 빌드
cd frontend && npm run build

# 백엔드 빌드
cd backend && npm run build
```

## 🔧 문제 해결

### React 19 호환성 문제
```bash
npm install --legacy-peer-deps
```

### 데이터베이스 연결 문제
```bash
# 데이터베이스 상태 확인
curl https://tournament-management-system-production.up.railway.app/api/setup/status

# 데이터베이스 초기화
curl -X POST https://tournament-management-system-production.up.railway.app/api/setup/initialize
```

### 로그인 문제
1. DATABASE_URL 환경변수 확인
2. 데이터베이스 초기화 API 호출
3. 관리자 계정 생성 확인

## 📁 중요 파일 위치

### 설정 파일
```
netlify.toml                    # Netlify 배포 설정
railway.json                    # Railway 배포 설정
frontend/.npmrc                 # npm 설정
backend/prisma/schema.prisma    # 데이터베이스 스키마
```

### 환경변수 파일
```
backend/.env                    # 로컬 환경변수
frontend/.env                   # 프론트엔드 환경변수
```

### 주요 소스 파일
```
backend/src/server.ts           # 서버 메인 파일
backend/src/routes/auth.ts      # 인증 라우터
backend/src/routes/setup.ts     # 시스템 설정 라우터
frontend/src/store/api/apiSlice.ts  # API 설정
```

## 🔄 배포 플로우

### 자동 배포
1. GitHub에 코드 푸시
2. Netlify 자동 빌드 및 배포
3. Railway 자동 빌드 및 배포

### 수동 배포
```bash
# Git 푸시
git add .
git commit -m "업데이트 메시지"
git push origin main
```

## 🚨 응급 상황 대응

### 프론트엔드 배포 실패
1. Netlify 로그 확인
2. 의존성 문제 시 `--legacy-peer-deps` 사용
3. 빌드 명령어에 `CI=false` 추가

### 백엔드 배포 실패
1. Railway 로그 확인
2. 환경변수 설정 확인
3. 헬스체크 엔드포인트 확인

### 데이터베이스 문제
1. Railway PostgreSQL 상태 확인
2. DATABASE_URL 연결 문자열 확인
3. 시드 데이터 재생성

## 📊 모니터링

### 상태 확인 URL
```
프론트엔드: https://magnificent-entremet-27d825.netlify.app
백엔드: https://tournament-management-system-production.up.railway.app/health
데이터베이스: https://tournament-management-system-production.up.railway.app/api/setup/status
```

### 로그 확인
- Netlify: Dashboard > Deploys > Deploy logs
- Railway: Dashboard > Deployments > View logs

## 🔐 보안 체크리스트

- [x] JWT 토큰 인증 구현
- [x] CORS 정책 설정
- [x] Rate Limiting 적용
- [x] 환경변수로 민감 정보 관리
- [x] Helmet 보안 헤더 적용
- [x] HTTPS 강제 사용

## 📈 성능 최적화

- [x] API 응답 캐싱
- [x] 코드 스플리팅
- [x] 이미지 최적화
- [x] 압축 미들웨어
- [x] 데이터베이스 인덱싱