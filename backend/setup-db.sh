#!/bin/bash
set -e

echo "🚀 데이터베이스 설정 시작..."

# Prisma 마이그레이션 실행
echo "📦 Prisma 마이그레이션 실행..."
npx prisma migrate deploy

# 시드 데이터 실행
echo "🌱 시드 데이터 생성..."
npx prisma db seed

echo "✅ 데이터베이스 설정 완료!"