# Claude AI 학습 가이드 - Tournament Management System

## 🎯 프로젝트 컨텍스트

### 핵심 정보
- **프로젝트**: 베트남 시장용 동호인 대회 관리 시스템 (배드민턴/피클볼/테니스)
- **기술 스택**: React 18 + TypeScript + MUI v7 + RTK Query / Node.js + Express + Prisma + SQLite
- **현지화**: 베트남어 UI, VND 통화, dd/MM/yyyy 날짜 형식
- **인증**: JWT 기반, 관리자/선수 역할 구분

### 디렉토리 구조
```
/home/jay/tournament-management-system/
├── backend/                 # Node.js + Express + Prisma
│   ├── src/routes/         # API 엔드포인트
│   ├── src/services/       # 비즈니스 로직
│   └── src/middleware/     # 인증, 캐싱 등
└── frontend/               # React + TypeScript
    ├── src/pages/          # 페이지 컴포넌트
    ├── src/components/     # 재사용 컴포넌트
    └── src/store/api/      # RTK Query API
```

## 📋 작업 패턴 인식

### 1. 문제 해결 접근법
```
사용자 요청 → 문제 분석 → 기술적 해결책 → 구현 → 테스트 → 사용자 경험 개선
```

### 2. 코드 작성 원칙
- **TypeScript 우선**: 타입 안전성 확보
- **기존 코드 활용**: 새로 만들기보다 기존 API/컴포넌트 재사용
- **사용자 중심**: 최소 클릭, 즉시 피드백, 명확한 안내
- **권한 기반**: 관리자/일반 사용자 구분

### 3. 파일 수정 패턴
- **Backend**: routes → services → middleware 순서
- **Frontend**: pages → components → store/api 순서
- **항상 Read 먼저**: 기존 코드 구조 파악 후 수정

## 🔧 이번 세션 완성 작업 (2025-08-16)

### A. 중복 이름 참가자 관리 시스템

#### 문제 정의
```
32명 참가자 중 "Lưu Thị Hà" 같은 이름이 2명 → 대진표에서 30명으로 인식 → 브라켓 생성 오류
```

#### 해결 전략
1. **감지**: 실시간 중복 이름 탐지 알고리즘
2. **표시**: 시각적 경고 및 통계 제공  
3. **해결**: 인라인 편집으로 즉시 수정
4. **피드백**: 수정 완료 즉시 반영

#### 핵심 구현 코드
```typescript
// 1. 중복 감지 (Type-safe)
const findDuplicateNames = (): Set<string> => {
  const nameCount: { [key: string]: number } = {};
  const duplicates = new Set<string>();
  
  participants.forEach((participant: any) => {
    const name = participant.player?.name;
    if (name) {
      nameCount[name] = (nameCount[name] || 0) + 1;
      if (nameCount[name] > 1) {
        duplicates.add(name);
      }
    }
  });
  
  return duplicates;
};

// 2. 인라인 편집 상태 관리
const [editingName, setEditingName] = useState<{playerId: string; currentName: string} | null>(null);
const [newName, setNewName] = useState('');

// 3. API 연동 (기존 updatePlayer 재사용)
const handleSaveEditName = async () => {
  if (!editingName || !newName.trim()) return;
  
  try {
    await updatePlayer({
      id: editingName.playerId,
      name: newName.trim()
    }).unwrap();
    
    setEditingName(null);
    setNewName('');
    refetchParticipants(); // 즉시 새로고침
  } catch (err: any) {
    alert(`이름 수정 실패: ${err?.data?.message || err.message}`);
  }
};

// 4. 조건부 UI (편집 모드 토글)
{editingName?.playerId === participant.player?.id ? (
  // 편집 모드: TextField + 저장/취소 버튼
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <TextField 
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter') handleSaveEditName();
        if (e.key === 'Escape') handleCancelEditName();
      }}
      autoFocus
    />
    <Button onClick={handleSaveEditName}>저장</Button>
    <Button onClick={handleCancelEditName}>취소</Button>
  </Box>
) : (
  // 표시 모드: 이름 + 중복 경고 + 편집 버튼
  <>
    <Typography>{participant.player?.name}</Typography>
    {isDuplicateName(participant.player?.name) && (
      <>
        <Chip icon={<Warning />} label="중복 이름" color="warning" />
        <IconButton onClick={() => handleStartEditName(participant.player?.id, participant.player?.name)}>
          <Edit />
        </IconButton>
      </>
    )}
  </>
)}
```

#### 수정된 파일
- `frontend/src/pages/Matches/Matches.tsx:398-495` - 메인 로직
- `backend/src/routes/player.ts:293-366` - 기존 API 활용

### B. 대진표 생성 후 참가자 추가 권한 관리

#### 문제 정의
```
대진표 생성 후 → 모든 사용자 참가 신청 불가 → 관리자도 추가 등록 못함
```

#### 해결 전략
```typescript
// 권한 기반 조건 분기
const isAdmin = req.user?.role === 'admin';
const hasBrackets = existingBrackets.length > 0;

if (!isAdmin && hasBrackets) {
  return res.status(400).json({
    success: false,
    message: '대진표가 이미 생성되어 참가 신청이 마감되었습니다.',
    error: 'REGISTRATION_CLOSED_BRACKETS_EXIST'
  });
}
// 관리자는 계속 진행 가능
```

#### 수정된 파일
- `backend/src/routes/participant.ts:188-196` - 권한 체크 로직

## 🔍 현재 해결 중인 이슈

### 대진표 재생성 400 오류

#### 증상
```
프론트엔드: POST http://localhost:5000/api/brackets/generate 400 (Bad Request)
백엔드: API 요청이 도달하지 않음 (로그 없음)
```

#### 추가한 디버깅 도구
```typescript
// 1. 모든 POST 요청 로깅 (server.ts:69-76)
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`🚀 POST 요청: ${req.originalUrl}`);
    console.log(`🚀 Body:`, req.body);
  }
  next();
});

// 2. Bracket API 상세 로깅 (bracket.ts:68-72)
console.log('💥💥💥 BRACKET GENERATE API 시작 💥💥💥');
console.log('Request Method:', req.method);
console.log('Request URL:', req.originalUrl);
console.log('Request Headers:', req.headers);
console.log('req.body 전체:', JSON.stringify(req.body, null, 2));
```

#### 다음 디버깅 단계
1. **로그 확인**: "재생성" 클릭 시 백엔드 콘솔에 `🚀 POST 요청` 나타나는지
2. **네트워크 탭**: 브라우저 개발자 도구에서 실제 요청 상태 확인
3. **API 구조**: 프론트엔드 generateBracket 호출과 백엔드 기대값 매칭

## 📚 핵심 학습 패턴

### 1. RTK Query 사용 패턴
```typescript
// 뮤테이션 정의
const [updatePlayer, { isLoading: isUpdatingPlayer }] = useUpdatePlayerMutation();

// 호출 및 에러 처리
try {
  await updatePlayer({ id, name }).unwrap();
  refetchParticipants(); // 수동 새로고침
} catch (err: any) {
  alert(`오류: ${err?.data?.message || err.message}`);
}
```

### 2. TypeScript 타입 안전성
```typescript
// 명시적 타입 선언으로 컴파일 오류 해결
const nameCount: { [key: string]: number } = {}; // ✅ 올바름
const nameCount = {}; // ❌ 컴파일 오류 발생
```

### 3. 조건부 렌더링 패턴
```typescript
// 상태 기반 UI 전환
{isEditMode ? <EditComponent /> : <DisplayComponent />}

// 권한 기반 기능 제한
{isAdmin && <AdminOnlyButton />}

// 데이터 기반 경고 표시
{hasProblems && <WarningMessage />}
```

### 4. 백엔드 권한 체크 패턴
```typescript
// 1. 사용자 역할 확인
const isAdmin = req.user?.role === 'admin';

// 2. 비즈니스 조건 확인
const hasSpecialCondition = await checkCondition();

// 3. 권한 + 조건 조합
if (!isAdmin && hasSpecialCondition) {
  return res.status(400).json({ error: 'ACCESS_DENIED' });
}
```

## 🎯 문제 해결 접근법

### 단계 1: 문제 이해
- 사용자가 **정확히 무엇을** 요청하는가?
- **현재 상황**에서 어떤 제약이 있는가?
- **기대 결과**는 무엇인가?

### 단계 2: 기존 코드 분석
- **Read 도구**로 관련 파일들 구조 파악
- 기존 **API/컴포넌트** 재사용 가능 여부 확인
- **데이터 흐름** 추적 (프론트엔드 → API → 데이터베이스)

### 단계 3: 최소 침습적 해결
- 새로운 파일 생성보다 **기존 코드 확장** 우선
- **TypeScript 타입 안전성** 유지
- **사용자 경험** 중심 설계

### 단계 4: 단계적 구현
- **핵심 기능** 먼저 구현
- **에러 처리** 및 **사용자 피드백** 추가
- **타입 안전성** 및 **성능 최적화**

## 🔄 세션 간 연속성 유지

### 다음 AI가 알아야 할 핵심 정보
1. **프로젝트 상태**: 백엔드(포트 5000), 프론트엔드(포트 3000) 실행 중
2. **완료된 기능**: 중복 이름 관리, 권한 기반 참가자 추가
3. **진행 중인 이슈**: 대진표 재생성 400 오류 (디버깅 도구 추가됨)
4. **인증 정보**: admin@tournament.com/admin123 (관리자)

### 즉시 실행 가능한 디버깅
```bash
# 1. 프로젝트 실행 확인
cd /home/jay/tournament-management-system/backend && npm run dev &
cd /home/jay/tournament-management-system/frontend && npm start &

# 2. 문제 재현
# 브라우저: localhost:3000 → 경기관리 → 대회선택 → 재생성 클릭

# 3. 로그 확인
# 백엔드 콘솔에서 🚀 POST 요청 로그 확인
```

이 가이드를 통해 다음 AI는 프로젝트 컨텍스트를 빠르게 이해하고, 현재 진행 중인 작업을 즉시 이어갈 수 있습니다.