const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDataMismatch() {
  try {
    console.log('=== 실제 데이터 vs 브라켓 데이터 분석 ===');
    
    // 하이브리드 대회 찾기
    const tournament = await prisma.tournament.findFirst({
      where: {
        tournamentType: 'hybrid'
      },
      select: {
        id: true,
        name: true,
        tournamentType: true,
        maxParticipants: true
      }
    });
    
    if (!tournament) {
      console.log('하이브리드 대회가 없습니다.');
      return;
    }
    
    console.log(`\n대회: ${tournament.name}`);
    console.log(`최대 참가자: ${tournament.maxParticipants}`);
    
    // 1. 실제 승인된 참가자 목록 조회
    const participants = await prisma.participant.findMany({
      where: {
        tournamentId: tournament.id,
        approvalStatus: 'approved',
        isActive: true
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            eloRating: true
          }
        }
      },
      orderBy: {
        registrationDate: 'asc'
      }
    });
    
    console.log(`\n📊 실제 승인된 참가자: ${participants.length}명`);
    console.log('참가자 목록:');
    participants.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.player.name} (ELO: ${p.player.eloRating})`);
    });
    
    // 2. 브라켓에서 나타나는 참가자 분석
    const brackets = await prisma.bracket.findMany({
      where: {
        tournamentId: tournament.id
      },
      include: {
        matches: {
          select: {
            id: true,
            roundName: true,
            matchNumber: true,
            player1Name: true,
            player2Name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 생성된 브라켓: ${brackets.length}개`);
    
    brackets.forEach((bracket, index) => {
      console.log(`\n--- 브라켓 ${index + 1}: ${bracket.name} ---`);
      console.log(`매치 수: ${bracket.matches.length}`);
      
      // 브라켓에서 나타나는 참가자 추출
      const bracketParticipants = new Set();
      bracket.matches.forEach(match => {
        if (match.player1Name && match.player1Name !== 'TBD' && match.player1Name !== 'null') {
          bracketParticipants.add(match.player1Name);
        }
        if (match.player2Name && match.player2Name !== 'TBD' && match.player2Name !== 'null') {
          bracketParticipants.add(match.player2Name);
        }
      });
      
      console.log(`브라켓에서 나타나는 참가자: ${bracketParticipants.size}명`);
      
      // 실제 참가자와 브라켓 참가자 비교
      const realParticipantNames = new Set(participants.map(p => p.player.name));
      const missingInBracket = [...realParticipantNames].filter(name => !bracketParticipants.has(name));
      const extraInBracket = [...bracketParticipants].filter(name => !realParticipantNames.has(name));
      
      console.log(`\n🔍 데이터 분석:`);
      console.log(`  실제 참가자: ${realParticipantNames.size}명`);
      console.log(`  브라켓 참가자: ${bracketParticipants.size}명`);
      console.log(`  차이: ${realParticipantNames.size - bracketParticipants.size}명`);
      
      if (missingInBracket.length > 0) {
        console.log(`\n❌ 브라켓에 누락된 참가자 (${missingInBracket.length}명):`);
        missingInBracket.forEach(name => console.log(`  - ${name}`));
      }
      
      if (extraInBracket.length > 0) {
        console.log(`\n⚠️  브라켓에만 있는 참가자 (${extraInBracket.length}명):`);
        extraInBracket.forEach(name => console.log(`  - ${name}`));
      }
      
      // 라운드별 분석
      const roundCounts = {};
      bracket.matches.forEach(match => {
        roundCounts[match.roundName] = (roundCounts[match.roundName] || 0) + 1;
      });
      
      console.log(`\n📋 라운드별 매치 분포:`);
      Object.entries(roundCounts).forEach(([round, count]) => {
        console.log(`  ${round}: ${count}경기`);
      });
    });
    
    // 3. 브라켓 생성 설정 확인
    console.log(`\n🔧 브라켓 생성 조건 분석:`);
    console.log(`  하이브리드 대회 예상 구조:`);
    console.log(`  - 32명 → 8그룹 × 4명 = 32명`);
    console.log(`  - 그룹 스테이지: 8그룹 × 6경기 = 48경기`);
    console.log(`  - 각 그룹에서 1명씩 진출 → 8명`);
    console.log(`  - 녹아웃: 8→4→2→1 = 7경기`);
    console.log(`  - 총 경기: 48 + 7 = 55경기`);
    console.log(`  - 하지만 실제로는 63경기가 생성됨`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDataMismatch();