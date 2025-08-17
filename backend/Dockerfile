FROM node:18-alpine

WORKDIR /app

# 종속성 파일 복사
COPY package*.json ./
COPY prisma ./prisma/

# 종속성 설치
RUN npm ci --only=production

# 애플리케이션 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# Prisma 클라이언트 생성
RUN npx prisma generate

# 포트 노출
EXPOSE 10000

# 애플리케이션 시작
CMD ["npm", "start"]