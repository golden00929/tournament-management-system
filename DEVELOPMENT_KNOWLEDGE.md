# 토너먼트 관리 시스템 개발 지식 베이스

## 📋 목차
1. [프로젝트 구조](#프로젝트-구조)
2. [핵심 기술 스택](#핵심-기술-스택)
3. [주요 컴포넌트](#주요-컴포넌트)
4. [API 엔드포인트](#api-엔드포인트)
5. [개발 패턴](#개발-패턴)
6. [UI/UX 가이드라인](#uiux-가이드라인)
7. [데이터베이스 구조](#데이터베이스-구조)
8. [자주 발생하는 문제와 해결책](#자주-발생하는-문제와-해결책)

## 🏗️ 프로젝트 구조

### Backend (Node.js + Express + Prisma)
```
backend/
├── src/
│   ├── routes/           # API 라우트
│   │   ├── auth.ts       # 인증 관련
│   │   ├── tournament.ts # 토너먼트 관리
│   │   ├── match.ts      # 경기 관리
│   │   ├── player.ts     # 선수 관리
│   │   └── bracket.ts    # 대진표 관리
│   ├── middleware/       # 미들웨어
│   │   ├── auth.ts       # JWT 인증
│   │   └── validation.ts # 데이터 검증
│   ├── services/         # 비즈니스 로직
│   │   ├── bracketService.ts
│   │   ├── eloRatingService.ts
│   │   └── matchService.ts
│   └── config/
│       ├── database.ts   # Prisma 설정
│       └── server.ts     # 서버 설정
```

### Frontend (React + TypeScript + Material-UI)
```
frontend/src/
├── components/           # 재사용 컴포넌트
│   ├── Tournament/       # 토너먼트 관련
│   │   ├── InteractiveMatchBracket.tsx
│   │   ├── TournamentRounds.tsx
│   │   ├── TournamentWizard.tsx
│   │   └── BracketConfiguration.tsx
│   ├── Schedule/         # 일정 관리
│   │   └── MatchScheduleManager.tsx
│   ├── Match/           # 경기 관련
│   │   └── MatchListFixed.tsx
│   └── Layout/          # 레이아웃
│       └── Layout.tsx
├── pages/               # 페이지 컴포넌트
│   ├── Matches/         # 경기 관리
│   ├── Tournaments/     # 토너먼트
│   └── Players/         # 선수 관리
├── store/               # 상태 관리
│   ├── api/             # RTK Query API
│   └── slices/          # Redux 슬라이스
└── hooks/               # 커스텀 훅
```

## 🛠️ 핵심 기술 스택

### Backend
- **Node.js 20+**: 런타임 환경
- **Express 5**: 웹 프레임워크
- **TypeScript**: 타입 안전성
- **Prisma**: ORM 및 데이터베이스 관리
- **PostgreSQL**: 메인 데이터베이스
- **JWT**: 인증 시스템
- **Multer**: 파일 업로드 (CSV 가져오기)
- **csv-parser**: CSV 파싱

### Frontend
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Material-UI v5**: UI 컴포넌트 라이브러리
- **RTK Query**: 서버 상태 관리
- **React Router**: 라우팅
- **i18next**: 다국어 지원

### 개발 도구
- **Vite**: 빌드 도구
- **ESLint**: 코드 품질
- **Prettier**: 코드 포맷팅
- **Git**: 버전 관리

## 🧩 주요 컴포넌트

### 1. InteractiveMatchBracket.tsx
**역할**: 실시간 편집 가능한 토너먼트 대진표
```typescript
interface InteractiveMatchBracketProps {
  matches: Match[];
  onMatchUpdate: (matchId: string, updates: any) => void;
}
```

**주요 기능**:
- 클릭하여 선수명/점수 편집
- 그룹 스테이지와 토너먼트 라운드 표시
- 실시간 업데이트
- 반응형 레이아웃 (CSS Grid 사용)

### 2. MatchScheduleManager.tsx
**역할**: 경기 일정 및 코트 배정 관리
```typescript
interface MatchScheduleManagerProps {
  matches: Match[];
  onMatchUpdate: (matchId: string, updates: any) => void;
}
```

**주요 기능**:
- 대진표에서 자동 경기 가져오기
- 코트 및 시간 배정
- 자동 스케줄링
- 드래그 앤 드롭 (미래 구현 예정)

### 3. TournamentWizard.tsx
**역할**: 단계별 토너먼트 생성 마법사
- 기본 정보 입력
- 참가자 관리
- 대진표 구성
- 일정 설정

## 🌐 API 엔드포인트

### 인증 (Authentication)
```
POST /api/auth/login          # 로그인
POST /api/auth/register       # 회원가입
GET  /api/auth/me             # 현재 사용자 정보
```

### 토너먼트 관리
```
GET    /api/tournaments                    # 토너먼트 목록
POST   /api/tournaments                    # 토너먼트 생성
GET    /api/tournaments/:id                # 토너먼트 상세
PUT    /api/tournaments/:id                # 토너먼트 수정
DELETE /api/tournaments/:id                # 토너먼트 삭제
GET    /api/tournaments/:id/participants   # 참가자 목록
POST   /api/tournaments/:id/participants   # 참가자 추가
```

### 대진표 관리
```
GET  /api/tournaments/:id/bracket     # 대진표 조회
POST /api/tournaments/:id/bracket     # 대진표 생성
PUT  /api/brackets/:id/matches/:matchId  # 경기 결과 업데이트
```

### 경기 관리
```
GET  /api/matches/tournament/:id      # 토너먼트별 경기 목록
PUT  /api/matches/:id                 # 경기 정보 업데이트
POST /api/matches/:id/result          # 경기 결과 입력
```

### 선수 관리
```
GET    /api/players                   # 선수 목록
POST   /api/players                   # 선수 등록
PUT    /api/players/:id               # 선수 정보 수정
DELETE /api/players/:id               # 선수 삭제
POST   /api/players/import/csv        # CSV 가져오기
GET    /api/players/export/csv        # CSV 내보내기
```

## 🎨 개발 패턴

### 1. 컴포넌트 패턴
```typescript
// 함수형 컴포넌트 + TypeScript
interface ComponentProps {
  prop1: string;
  prop2?: number;
  onAction: (data: any) => void;
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2, onAction }) => {
  const [state, setState] = useState<StateType>(initialState);
  
  // 이벤트 핸들러
  const handleAction = (data: any) => {
    // 로직 처리
    onAction(data);
  };

  return (
    <Box>
      {/* JSX 내용 */}
    </Box>
  );
};

export default Component;
```

### 2. RTK Query 패턴
```typescript
// API 슬라이스 정의
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Tournament', 'Match', 'Player'],
  endpoints: (builder) => ({
    getTournaments: builder.query({
      query: (params) => ({
        url: '/tournaments',
        params,
      }),
      providesTags: ['Tournament'],
    }),
    updateMatch: builder.mutation({
      query: ({ matchId, ...patch }) => ({
        url: `/matches/${matchId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Match'],
    }),
  }),
});
```

### 3. Material-UI CSS Grid 패턴 (Grid API 대신)
```typescript
// 기존 Grid API (deprecated)
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    <Card>...</Card>
  </Grid>
</Grid>

// 새로운 CSS Grid 패턴
<Box sx={{
  display: 'grid',
  gap: 3,
  gridTemplateColumns: {
    xs: '1fr',
    md: 'repeat(2, 1fr)'
  }
}}>
  <Card>...</Card>
  <Card>...</Card>
</Box>
```

## 🎨 UI/UX 가이드라인

### 컬러 팔레트
```typescript
// Miiracer 브랜딩 컬러
const colors = {
  primary: '#1976d2',      // 메인 블루
  secondary: '#dc004e',    // Miiracer 레드
  success: '#2e7d32',      // 성공 그린
  warning: '#ed6c02',      // 경고 오렌지
  error: '#d32f2f',        // 에러 레드
};
```

### Typography
```typescript
// 한글 제목용
<Typography variant="h4" sx={{ fontWeight: 'bold' }}>
  경기 관리
</Typography>

// 설명 텍스트
<Typography variant="body2" color="text.secondary">
  대회의 대진표, 참가선수, 경기일정을 통합 관리할 수 있습니다.
</Typography>
```

### 반응형 디자인
```typescript
// 모바일 우선 반응형
sx={{
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',           // 모바일: 1열
    md: '1fr 1fr',       // 태블릿: 2열
    lg: 'repeat(3, 1fr)' // 데스크톱: 3열
  },
  gap: { xs: 2, md: 3 }  // 간격도 반응형
}}
```

### 아이콘 사용 패턴
```typescript
import { 
  EmojiEvents,    // 토너먼트/대회
  Schedule,       // 일정
  People,         // 참가자
  SportsTennis,   // 경기
  AccountTree,    // 대진표
  Notifications,  // 알림
} from '@mui/icons-material';
```

## 💾 데이터베이스 구조

### 주요 테이블
```prisma
// schema.prisma 주요 모델

model Tournament {
  id              String   @id @default(cuid())
  name            String
  format          TournamentFormat  // single_elimination, round_robin, hybrid
  status          TournamentStatus  // draft, open, ongoing, completed
  maxParticipants Int
  startDate       DateTime
  endDate         DateTime
  participants    TournamentParticipant[]
  matches         Match[]
  brackets        Bracket[]
}

model Match {
  id            String      @id @default(cuid())
  matchNumber   Int
  roundName     String
  player1Id     String?
  player2Id     String?
  player1Score  Int?
  player2Score  Int?
  status        MatchStatus // pending, scheduled, ongoing, completed, cancelled
  winnerId      String?
  scheduledTime DateTime?
  court         String?
  tournament    Tournament  @relation(fields: [tournamentId], references: [id])
  tournamentId  String
}

model Player {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  phone        String?
  birthYear    Int?
  gender       Gender   // male, female
  skillLevel   SkillLevel // beginner, intermediate, advanced, expert
  eloRating    Int      @default(1200)
  isActive     Boolean  @default(true)
}
```

## 🐛 자주 발생하는 문제와 해결책

### 1. Material-UI Grid API Deprecation
**문제**: Grid의 `item` prop이 더 이상 지원되지 않음
```typescript
// ❌ 기존 방식 (deprecated)
<Grid item xs={12} md={6}>
  <Card>...</Card>
</Grid>

// ✅ 해결책
<Box sx={{
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: 2
}}>
  <Card>...</Card>
</Box>
```

### 2. RTK Query 캐시 무효화
**문제**: 데이터 변경 후 UI가 자동 업데이트되지 않음
```typescript
// ✅ 해결책: 적절한 태그 사용
export const apiSlice = createApi({
  tagTypes: ['Tournament', 'Match', 'Player'],
  endpoints: (builder) => ({
    updateMatch: builder.mutation({
      // 변경 후 관련된 모든 쿼리 무효화
      invalidatesTags: ['Match', 'Tournament'],
    }),
  }),
});
```

### 3. TypeScript Props 타입 정의
**문제**: Props 타입이 명확하지 않음
```typescript
// ✅ 해결책: 명확한 인터페이스 정의
interface MatchProps {
  matches: Match[];
  selectedTournament?: string;
  onMatchUpdate: (matchId: string, updates: Partial<Match>) => Promise<void>;
  onError?: (error: string) => void;
}
```

### 4. 비동기 작업 에러 처리
```typescript
// ✅ 표준 에러 처리 패턴
const handleUpdate = async (data: UpdateData) => {
  try {
    await updateMatch(data).unwrap();
    // 성공 시 UI 피드백
    setSuccessMessage('업데이트가 완료되었습니다.');
  } catch (err: any) {
    console.error('Update failed:', err);
    // 사용자 친화적 에러 메시지
    const errorMessage = err?.data?.message || '업데이트 중 오류가 발생했습니다.';
    setErrorMessage(errorMessage);
  }
};
```

### 5. 한글 텍스트 처리
```typescript
// 한글 상태 텍스트 매핑
const getStatusText = (status: string) => {
  const statusMap = {
    'pending': '대기',
    'scheduled': '예정',
    'ongoing': '진행 중',
    'completed': '완료',
    'cancelled': '취소'
  };
  return statusMap[status] || status;
};
```

## 🚀 다음 개발 계획

### Phase 2: 고급 기능
1. **실시간 업데이트**: WebSocket을 통한 실시간 점수/상태 동기화
2. **고급 스케줄링**: 드래그 앤 드롭 일정 조정
3. **통계 대시보드**: 선수 성과, 토너먼트 분석
4. **모바일 앱**: React Native를 통한 모바일 버전

### Phase 3: 확장 기능
1. **다중 스포츠 지원**: 탁구, 테니스 등 다양한 스포츠
2. **라이브 스트리밍**: 경기 중계 연동
3. **소셜 기능**: 팀 채팅, 선수 프로필
4. **결제 시스템**: 참가비 자동 결제

## 📝 개발 시 주의사항

1. **일관된 코딩 스타일**: ESLint/Prettier 설정 준수
2. **타입 안전성**: any 타입 사용 최소화
3. **에러 처리**: 모든 비동기 작업에 try-catch 적용
4. **접근성**: ARIA 레이블, 키보드 네비게이션 고려
5. **성능**: 불필요한 리렌더링 방지 (React.memo, useCallback 활용)
6. **보안**: 민감한 데이터 로그 출력 금지
7. **다국어**: 하드코딩된 텍스트 대신 i18next 키 사용

이 문서는 프로젝트의 지속적인 발전과 새로운 개발자의 온보딩을 위한 핵심 지식을 담고 있습니다.