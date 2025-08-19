# 🐳 Tournament Management System - Backend Dockerfile
# 프로덕션 환경을 위한 Node.js 백엔드 컨테이너

# ===== Build Stage =====
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 의존성 설치 (Prisma 등을 위한 openssl)
RUN apk add --no-cache openssl

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (개발 의존성 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# Prisma 클라이언트 생성
RUN npx prisma generate

# TypeScript 빌드
RUN npm run build

# ===== Production Stage =====
FROM node:18-alpine AS production

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 의존성 설치
RUN apk add --no-cache openssl dumb-init

# package.json과 package-lock.json 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 빌드된 애플리케이션 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 애플리케이션 파일 소유권 변경
RUN chown -R nodejs:nodejs /app
USER nodejs

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=5000

# 포트 노출
EXPOSE 5000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 애플리케이션 시작
CMD ["dumb-init", "node", "dist/server.js"]