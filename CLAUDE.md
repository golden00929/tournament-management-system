# Tournament Management System - Claude Learning Guide

## 프로젝트 개요
베트남 시장을 위한 동호인 대회 관리 시스템 (배드민턴/피클볼/테니스)
- **Frontend**: React 18 + TypeScript + MUI v7 + RTK Query
- **Backend**: Node.js + Express + Prisma + SQLite
- **Authentication**: JWT 기반
- **Language**: 한국어 UI, 베트남 현지화 (VND 통화, dd/MM/yyyy 날짜 형식)

## 현재 완성된 주요 기능

### 1. 사용자 인증 & 관리자 시스템
- JWT 기반 로그인/로그아웃
- 관리자 권한 기반 접근 제어
- 토큰 자동 갱신 및 만료 처리

### 2. 선수 관리 시스템
- **CRUD 기능**: 선수 등록/수정/삭제/조회
- **ELO 레이팅 시스템**: 자동 계산 및 관리자 수동 조정 기능
- **실력 등급**: Group A/B/C/D (a_class/b_class/c_class/d_class)
- **상세 정보**: 생년월일, 성별, 지역, 비상연락처 등
- **베트남 현지화**: 날짜 형식 dd/MM/yyyy

### 3. 대회 관리 시스템
- **CRUD 기능**: 대회 생성/수정/삭제/조회
- **대회 상태 관리**: 작성중 → 모집중 → 모집마감 → 진행중 → 완료
- **대회 형식**: 단일토너먼트/더블토너먼트/리그전
- **날짜 관리**: 당일 대회 지원 (시작/종료 날짜 동일 가능)
- **현지화**: VND 통화, 천단위 구분자

### 4. 참가자 관리 시스템 ⭐ 최신 완성 기능
- **참가자 등록**: 선수를 대회에 등록
- **승인 시스템**: 관리자가 참가자 승인/거부/제거
- **실시간 현황**: 승인된 참가자 수 모니터링
- **대진표 생성 조건**: 최소 4명 승인 필요

### 5. 대진표 생성 및 관리
- **자동 대진표 생성**: ELO 기반 균형 배치
- **시각화**: 토너먼트 브래킷 표시
- **경기 결과 입력**: 승패 및 점수 기록
- **실시간 업데이트**: 경기 결과 반영

## 프로젝트 구조

### Frontend Structure
```
/frontend/src/
├── components/
│   ├── DatePicker/CustomDatePicker.tsx    # 베트남 날짜 형식 지원
│   └── Tournament/BracketVisualization.tsx # 대진표 시각화
├── pages/
│   ├── Auth/Login.tsx                     # 로그인 페이지
│   ├── Players/                           # 선수 관리
│   │   ├── PlayerList.tsx                 # 선수 목록 + ELO 조정
│   │   ├── PlayerForm.tsx                 # 선수 등록/수정
│   │   └── PlayerDetail.tsx               # 선수 상세 정보
│   ├── Tournaments/                       # 대회 관리
│   │   ├── TournamentList.tsx            # 대회 목록 + 상태 변경
│   │   ├── TournamentForm.tsx            # 대회 생성/수정
│   │   ├── TournamentDetail.tsx          # 대회 상세
│   │   └── TournamentBracket.tsx         # 대진표 관리
│   └── Matches/                          # 경기 관리 ⭐ 최신
│       └── Matches.tsx                   # 통합 경기 관리 (대진표+참가자)
├── store/
│   └── api/apiSlice.ts                   # RTK Query API 정의
└── utils/
    └── dateUtils.ts                      # 베트남 현지화 유틸
```

### Backend Structure
```
/backend/src/
├── routes/
│   ├── auth.ts           # 인증 라우트
│   ├── player.ts         # 선수 관리 API
│   ├── tournament.ts     # 대회 관리 API
│   ├── participant.ts    # 참가자 관리 API ⭐ 최신
│   ├── bracket.ts        # 대진표 API
│   └── match.ts          # 경기 API
├── services/
│   ├── eloRatingService.ts        # ELO 계산 로직
│   └── bracketGenerationService.ts # 대진표 생성
├── middleware/
│   └── auth.ts           # JWT 인증 미들웨어
└── prisma/
    └── schema.prisma     # 데이터베이스 스키마
```

## 데이터베이스 스키마 주요 테이블

### Players 테이블
- ELO 레이팅 시스템 (초기값: 1200)
- 실력 수준: a_class, b_class, c_class, d_class
- 베트남 현지화: birthDate (정확한 생년월일)

### Tournaments 테이블
- 상태: draft, open, closed, ongoing, completed
- 형식: single_elimination, double_elimination, round_robin
- 당일 대회 지원 (같은 시작/종료 날짜)

### Participants 테이블 ⭐ 최신
- 승인 상태: pending, approved, rejected
- 결제 상태: pending, completed, failed, refunded
- 등록 시점 ELO 스냅샷

## API 엔드포인트 구조

### 참가자 관리 API ⭐ 최신 완성
```typescript
GET    /api/participants/tournament/:tournamentId  # 대회 참가자 목록
POST   /api/participants                           # 참가자 등록
PATCH  /api/participants/:id/approval              # 승인 상태 변경
DELETE /api/participants/:id                       # 참가자 제거
```

### RTK Query 훅 사용법
```typescript
// 참가자 데이터 조회
const { data: participantsData } = useGetTournamentParticipantsQuery(tournamentId);
const participants = participantsData?.data?.participants || [];

// 참가자 상태 변경
const [updateParticipantStatus] = useUpdateParticipantStatusMutation();
await updateParticipantStatus({ participantId, status: 'approved' });
```

## 베트남 현지화 구현

### 날짜 형식: dd/MM/yyyy
```typescript
// utils/dateUtils.ts
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('vi-VN');
};

// CustomDatePicker 컴포넌트 사용
<CustomDatePicker
  label="날짜"
  value={formData.date}
  onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
  required
  helperText="날짜 형식 (dd/MM/yyyy)"
/>
```

### 통화 형식: VND
```typescript
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};
```

## 실력 등급 시스템

### 프론트엔드 표시
- Group A (Expert) - a_class
- Group B (Advanced) - b_class  
- Group C (Intermediate) - c_class
- Group D (Beginner) - d_class

### ELO 레이팅 구간
```typescript
// services/eloRatingService.ts
static getSkillLevel(rating: number): string {
  if (rating >= 2500) return 'a_class';      // Group A
  if (rating >= 2000) return 'b_class';      // Group B
  if (rating >= 1500) return 'c_class';      // Group C
  return 'd_class';                           // Group D
}
```

## 대진표 생성 조건 및 로직

### 생성 조건
1. 대회 상태가 'draft'가 아님
2. 최소 4명의 승인된 참가자 필요
3. 관리자 권한 필요

### 조건 검증 로직
```typescript
const approvedParticipants = participantsData?.data?.participants?.filter(
  (p: any) => p.approvalStatus === 'approved'
) || [];
const hasEnoughParticipants = approvedParticipants.length >= 4;
```

## 컴포넌트 아키텍처 패턴

### 탭 기반 UI
```typescript
// Matches.tsx - 경기관리 통합 페이지
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="경기 목록" icon={<ViewList />} />
  <Tab label="경기 일정" icon={<Schedule />} />
  <Tab label="참가자 관리" icon={<People />} />  // ⭐ 최신 추가
</Tabs>
```

### 상태 관리 패턴
- RTK Query로 서버 상태 관리
- useState로 로컬 UI 상태 관리
- 실시간 데이터 업데이트 (invalidatesTags 사용)

## 현재 진행 상황 (2025-08-17)

### ✅ 완료된 작업 (최신 업데이트)
1. **Phase 1**: 백엔드 MVP 완성 (ELO 시스템, 대진표 생성 등)
2. **Phase 2**: 프론트엔드 개발 완성
   - 베트남 현지화 (날짜/통화 형식)
   - 선수/대회/경기 관리 UI
   - 참가자 관리 시스템
   - 대진표 생성 및 시각화
   - ELO 레이팅 관리자 조정 기능
3. **Phase 3**: 선수 인증 시스템 완성 (2025-08-14)
   - 선수 회원가입/로그인 시스템
   - 이메일 인증 및 비밀번호 재설정
   - 선수용 프로필 및 대회 참가 API
   - 공개 API (인증 불필요한 대회 조회)
   - 역할 기반 접근 제어 (admin/player)
4. **Phase 4**: 배포 및 시스템 안정화 ⭐ 최신 완료 (2025-08-17)
   - TypeScript 컴파일 오류 수정 (deleteTournament API 인터페이스)
   - Netlify 배포 설정 (netlify.toml, 환경 변수 구성)
   - 선수 페이지 경기 일정 연동 문제 해결
   - 테스트 데이터 생성 및 API 연동 검증
   - GitHub 준비 완료 (배포 가이드 포함)

### 🔧 최근 해결된 주요 이슈 (2025-08-17)
1. **대회 삭제 시스템 개선**
   - 스마트 삭제 (soft delete vs force delete)
   - 외래키 제약 조건 처리
   - 관련 데이터 분석 및 안전한 삭제

2. **선수 페이지 데이터 연동 문제 해결**
   - 테스트 선수 참가 신청 자동 생성
   - 대회 상태 업데이트 (closed → ongoing)
   - 실제 경기 데이터 생성 및 API 연동 확인
   - 선수 로그인 테스트 도구 제공 (test_player_login.html)

3. **배포 준비 완료**
   - API URL 환경 변수 처리
   - Netlify 설정 파일 생성
   - 빌드 최적화 설정
   - 배포 가이드 문서화

### 📋 다음 작업 우선순위
1. **GitHub 저장소 업로드**: 코드 푸시 및 Netlify 연결
2. **베타 테스트**: 실제 사용자 테스트 및 피드백 수집
3. **선수용 UI 추가 개발**: 회원가입/로그인 페이지
4. **경기 결과 입력 시스템**: 실시간 점수 업데이트

## 개발 환경 설정

### 서버 실행
```bash
# Backend (포트 5000)
cd backend
npm run dev

# Frontend (포트 3000) 
cd frontend
npm start

# 데이터베이스 관리 (포트 5555)
npx prisma studio
```

### 주요 개발 도구
- **ESLint**: TypeScript/React 규칙
- **Prisma Studio**: 데이터베이스 GUI
- **MUI v7**: 최신 Material-UI 컴포넌트
- **RTK Query**: 효율적인 API 상태 관리

## 문제 해결 가이드

### 자주 발생하는 이슈
1. **날짜 형식 문제**: HTML input vs CustomDatePicker 사용 구분
2. **ELO 레이팅 호환성**: 구/신 실력 등급 시스템 변환
3. **API 응답 구조**: `data.participants` vs `data` 구조 확인
4. **MUI 컴포넌트 import**: 필요한 컴포넌트 모두 import 확인

### 디버깅 팁
- Browser DevTools Network 탭에서 API 응답 확인
- Redux DevTools로 상태 변화 모니터링
- Console에서 데이터 구조 확인: `console.log('Data:', data)`

## 선수 페이지 연동 문제 해결 과정 (2025-08-17)

### 🐛 문제 증상
- 선수 페이지에서 "내 경기 일정" 접근 시 "경기 일정이 없다"고 표시
- 선수 대시보드에서 대진표 보기 시 "생성된게 없다"고 표시
- 관리자 모드에서 생성된 대회와 연동이 안됨

### 🔍 진단 과정
1. **데이터베이스 상태 확인**
   ```bash
   # 테스트 선수 존재 확인
   SELECT * FROM Player WHERE email = 'testplayer@example.com';
   ✅ 선수 존재: Test Player (ID: a8638b09-be1d-46a6-a037-3dceea7f3ab0)
   
   # 대회 존재 확인  
   SELECT * FROM Tournament;
   ✅ 대회 존재: 2025 miiracer open bedminton (상태: closed)
   
   # 참가 신청 확인
   SELECT * FROM Participant WHERE playerId = 'a8638b09...';
   ❌ 참가 신청 0개 - 문제 발견!
   ```

2. **API 엔드포인트 테스트**
   ```bash
   # 선수 로그인 테스트
   curl -X POST /api/player-auth/login
   ✅ 로그인 성공, 토큰 반환
   
   # 경기 일정 API 테스트  
   curl -X GET /api/player-api/matches -H "Authorization: Bearer ..."
   ✅ API 정상 작동, 하지만 데이터 0개
   ```

### 💡 해결 방법
1. **테스트 선수 참가 신청 생성**
   ```javascript
   await prisma.participant.create({
     data: {
       playerId: testPlayer.id,
       tournamentId: tournament.id,
       eventType: 'singles',
       approvalStatus: 'approved',  // 승인된 상태로
       paymentStatus: 'completed',  // 결제 완료 상태로
       registrationElo: testPlayer.eloRating
     }
   });
   ```

2. **대회 상태 업데이트**
   ```javascript
   await prisma.tournament.update({
     where: { id: tournament.id },
     data: { status: 'ongoing' }  // closed → ongoing
   });
   ```

3. **테스트 경기 데이터 생성**
   ```javascript
   await prisma.match.create({
     data: {
       tournamentId: tournament.id,
       player1Id: testPlayer.id,
       player2Id: opponent.id,
       player1Name: testPlayer.name,
       player2Name: opponent.name,
       status: 'scheduled',
       scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
     }
   });
   ```

4. **선수 로그인 테스트 도구 제공**
   - `test_player_login.html` 파일 생성
   - 자동으로 localStorage에 토큰 저장
   - React 앱과 연동하여 즉시 테스트 가능

### ✅ 검증 결과
```json
// GET /api/player-api/matches 응답
{
  "success": true,
  "data": [{
    "id": "b3da541d-f0bf-4124-b35f-1af51d30d34a",
    "roundName": "테스트 라운드",
    "player1Name": "Test Player",
    "player2Name": "김철수",
    "status": "scheduled",
    "tournament": {
      "name": "2025 miiracer open bedminton",
      "location": "200 tran nao q2"
    }
  }]
}
```

### 📝 학습 포인트
- **데이터 연동**: 선수 인증 시스템은 정상이었지만, 실제 참가 데이터가 없었음
- **시스템 연결**: 관리자와 선수 시스템이 분리되어 있어 연동 테스트 필요
- **상태 관리**: 대회 상태가 경기 표시에 영향을 미침
- **디버깅 순서**: API → 데이터베이스 → 연동 상태 순으로 체계적 확인

## 선수 인증 시스템 상세 (2025-08-14 완성)

### 🔐 인증 시스템 아키텍처
```
선수 인증 흐름:
1. 관리자가 선수 기본 정보 등록 (비밀번호 없음)
2. 선수가 이메일로 계정 활성화 (비밀번호 설정)
3. 이메일 인증 완료 후 로그인 가능
4. JWT 토큰 기반 세션 관리
5. 역할별 API 접근 제어 (admin/player)
```

### 📁 새로 추가된 파일들
```
/backend/src/routes/
├── playerAuth.ts        # 선수 인증 API (회원가입/로그인/인증)
├── playerApi.ts         # 선수용 인증된 API (프로필/참가내역)  
├── playerTournament.ts  # 선수용 대회 참가 API
└── public.ts           # 공개 API (인증 불필요)

/backend/prisma/schema.prisma
└── Player 모델에 인증 필드 추가:
    - password, isVerified, verifyToken 등
```

### 🛠️ API 엔드포인트 가이드

#### 선수 인증 API (/api/player-auth/)
```typescript
POST /register      # 선수 회원가입 (비밀번호 설정)
POST /login         # 선수 로그인
POST /forgot-password  # 비밀번호 재설정 요청
POST /reset-password   # 비밀번호 재설정 실행
PUT  /verify-email     # 이메일 인증
```

#### 공개 API (/api/public/) - 인증 불필요
```typescript
GET /tournaments           # 공개 대회 목록
GET /tournament/:id        # 대회 상세 정보
GET /tournament/:id/bracket # 대회 대진표
GET /rankings             # 선수 랭킹 (상위 100명)
```

#### 선수 전용 API (/api/player-api/) - 선수 인증 필요
```typescript
GET /profile              # 내 프로필 조회
PUT /profile              # 프로필 수정
GET /participations       # 내 참가 신청 목록
GET /matches             # 내 경기 일정
GET /rating-history      # 내 레이팅 히스토리
```

#### 선수 대회 참가 API (/api/player-tournaments/) - 선수 인증 필요  
```typescript
GET  /available           # 참가 가능한 대회 목록
POST /:tournamentId/apply # 대회 참가 신청
GET  /applications        # 내 참가 신청 내역
DELETE /application/:id   # 참가 신청 취소
```

### 🧪 테스트 계정 정보
```
테스트 선수 계정:
- 이메일: testplayer@example.com
- 비밀번호: testpass123
- 상태: 인증 완료
- ELO: 1200 (초급자)

관리자 계정:
- 이메일: admin@tournament.com  
- 비밀번호: admin123 (느낌표 없음!)
```

### 🔧 토큰 기반 인증 사용법
```bash
# 1. 로그인하여 토큰 획득
curl -X POST http://localhost:5000/api/player-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testplayer@example.com","password":"testpass123"}'

# 2. 토큰으로 API 호출
curl -X GET http://localhost:5000/api/player-api/profile \
  -H "Authorization: Bearer [토큰]"
```

## 다음 세션 시작 가이드

1. **프로젝트 상태 확인**
   ```bash
   cd /home/jay/tournament-management-system/backend
   npm run dev    # 백엔드 서버 시작 (포트 5000)
   
   cd ../frontend  
   npm start      # 프론트엔드 서버 시작 (포트 3000)
   ```

2. **현재 기능 테스트**
   - **관리자**: admin@tournament.com / admin123
   - **선수**: testplayer@example.com / testpass123  
   - 경기관리 → 참가자 관리 탭에서 기존 기능 확인
   - 새로운 선수 인증 API들이 모두 작동함

3. **다음 작업 우선순위**
   - **프론트엔드 선수 인증 UI 개발** (로그인/회원가입 페이지)
   - 경기 결과 입력 및 실시간 업데이트 시스템
   - 실제 데이터와 연동 테스트

4. **중요한 변경사항**
   - 선수 인증 시스템 완전 구현됨 (백엔드)
   - TypeScript 컴파일 오류 모두 수정됨
   - 새로운 API 라우트들이 서버에 등록됨
   - JWT 토큰에 name 필드 추가됨

이 가이드를 통해 다음 세션에서 빠르게 프로젝트를 이해하고 작업을 이어갈 수 있습니다.

다음진행할 명령어

## 작업 2: 선수용 Frontend 구현

1. 라우터 설정 수정
   - /player/* 경로 추가
   - role 기반 라우팅

2. 선수 회원가입/로그인 페이지
   - 베트남 전화번호 형식 (10자리)
   - 생년월일 선택
   - 지역 선택 (호치민시/구)

3. 선수 대시보드
   - 내 정보 표시
   - 참가 중인 대회
   - 예정된 경기
   - ELO 레이팅 표시

4. 대회 참가 플로우
   - 대회 목록 (필터: 진행중/예정)
   - 상세 정보 보기
   - 참가 신청 버튼
   - 결제 정보 입력


   2. 선수용 API 추가 필요
typescript// /backend/src/routes/playerAuth.ts (새 파일)
POST /api/auth/player/signup     // 회원가입
POST /api/auth/player/login      // 로그인
GET  /api/public/tournaments      // 공개 대회 목록
POST /api/player/apply/:tournamentId // 대회 신청
GET  /api/player/my-tournaments   // 내 대회 목록
GET  /api/player/my-matches       // 내 경기 일정
3. 선수용 Frontend 페이지 생성
/frontend/src/pages/Player/ (새 폴더)
├── PlayerSignup.tsx       // 회원가입
├── PlayerLogin.tsx        // 로그인  
├── PlayerDashboard.tsx    // 메인 화면
├── TournamentSearch.tsx   // 대회 검색
├── TournamentApply.tsx    // 참가 신청
├── MyStatus.tsx          // 나의 상태
├── MyBracket.tsx         // 대진표 확인
└── MySchedule.tsx        // 경기 시간

/frontend/src/components/Player/ (새 폴더)
├── TournamentCard.tsx    // 대회 카드
├── MatchSchedule.tsx     // 경기 일정
└── ResultDisplay.tsx     // 결과 표시


이런 구도로 진행해야함