# 🔍 디버깅 체크리스트 - 대진표 재생성 400 오류

## 📝 현재 상황
- 프론트엔드에서 "재생성" 버튼 클릭 시 400 Bad Request 오류
- 에러 메시지: `POST http://localhost:5000/api/brackets/generate 400 (Bad Request)`
- 백엔드 로그에 API 요청이 나타나지 않음 (확인 필요)

## 🔧 추가된 디버깅 도구

### 1. 백엔드 POST 요청 로깅
```typescript
// server.ts:69-76
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`🚀 POST 요청: ${req.originalUrl}`);
    console.log(`🚀 Body:`, req.body);
  }
  next();
});
```

### 2. Bracket API 상세 로깅
```typescript
// bracket.ts:68-72
console.log('💥💥💥 BRACKET GENERATE API 시작 💥💥💥');
console.log('Request Method:', req.method);
console.log('Request URL:', req.originalUrl);
console.log('Request Headers:', req.headers);
console.log('req.body 전체:', JSON.stringify(req.body, null, 2));
```

## ✅ 다음 세션에서 확인할 사항

### 1. 백엔드 로그 확인
- [ ] 프론트엔드에서 "재생성" 클릭
- [ ] 백엔드 콘솔에 `🚀 POST 요청: /api/brackets/generate` 로그 확인
- [ ] `💥💥💥 BRACKET GENERATE API 시작` 로그 확인

### 2. API 요청 데이터 검증
**예상 요청 구조:**
```json
{
  "tournamentId": "ca1d9ea3-6f3e-491a-962e-828bd48ee037"
}
```

### 3. 프론트엔드 API 호출 확인
**TournamentBracket.tsx:77**
```typescript
const result = await generateBracket(id!).unwrap();
```

**API Slice 정의:**
```typescript
generateBracket: builder.mutation<any, string | object>({
  query: (data) => ({
    url: `/brackets/generate`,
    method: 'POST',
    body: typeof data === 'string' ? { tournamentId: data } : data,
  }),
})
```

### 4. 가능한 원인들

#### A. 요청이 백엔드에 도달하지 않는 경우
- [ ] CORS 문제 확인
- [ ] 네트워크 연결 문제
- [ ] 프론트엔드 API 호출 오류

#### B. 요청이 백엔드에 도달하는 경우
- [ ] tournamentId 유효성 검증
- [ ] 참가자 데이터 부족
- [ ] 대회 상태 문제
- [ ] 권한 문제

### 5. 단계별 디버깅 순서

1. **백엔드 로그 확인**
   ```bash
   # 터미널에서 백엔드 로그 모니터링
   cd /home/jay/tournament-management-system/backend
   npm run dev
   ```

2. **프론트엔드에서 재생성 클릭**
   - 브라우저 개발자 도구 네트워크 탭 열기
   - "재생성" 버튼 클릭
   - 네트워크 요청 상태 확인

3. **로그 분석**
   - POST 요청이 백엔드에 도달했는지 확인
   - 요청 body 내용 확인
   - 오류 발생 지점 특정

## 🛠️ 빠른 해결 방법들

### 방법 1: Tournament ID 확인
```typescript
// TournamentBracket.tsx에 로그 추가
console.log('Tournament ID:', id);
console.log('Generating bracket for:', id);
```

### 방법 2: API 요청 직접 테스트
```bash
# curl로 직접 API 테스트
curl -X POST http://localhost:5000/api/brackets/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [토큰]" \
  -d '{"tournamentId":"ca1d9ea3-6f3e-491a-962e-828bd48ee037"}'
```

### 방법 3: 프론트엔드 오류 핸들링 강화
```typescript
const handleGenerateBracket = async () => {
  try {
    console.log('대진표 생성 시작... ID:', id);
    console.log('generateBracket 함수 호출 중...');
    
    const result = await generateBracket(id!).unwrap();
    console.log('대진표 생성 성공:', result);
  } catch (err: any) {
    console.error('상세 오류 정보:', {
      status: err.status,
      data: err.data,
      message: err.message,
      originalStatus: err.originalStatus
    });
  }
};
```

## 📋 테스트 시나리오

### 시나리오 1: 정상 케이스
1. 관리자로 로그인
2. 하이브리드 대회 선택
3. 32명 승인된 참가자 확인
4. "재생성" 버튼 클릭
5. 성공 메시지 확인

### 시나리오 2: 오류 케이스
1. 같은 조건에서 "재생성" 클릭
2. 400 오류 발생
3. 백엔드 로그에서 원인 파악
4. 오류 수정

## 🔑 중요한 파일들

### Backend
- `src/routes/bracket.ts:66-100` - 대진표 생성 API
- `src/server.ts:69-76` - POST 요청 로깅
- `src/services/bracketGenerationService.ts` - 대진표 생성 로직

### Frontend  
- `src/pages/Tournaments/TournamentBracket.tsx:74-89` - 재생성 핸들러
- `src/store/api/apiSlice.ts:156-163` - generateBracket 뮤테이션

## 💡 예상 해결책

1. **Tournament ID 문제**: URL 파라미터가 올바르게 전달되지 않음
2. **권한 문제**: JWT 토큰 만료 또는 권한 부족
3. **데이터 검증 실패**: 대회 상태 또는 참가자 조건 미충족
4. **API 버전 불일치**: 프론트엔드와 백엔드 간 API 명세 차이

이 체크리스트를 따라 단계별로 문제를 해결하면 400 오류의 원인을 찾을 수 있습니다.