# 🚀 Tournament Management System - 배포 가이드

## GitHub 저장소 연결

GitHub에서 저장소 생성 후 다음 명령어를 실행하세요:

```bash
# 현재 위치 확인
cd /home/jay/tournament-management-system

# 원격 저장소 연결 (GitHub에서 제공하는 URL 사용)
git remote add origin https://github.com/YOUR_USERNAME/tournament-management-system.git

# 기본 브랜치를 main으로 설정 (선택사항)
git branch -M main

# 첫 푸시
git push -u origin main
```

## Netlify 배포

### 프론트엔드 배포

1. **Netlify.com 로그인**
2. **"New site from Git" 선택**
3. **GitHub 연결 후 저장소 선택**
4. **빌드 설정**:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/build`
   - Base directory: `frontend`

### 환경 변수 설정

Netlify 사이트 설정에서 Environment Variables 추가:

```
REACT_APP_API_URL=https://your-backend-url.herokuapp.com
```

### 백엔드 배포 (Heroku 또는 Railway)

#### Heroku 배포
```bash
# Heroku CLI 설치 후
heroku create your-app-name
git subtree push --prefix backend heroku main
```

#### Railway 배포
1. Railway.app 접속
2. GitHub 저장소 연결
3. backend 폴더 선택
4. 자동 배포

## 배포 후 확인사항

- ✅ 프론트엔드 접속 가능
- ✅ API 연결 정상
- ✅ 데이터베이스 연결
- ✅ 관리자 로그인: admin@tournament.com / admin123
- ✅ 다국어 지원 (베트남어/한국어/영어)

## 베타 테스트 계정

### 관리자
- 이메일: admin@tournament.com
- 비밀번호: admin123

### 테스트 선수
- 이메일: testplayer@example.com  
- 비밀번호: testpass123

## 주요 기능

### ✅ 완성된 기능
- 👤 사용자 인증 (관리자/선수)
- 🏆 대회 관리 (CRUD, 상태 관리)
- 👥 선수 관리 (ELO 레이팅 시스템)
- 🎯 대진표 생성 및 관리
- 📱 선수용 모바일 친화적 UI
- 🌐 3개국어 지원 (베트남어/한국어/영어)
- 💰 베트남 현지화 (VND 통화, dd/MM/yyyy 날짜)

### 🔄 개발 중인 기능
- 💳 결제 시스템 통합
- 📊 실시간 경기 결과 입력
- 📧 이메일 알림 시스템
- 📱 모바일 앱 (React Native)

## 기술 스택

- **Frontend**: React 18 + TypeScript + MUI v7 + RTK Query
- **Backend**: Node.js + Express + Prisma + SQLite
- **Authentication**: JWT
- **Deployment**: Netlify (Frontend) + Heroku/Railway (Backend)

---

🛠️ **개발팀**: Claude + Human Collaboration  
📧 **문의**: 베타 테스트 피드백 환영합니다!