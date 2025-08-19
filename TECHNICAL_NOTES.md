# 기술적 문제 해결 노트

## 1. React 19 호환성 문제

### 문제
- react-i18next와 React 19 간의 peer dependency 충돌
- 빌드 과정에서 의존성 해결 실패

### 해결 방법
```bash
# .npmrc 파일 생성
echo "legacy-peer-deps=true" > frontend/.npmrc
echo "fund=false" >> frontend/.npmrc
echo "audit-level=moderate" >> frontend/.npmrc

# 설치 명령어 수정
npm install --legacy-peer-deps
```

### 원인 분석
- React 19가 최신 버전이라 일부 라이브러리가 아직 완전히 호환되지 않음
- peer dependency 검사가 엄격해져서 발생하는 문제

## 2. TypeScript 인터페이스 문제

### 문제
```
Property 'body' does not exist on type 'AuthRequest'
Property 'params' does not exist on type 'AuthRequest'
Property 'query' does not exist on type 'AuthRequest'
```

### 해결 방법
```typescript
// 수정 전
export interface AuthRequest extends Request {
  user?: JwtPayload & {
    id: string;
    name: string;
    isActive: boolean;
  };
}

// 수정 후
export interface AuthRequest extends Request {
  user?: JwtPayload & {
    id: string;
    name: string;
    isActive: boolean;
  };
  body: any;
  params: any;
  query: any;
}
```

### 원인 분석
- Express Request 타입과의 호환성 문제
- TypeScript 컴파일러가 프로퍼티 접근을 허용하지 않음

## 3. Railway 배포 문제

### 문제
- Docker 환경에서 Node.js 실행 실패
- 헬스체크 엔드포인트 부재로 인한 배포 실패

### 해결 방법
```typescript
// 서버 바인딩 수정
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

// 헬스체크 엔드포인트 추가
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});
```

### Railway 설정
```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 4. DATABASE_URL 연결 문제

### 문제
- "invalid port number in database URL" 오류
- Prisma 클라이언트 초기화 실패

### 해결 방법
1. Railway 대시보드에서 올바른 PostgreSQL 연결 문자열 확인
2. 환경변수 DATABASE_URL 업데이트
3. 형식: `postgresql://username:password@hostname:5432/database_name`

### 디버깅 명령어
```bash
# 데이터베이스 상태 확인
curl https://tournament-management-system-production.up.railway.app/api/setup/status

# 데이터베이스 초기화
curl -X POST https://tournament-management-system-production.up.railway.app/api/setup/initialize
```

## 5. CORS 설정

### 프로덕션 설정
```typescript
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.CORS_ORIGIN || 'https://magnificent-entremet-27d825.netlify.app']
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
```

## 6. Prisma 마이그레이션

### SQLite → PostgreSQL 전환
```javascript
// schema.prisma 수정
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // sqlite에서 변경
  url      = env("DATABASE_URL")
}
```

### 배포 시 실행 순서
1. `npx prisma generate` - 클라이언트 생성
2. `npx prisma migrate deploy` - 마이그레이션 실행
3. `npx prisma db seed` - 시드 데이터 생성

## 7. 환경변수 관리

### Railway 필수 환경변수
```
DATABASE_URL=postgresql://username:password@hostname:5432/database
NODE_ENV=production
CORS_ORIGIN=https://magnificent-entremet-27d825.netlify.app
JWT_SECRET=your-secret-key
```

### Netlify 환경변수
```
REACT_APP_API_URL=https://tournament-management-system-production.up.railway.app/api
```

## 8. 빌드 최적화

### Netlify 빌드 설정
```toml
[build]
  command = "npm install --legacy-peer-deps && CI=false npm run build"
  publish = "build"
```

### CI=false 이유
- ESLint 경고를 오류로 처리하지 않도록 설정
- 배포 과정에서 빌드 실패 방지