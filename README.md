# Tournament Management System 🏆

베트남 시장을 위한 동호인 대회 관리 시스템 (배드민턴/피클볼/테니스)

## 🌟 프로젝트 개요
베트남 동호인 스포츠 커뮤니티를 위한 종합 토너먼트 관리 시스템입니다. 
다국어 지원(베트남어/한국어/영어)과 베트남 현지화 기능을 제공합니다.

## 🌟 주요 기능

### 관리자 시스템
- 🏆 **대회 관리**: 대회 생성, 수정, 상태 관리
- 👥 **선수 관리**: 선수 등록, ELO 레이팅 관리, 실력 등급 분류
- 🎯 **참가자 관리**: 참가 신청 승인, 대진표 생성
- ⚡ **실시간 경기 관리**: 경기 결과 입력, 브래킷 업데이트

### 선수용 시스템
- 🇻🇳 **다국어 지원**: 베트남어(기본) / 한국어 / 영어
- 📱 **대시보드**: 참가 대회, 경기 일정, 개인 통계
- 🏅 **대회 참가**: 대회 검색, 신청, 결제 관리
- 📊 **랭킹 시스템**: ELO 기반 개인 랭킹, 지역별 순위

## 🌍 베트남 현지화

- 💰 **통화**: VND (베트남 동) 형식
- 📅 **날짜**: dd/MM/yyyy 형식
- 🗣️ **언어**: 베트남어 우선, 한국어/영어 지원
- 🏪 **지역**: 호치민시, 하노이, 다낭 등 주요 도시

## 🎯 시스템 특징

### ELO 레이팅 시스템
- 초기 레이팅: 1200점
- Group A (전문가): 2500+ 
- Group B (고급): 2000-2499
- Group C (중급): 1500-1999
- Group D (초급): 1200-1499

### 대진표 시스템
- 자동 균형 배치 (ELO 기반)
- 실시간 업데이트
- 토너먼트 브래킷 시각화
- 최소 4명 참가자 필요

### 다국어 시스템
- 베트남어가 기본 언어
- 언어 전환 시 localStorage 저장
- 모든 UI 요소 번역 지원
- 플래그 아이콘으로 직관적 선택

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Material-UI v7** - 현대적인 UI 컴포넌트
- **RTK Query** - 효율적인 API 상태 관리
- **react-i18next** - 다국어 지원
- **React Router** - 클라이언트 사이드 라우팅

### Backend
- **Node.js** + **Express**
- **Prisma ORM** + **SQLite**
- **JWT** - 인증 시스템
- **TypeScript** - 타입 안전성

## 🚀 실행 방법

### 백엔드 실행
```bash
cd backend
npm install
npm run dev  # 포트 5000
```

### 프론트엔드 실행
```bash
cd frontend
npm install
npm start    # 포트 3000
```

### 데이터베이스 관리
```bash
cd backend
npx prisma studio  # 포트 5555
```

## 📱 사용자 계정

### 관리자
- 이메일: `admin@tournament.com`
- 비밀번호: `admin123`

### 테스트 선수
- 이메일: `testplayer@example.com`
- 비밀번호: `testpass123`

## 📦 배포

### 프론트엔드 (Netlify)
```bash
# 자동 배포 설정
- GitHub 연결
- Base directory: frontend
- Build command: npm run build
- Publish directory: frontend/build
- 환경 변수: REACT_APP_API_URL
```

### 백엔드 (Render/Railway)
```bash
# 배포 설정
- GitHub 연결
- Root directory: backend
- Build command: npm install && npm run build
- Start command: npm start
- 환경 변수: DATABASE_URL, JWT_SECRET
```

### 🚀 베타 테스트 완료
✅ **111경기 AI 자동 스케줄링**
✅ **엑셀 내보내기** (대진표 + 시간표)
✅ **선수 인증 시스템** (localStorage 토큰)
✅ **32명 하이브리드 토너먼트** 성공

## 🔧 개발자 정보

- **프로젝트 유형**: Tournament Management System
- **대상 시장**: 베트남 동호인 스포츠 커뮤니티
- **개발 기간**: 2025년 8월
- **상태**: 베타 테스트 준비 완료

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다.