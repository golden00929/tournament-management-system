# API 참조 문서

## 🌐 기본 정보

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

## 🔐 인증 엔드포인트

### POST /auth/login
사용자 로그인

**Request Body:**
```json
{
  "email": "admin@tournament.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@tournament.com",
      "name": "관리자",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
}
```

### POST /auth/register
새 사용자 등록

**Request Body:**
```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "password": "password123",
  "role": "user"
}
```

### GET /auth/me
현재 사용자 정보 조회

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "admin@tournament.com",
    "name": "관리자",
    "role": "admin"
  }
}
```

## 🏆 토너먼트 엔드포인트

### GET /tournaments
토너먼트 목록 조회

**Query Parameters:**
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 항목 수 (default: 10)
- `status`: 토너먼트 상태 필터
- `search`: 검색 키워드

**Response:**
```json
{
  "success": true,
  "data": {
    "tournaments": [
      {
        "id": "tournament_id",
        "name": "2024 배드민턴 챔피언십",
        "format": "single_elimination",
        "status": "ongoing",
        "maxParticipants": 32,
        "startDate": "2024-01-15T09:00:00Z",
        "endDate": "2024-01-16T18:00:00Z",
        "location": "서울체육관",
        "entryFee": 50000,
        "description": "연간 최대 배드민턴 대회"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25
    }
  }
}
```

### POST /tournaments
새 토너먼트 생성

**Request Body:**
```json
{
  "name": "2024 신년 배드민턴 대회",
  "format": "single_elimination",
  "maxParticipants": 16,
  "startDate": "2024-02-01T09:00:00Z",
  "endDate": "2024-02-01T18:00:00Z",
  "location": "부산체육관",
  "entryFee": 30000,
  "description": "신년 맞이 친선 대회"
}
```

### GET /tournaments/:id
특정 토너먼트 상세 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tournament_id",
    "name": "2024 배드민턴 챔피언십",
    "format": "single_elimination",
    "status": "ongoing",
    "maxParticipants": 32,
    "currentParticipants": 28,
    "startDate": "2024-01-15T09:00:00Z",
    "endDate": "2024-01-16T18:00:00Z",
    "location": "서울체육관",
    "entryFee": 50000,
    "description": "연간 최대 배드민턴 대회",
    "rules": "단식 토너먼트, 3세트 2승제",
    "prizes": "우승 100만원, 준우승 50만원",
    "createdBy": "admin_id",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /tournaments/:id
토너먼트 정보 수정

**Request Body:**
```json
{
  "name": "수정된 토너먼트 이름",
  "maxParticipants": 64,
  "entryFee": 40000
}
```

### DELETE /tournaments/:id
토너먼트 삭제

**Response:**
```json
{
  "success": true,
  "message": "토너먼트가 삭제되었습니다."
}
```

## 👥 참가자 관리 엔드포인트

### GET /tournaments/:id/participants
토너먼트 참가자 목록

**Query Parameters:**
- `limit`: 최대 반환 개수 (default: 100)
- `status`: 승인 상태 필터 (pending, approved, rejected)

**Response:**
```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "id": "participant_id",
        "player": {
          "id": "player_id",
          "name": "김철수",
          "email": "kim@example.com",
          "phone": "010-1234-5678",
          "skillLevel": "intermediate",
          "eloRating": 1450
        },
        "registrationDate": "2024-01-05T10:30:00Z",
        "paymentStatus": "paid",
        "approvalStatus": "approved"
      }
    ],
    "count": 28
  }
}
```

### POST /tournaments/:id/participants
참가자 추가

**Request Body:**
```json
{
  "playerId": "player_id"
}
```

### PUT /participants/:id/status
참가자 승인 상태 변경

**Request Body:**
```json
{
  "status": "approved"
}
```

## 🎯 대진표 엔드포인트

### GET /tournaments/:id/bracket
토너먼트 대진표 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bracket_id",
    "tournament": {
      "id": "tournament_id",
      "name": "2024 배드민턴 챔피언십"
    },
    "matches": [
      {
        "id": "match_id",
        "matchNumber": 1,
        "roundName": "round_of_16",
        "player1": {
          "id": "player1_id",
          "name": "김철수"
        },
        "player2": {
          "id": "player2_id",
          "name": "이영희"
        },
        "player1Score": null,
        "player2Score": null,
        "status": "pending",
        "winnerId": null,
        "scheduledTime": "2024-01-15T10:00:00Z",
        "court": "A코트"
      }
    ]
  }
}
```

### POST /tournaments/:id/bracket
대진표 생성

**Request Body (기본 생성):**
```json
{
  "tournamentId": "tournament_id"
}
```

**Request Body (고급 설정):**
```json
{
  "tournamentId": "tournament_id",
  "eventType": "singles",
  "name": "남자 단식",
  "participantIds": ["player1_id", "player2_id"],
  "tournamentType": "hybrid",
  "groupSize": 4,
  "advancersPerGroup": 2
}
```

## 🏸 경기 관리 엔드포인트

### GET /matches/tournament/:id
토너먼트별 경기 목록

**Query Parameters:**
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 항목 수 (default: 100)
- `status`: 경기 상태 필터
- `round`: 라운드 필터

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_id",
        "matchNumber": 1,
        "roundName": "quarterfinal",
        "player1": {
          "id": "player1_id",
          "name": "김철수",
          "eloRating": 1450
        },
        "player2": {
          "id": "player2_id",
          "name": "이영희",
          "eloRating": 1520
        },
        "player1Score": 21,
        "player2Score": 19,
        "status": "completed",
        "winnerId": "player1_id",
        "scheduledTime": "2024-01-15T14:30:00Z",
        "court": "메인코트",
        "completedAt": "2024-01-15T15:45:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCount": 15
    }
  }
}
```

### PUT /matches/:id
경기 정보 업데이트

**Request Body:**
```json
{
  "player1Score": 21,
  "player2Score": 15,
  "winnerId": "player1_id",
  "status": "completed"
}
```

### PUT /matches/:id/schedule
경기 일정 업데이트

**Request Body:**
```json
{
  "scheduledTime": "2024-01-15T16:00:00Z",
  "court": "B코트"
}
```

## 👤 선수 관리 엔드포인트

### GET /players
선수 목록 조회

**Query Parameters:**
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 항목 수 (default: 50)
- `search`: 이름/이메일 검색
- `skillLevel`: 실력 레벨 필터
- `gender`: 성별 필터
- `isActive`: 활성 상태 필터

**Response:**
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "id": "player_id",
        "name": "김철수",
        "email": "kim@example.com",
        "phone": "010-1234-5678",
        "birthYear": 1990,
        "gender": "male",
        "province": "서울",
        "district": "강남구",
        "skillLevel": "intermediate",
        "eloRating": 1450,
        "isActive": true,
        "registrationDate": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalCount": 245
    }
  }
}
```

### POST /players
새 선수 등록

**Request Body:**
```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "phone": "010-9876-5432",
  "birthYear": 1985,
  "gender": "male",
  "province": "부산",
  "district": "해운대구",
  "skillLevel": "advanced"
}
```

### PUT /players/:id
선수 정보 수정

**Request Body:**
```json
{
  "phone": "010-1111-2222",
  "skillLevel": "expert",
  "province": "대구"
}
```

### DELETE /players/:id
선수 삭제

**Response:**
```json
{
  "success": true,
  "message": "선수가 삭제되었습니다."
}
```

### POST /players/import/csv
CSV 파일로 선수 일괄 등록

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `csvFile`
- File type: `.csv`

**CSV 형식:**
```csv
name,email,phone,birthYear,gender,province,district,eloRating,skillLevel
김철수,kim@example.com,010-1234-5678,1990,male,서울,강남구,1450,intermediate
이영희,lee@example.com,010-2345-6789,1988,female,부산,해운대구,1520,advanced
```

**Response:**
```json
{
  "success": true,
  "message": "CSV 가져오기가 완료되었습니다. 성공: 2명, 중복: 0명, 오류: 0개",
  "data": {
    "totalRows": 2,
    "validCount": 2,
    "duplicateCount": 0,
    "errorCount": 0,
    "errors": []
  }
}
```

### GET /players/export/csv
선수 목록 CSV 다운로드

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="players_YYYY-MM-DD.csv"`

## 📊 통계 엔드포인트

### GET /tournaments/:id/stats
토너먼트 통계

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMatches": 31,
    "completedMatches": 24,
    "ongoingMatches": 2,
    "pendingMatches": 5,
    "totalParticipants": 32,
    "averageMatchDuration": 45,
    "topPlayers": [
      {
        "playerId": "player_id",
        "name": "김철수",
        "wins": 4,
        "losses": 0,
        "winRate": 100
      }
    ]
  }
}
```

## ❌ 에러 응답 형식

모든 API는 다음과 같은 표준 에러 형식을 사용합니다:

```json
{
  "success": false,
  "message": "사용자 친화적 에러 메시지",
  "error": "ERROR_CODE",
  "details": {
    "field": "특정 필드 에러 설명"
  }
}
```

### 일반적인 HTTP 상태 코드

- `200 OK`: 성공
- `201 Created`: 리소스 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 데이터 충돌 (중복 등)
- `422 Unprocessable Entity`: 유효성 검사 실패
- `500 Internal Server Error`: 서버 내부 에러

### 주요 에러 코드

- `INVALID_CREDENTIALS`: 잘못된 로그인 정보
- `TOKEN_EXPIRED`: JWT 토큰 만료
- `INSUFFICIENT_PERMISSIONS`: 권한 부족
- `RESOURCE_NOT_FOUND`: 리소스 없음
- `VALIDATION_ERROR`: 입력 값 유효성 검사 실패
- `DUPLICATE_ENTRY`: 중복 데이터
- `TOURNAMENT_FULL`: 토너먼트 정원 초과
- `BRACKET_ALREADY_EXISTS`: 대진표 이미 존재
- `MATCH_NOT_EDITABLE`: 편집할 수 없는 경기 상태

## 🔍 개발자 도구

### Postman Collection
프로젝트 루트의 `tournament-api.postman_collection.json` 파일을 Postman에서 import하여 사용할 수 있습니다.

### API 테스트
```bash
# 헬스체크
curl http://localhost:5000/api/health

# 로그인 테스트
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tournament.com","password":"admin123"}'
```

### 환경 변수
```bash
# .env 파일 설정
DATABASE_URL="postgresql://user:password@localhost:5432/tournament_db"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV="development"
```