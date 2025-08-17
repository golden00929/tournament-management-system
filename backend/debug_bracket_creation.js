const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBracketCreation() {
  try {
    console.log('=== 브라켓 생성 과정 디버깅 ===');
    
    // 하이브리드 대회 찾기
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
    
    // 모든 참가자 ID 조회 (실제 브라켓 생성에 사용된 것)
    const allParticipants = await prisma.participant.findMany({
      where: {
        tournamentId: tournament.id,
        approvalStatus: 'approved',
        isActive: true
      },
      include: {
        player: true
      },
      orderBy: {
        registrationDate: 'asc'
      }
    });
    
    console.log(`\n💾 데이터베이스의 승인된 참가자: ${allParticipants.length}명`);
    
    // 실제 브라켓에서 사용된 participants JSON 확인
    const brackets = await prisma.bracket.findMany({
      where: {
        tournamentId: tournament.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (brackets.length > 0) {
      const latestBracket = brackets[0];
      console.log(`\n📊 최신 브라켓: ${latestBracket.name}`);
      console.log(`생성 시간: ${latestBracket.createdAt}`);
      
      try {
        const bracketParticipants = JSON.parse(latestBracket.participants);
        console.log(`브라켓에 저장된 참가자 수: ${bracketParticipants.length}명`);
        
        console.log('\n브라켓 참가자 목록:');
        bracketParticipants.forEach((p, index) => {
          console.log(`  ${index + 1}. ${p.name} (ELO: ${p.eloRating})`);
        });
        
        // 데이터베이스 참가자와 브라켓 참가자 비교
        const dbParticipantNames = allParticipants.map(p => p.player.name);
        const bracketParticipantNames = bracketParticipants.map(p => p.name);
        
        const missing = dbParticipantNames.filter(name => !bracketParticipantNames.includes(name));
        const extra = bracketParticipantNames.filter(name => !dbParticipantNames.includes(name));
        
        if (missing.length > 0) {
          console.log(`\n❌ 브라켓에 누락된 참가자 (${missing.length}명):`);
          missing.forEach(name => console.log(`  - ${name}`));
        }
        
        if (extra.length > 0) {
          console.log(`\n⚠️  브라켓에만 있는 참가자 (${extra.length}명):`);
          extra.forEach(name => console.log(`  - ${name}`));
        }
        
      } catch (error) {
        console.error('브라켓 participants JSON 파싱 오류:', error.message);
      }
      
      // 브라켓 데이터 구조 확인
      try {
        const bracketData = JSON.parse(latestBracket.bracketData);
        console.log(`\n📋 브라켓 데이터 구조:`);
        console.log(`라운드 수: ${bracketData.rounds.length}`);
        
        bracketData.rounds.forEach((round, index) => {
          console.log(`  라운드 ${index + 1} (${round.name}): ${round.matches.length}경기`);
        });
        
        // 그룹 스테이지 분석
        const groupStageRound = bracketData.rounds.find(r => r.name === 'Group Stage');
        if (groupStageRound) {
          console.log(`\n🔍 그룹 스테이지 분석:`);
          const groups = {};
          groupStageRound.matches.forEach(match => {
            const roundName = match.roundName;
            if (!groups[roundName]) {
              groups[roundName] = [];
            }
            groups[roundName].push(match);
          });
          
          console.log(`그룹 수: ${Object.keys(groups).length}`);
          Object.entries(groups).forEach(([groupName, matches]) => {
            console.log(`  ${groupName}: ${matches.length}경기`);
          });
        }
        
      } catch (error) {
        console.error('브라켓 데이터 JSON 파싱 오류:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBracketCreation();