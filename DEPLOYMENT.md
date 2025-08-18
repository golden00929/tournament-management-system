# 🚀 Tournament Management System - 배포 가이드

이 문서는 Tournament Management System을 다양한 환경에 배포하는 방법을 설명합니다.

## 📋 목차

1. [로컬 개발 환경](#로컬-개발-환경)
2. [Docker를 이용한 배포](#docker를-이용한-배포)
3. [프로덕션 배포](#프로덕션-배포)
4. [클라우드 플랫폼 배포](#클라우드-플랫폼-배포)
5. [모니터링 및 유지보수](#모니터링-및-유지보수)

## 🏠 로컬 개발 환경

### 사전 요구사항
- Node.js 18+ 
- PostgreSQL 15+
- Redis (선택사항)

### 1. 저장소 클론
```bash
git clone https://github.com/golden00929/tournament-management-system.git
cd tournament-management-system
```

### 2. 백엔드 설정
```bash
cd backend
npm install
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 3. 프론트엔드 설정
```bash
cd frontend
npm install
# .env 파일 생성 및 API URL 설정
echo "REACT_APP_API_URL=http://localhost:5000" > .env
npm start
```

## 🐳 Docker를 이용한 배포

### 개발 환경 (docker-compose.yml)

```bash
# 1. 환경 변수 설정
cp .env.production .env

# 2. Docker Compose로 전체 스택 실행
docker-compose up -d

# 3. 데이터베이스 마이그레이션
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed

# 4. 서비스 확인
docker-compose ps
```

### 접속 정보
- **프론트엔드**: http://localhost
- **백엔드 API**: http://localhost:5000
- **데이터베이스**: localhost:5432
- **Redis**: localhost:6379

## 🌟 프로덕션 배포

### 1. 사전 준비

#### 도메인 및 SSL 인증서
```bash
# 도메인 설정 (예: tournament.yourdomain.com)
# DNS A 레코드를 서버 IP로 설정

# Let's Encrypt 인증서 발급
./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

#### 환경 변수 설정
```bash
# 프로덕션 환경 변수 파일 생성
cp .env.production .env

# 필수 값들 수정
nano .env
```

**중요한 환경 변수들:**
```bash
# 강력한 JWT 시크릿 (32자 이상)
JWT_SECRET=your-production-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-production-refresh-secret-different

# 데이터베이스 비밀번호
DB_PASSWORD=your-super-secure-database-password

# 관리자 계정
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password

# 도메인 설정
DOMAIN=yourdomain.com
CLIENT_URL=https://yourdomain.com
```

### 2. 프로덕션 배포 실행

```bash
# 1. 프로덕션 모드로 실행
docker-compose -f docker-compose.prod.yml up -d

# 2. 데이터베이스 초기화
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed

# 3. SSL 인증서 발급
docker-compose -f docker-compose.prod.yml exec certbot certbot --webroot -w /var/www/certbot -d yourdomain.com -d api.yourdomain.com --email admin@yourdomain.com --agree-tos --no-eff-email

# 4. Nginx 재시작
docker-compose -f docker-compose.prod.yml restart nginx
```

## ☁️ 클라우드 플랫폼 배포

### AWS EC2 배포

#### 1. EC2 인스턴스 생성
```bash
# Ubuntu 22.04 LTS 인스턴스 생성
# 최소 사양: t3.medium (2 vCPU, 4GB RAM)
# 권장 사양: t3.large (2 vCPU, 8GB RAM)

# 보안 그룹 설정
# 인바운드 규칙: 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

#### 2. 서버 설정
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 프로젝트 배포
git clone https://github.com/golden00929/tournament-management-system.git
cd tournament-management-system
cp .env.production .env
# .env 파일 수정...
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel (프론트엔드)

#### 1. Vercel CLI 설치
```bash
npm i -g vercel
```

#### 2. 프론트엔드 배포
```bash
cd frontend
vercel --prod
```

#### 3. 환경 변수 설정
```bash
# Vercel 대시보드에서 환경 변수 설정
REACT_APP_API_URL=https://your-backend-url.com
```

## 📊 모니터링 및 유지보수

### 1. 헬스체크 및 모니터링

```bash
# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend

# 리소스 사용량 확인
docker stats
```

### 2. 백업 설정

#### 데이터베이스 백업
```bash
# 백업 스크립트 생성
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T database pg_dump -U tournament_user tournament_db > backup/db_backup_$DATE.sql
gzip backup/db_backup_$DATE.sql

# 30일 이상된 백업 파일 삭제
find backup/ -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# 크론탭 설정 (매일 새벽 2시)
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### 3. 업데이트 및 배포

```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. 이미지 재빌드 및 재배포
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. 데이터베이스 마이그레이션 (필요한 경우)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## 🚀 간단 배포 명령어

### 로컬 테스트
```bash
# 1. 클론 및 실행
git clone https://github.com/golden00929/tournament-management-system.git
cd tournament-management-system
cp .env.production .env
docker-compose up -d

# 2. 브라우저에서 http://localhost 접속
```

### 프로덕션 배포
```bash
# 1. 서버에서 실행
git clone https://github.com/golden00929/tournament-management-system.git
cd tournament-management-system
cp .env.production .env
# .env 파일 수정 (JWT_SECRET, DB_PASSWORD 등)
docker-compose -f docker-compose.prod.yml up -d
```

---

🎉 **배포 완료!** 

Tournament Management System이 성공적으로 배포되었습니다. 추가 지원이 필요하시면 언제든 문의해 주세요.