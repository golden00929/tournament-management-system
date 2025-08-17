const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentBrackets() {
  try {
    console.log('=== 현재 브라켓 상태 확인 ===');
    
    const tournament = await prisma.tournament.findFirst({
      where: {
        tournamentType: 'hybrid'
      }
    });
    
    if (!tournament) {
      console.log('하이브리드 대회가 없습니다.');
      return;
    }
    
    console.log(`대회: ${tournament.name}`);
    
    // 모든 브라켓 조회
    const brackets = await prisma.bracket.findMany({
      where: {
        tournamentId: tournament.id
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
        maxParticipants: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 전체 브라켓: ${brackets.length}개`);
    
    brackets.forEach((bracket, index) => {
      console.log(`\n--- 브라켓 ${index + 1} ---`);
      console.log(`ID: ${bracket.id}`);
      console.log(`이름: ${bracket.name}`);
      console.log(`타입: ${bracket.type}`);
      console.log(`상태: ${bracket.status}`);
      console.log(`최대 참가자: ${bracket.maxParticipants}`);
      console.log(`생성 시간: ${bracket.createdAt}`);
    });
    
    // 각 브라켓별 매치 수 확인
    for (const bracket of brackets) {
      const matchCount = await prisma.match.count({
        where: {
          bracketId: bracket.id
        }
      });
      
      const groupStageMatches = await prisma.match.count({
        where: {
          bracketId: bracket.id,
          roundName: 'Group Stage'
        }
      });
      
      console.log(`\n🎯 브라켓 "${bracket.name}" 매치 분석:`);
      console.log(`  전체 매치: ${matchCount}개`);
      console.log(`  그룹 스테이지: ${groupStageMatches}개`);
      console.log(`  기타 라운드: ${matchCount - groupStageMatches}개`);
    }
    
    // 중복 매치 확인
    const allMatches = await prisma.match.findMany({
      where: {
        tournament: {
          id: tournament.id
        },
        roundName: 'Group Stage'
      },
      select: {
        bracketId: true,
        player1Name: true,
        player2Name: true,
        matchNumber: true
      }
    });
    
    console.log(`\n🔍 중복 매치 분석:`);
    console.log(`전체 그룹 스테이지 매치: ${allMatches.length}개`);
    
    // 동일한 매치업 찾기
    const matchups = {};
    allMatches.forEach(match => {
      const key = [match.player1Name, match.player2Name].sort().join(' vs ');
      if (!matchups[key]) {
        matchups[key] = [];
      }
      matchups[key].push({
        bracketId: match.bracketId,
        matchNumber: match.matchNumber
      });
    });
    
    const duplicateMatchups = Object.entries(matchups).filter(([key, matches]) => matches.length > 1);
    
    if (duplicateMatchups.length > 0) {
      console.log(`\n❌ 중복 매치업 발견: ${duplicateMatchups.length}개`);
      duplicateMatchups.slice(0, 5).forEach(([matchup, matches]) => {
        console.log(`  ${matchup}: ${matches.length}번 중복`);
        matches.forEach(m => console.log(`    - 브라켓 ${m.bracketId}, 매치 #${m.matchNumber}`));
      });
    } else {
      console.log('✅ 중복 매치업 없음');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentBrackets();