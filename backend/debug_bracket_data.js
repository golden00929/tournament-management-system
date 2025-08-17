const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBracketData() {
  try {
    console.log('=== 브라켓 데이터 상세 분석 ===');
    
    // 하이브리드 대회의 최신 브라켓 조회
    const bracket = await prisma.bracket.findFirst({
      where: {
        tournament: {
          tournamentType: 'hybrid'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!bracket) {
      console.log('하이브리드 브라켓이 없습니다.');
      return;
    }
    
    console.log(`브라켓: ${bracket.name}`);
    console.log(`타입: ${bracket.type}`);
    console.log(`상태: ${bracket.status}`);
    
    // 브라켓 데이터 원본 확인
    console.log('\n📄 브라켓 데이터 원본:');
    console.log('브라켓 데이터 타입:', typeof bracket.bracketData);
    console.log('브라켓 데이터 길이:', bracket.bracketData ? bracket.bracketData.length : 'null');
    
    if (bracket.bracketData) {
      try {
        const bracketData = JSON.parse(bracket.bracketData);
        console.log('\n✅ 브라켓 데이터 파싱 성공');
        console.log('브라켓 데이터 구조:', Object.keys(bracketData));
        
        if (bracketData.rounds) {
          console.log(`라운드 수: ${bracketData.rounds.length}`);
          bracketData.rounds.forEach((round, index) => {
            console.log(`  라운드 ${index + 1}: ${round.name} - ${round.matches ? round.matches.length : 0}경기`);
          });
        } else {
          console.log('rounds 프로퍼티가 없습니다.');
          console.log('사용 가능한 프로퍼티:', Object.keys(bracketData));
        }
        
      } catch (parseError) {
        console.log('\n❌ 브라켓 데이터 파싱 실패:', parseError.message);
        console.log('첫 100자:', bracket.bracketData.substring(0, 100));
      }
    } else {
      console.log('브라켓 데이터가 null입니다.');
    }
    
    // 매치 데이터 확인
    const matches = await prisma.match.findMany({
      where: {
        bracketId: bracket.id
      },
      select: {
        id: true,
        roundName: true,
        matchNumber: true,
        player1Name: true,
        player2Name: true,
        status: true
      },
      orderBy: [
        { roundName: 'asc' },
        { matchNumber: 'asc' }
      ]
    });
    
    console.log(`\n🎯 생성된 매치: ${matches.length}개`);
    
    // 라운드별 매치 분석
    const roundCounts = {};
    const allPlayerNames = new Set();
    
    matches.forEach(match => {
      roundCounts[match.roundName] = (roundCounts[match.roundName] || 0) + 1;
      
      if (match.player1Name && match.player1Name !== 'TBD' && match.player1Name !== 'null') {
        allPlayerNames.add(match.player1Name);
      }
      if (match.player2Name && match.player2Name !== 'TBD' && match.player2Name !== 'null') {
        allPlayerNames.add(match.player2Name);
      }
    });
    
    console.log('\n📊 라운드별 매치 분포:');
    Object.entries(roundCounts).forEach(([round, count]) => {
      console.log(`  ${round}: ${count}경기`);
    });
    
    console.log(`\n👥 매치에서 추출된 참가자: ${allPlayerNames.size}명`);
    console.log('첫 10명:', Array.from(allPlayerNames).slice(0, 10));
    
    // 플레이스홀더 분석
    const placeholders = Array.from(allPlayerNames).filter(name => 
      name.includes('Group') && (name.includes('1위') || name.includes('2위'))
    );
    
    console.log(`\n🔍 플레이스홀더: ${placeholders.length}개`);
    placeholders.forEach(ph => console.log(`  - ${ph}`));
    
    // 실제 참가자 이름
    const realPlayers = Array.from(allPlayerNames).filter(name => 
      !name.includes('Group') || (!name.includes('1위') && !name.includes('2위'))
    );
    
    console.log(`\n👤 실제 참가자: ${realPlayers.length}명`);
    
    if (realPlayers.length !== 32) {
      console.log('\n⚠️  참가자 수 불일치 발견!');
      console.log(`예상: 32명, 실제: ${realPlayers.length}명`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBracketData();