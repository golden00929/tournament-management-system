#!/bin/bash

# 🚀 Tournament Management System - GitHub 배포 스크립트

echo "🚀 Tournament Management System - GitHub 배포 준비"
echo "================================================"

# 현재 디렉토리 확인
echo "📍 현재 위치: $(pwd)"

# Git 상태 확인
echo ""
echo "📋 Git 상태 확인..."
git status

# 사용자 입력 받기
echo ""
echo "⚠️  주의: GitHub에서 저장소를 먼저 생성하세요!"
echo "저장소 이름: tournament-management-system"
echo ""
read -p "🔗 GitHub 저장소 URL을 입력하세요 (예: https://github.com/username/tournament-management-system.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ 저장소 URL이 입력되지 않았습니다."
    exit 1
fi

# 원격 저장소 설정
echo ""
echo "🔗 원격 저장소 연결 중..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# 브랜치 이름 설정
echo "🌿 기본 브랜치를 main으로 설정..."
git branch -M main

# 푸시 실행
echo ""
echo "📤 GitHub에 업로드 중..."
if git push -u origin main; then
    echo ""
    echo "✅ 성공! GitHub 저장소에 업로드 완료"
    echo ""
    echo "📖 다음 단계:"
    echo "1. Netlify.com 접속"
    echo "2. 'New site from Git' 선택"
    echo "3. GitHub 저장소 연결"
    echo "4. 빌드 설정:"
    echo "   - Build command: cd frontend && npm run build"
    echo "   - Publish directory: frontend/build"
    echo ""
    echo "🎉 베타 테스트 준비 완료!"
    echo "📧 관리자 계정: admin@tournament.com / admin123"
    echo "👤 테스트 선수: testplayer@example.com / testpass123"
else
    echo ""
    echo "❌ 업로드 실패. 다음을 확인하세요:"
    echo "1. GitHub 저장소가 생성되었는지 확인"
    echo "2. 저장소 URL이 정확한지 확인"
    echo "3. GitHub 로그인 상태 확인"
    echo ""
    echo "💡 수동 설정:"
    echo "git remote add origin $REPO_URL"
    echo "git push -u origin main"
fi