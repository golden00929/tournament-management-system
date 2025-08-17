const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewBracket() {
  try {
    console.log('=== 새 브라켓 생성 테스트 ===');
    
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
    
    console.log(`대회: ${tournament.name} (ID: ${tournament.id})`);
    
    // 기존 브라켓 및 매치 삭제
    console.log('\n🗑️  기존 브라켓 삭제 중...');
    await prisma.match.deleteMany({
      where: {
        bracket: {
          tournamentId: tournament.id
        }
      }
    });
    
    await prisma.bracket.deleteMany({
      where: {
        tournamentId: tournament.id
      }
    });
    
    console.log('✅ 기존 브라켓 삭제 완료');
    
    // 참가자 목록 조회
    const participants = await prisma.participant.findMany({
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
    
    console.log(`\n👥 승인된 참가자: ${participants.length}명`);
    
    if (participants.length < 4) {
      console.log('참가자가 부족합니다.');
      return;
    }
    
    // 직접 브라켓 생성 서비스 호출
    const { BracketGenerationService } = require('./src/services/bracketGenerationService');
    
    const participantIds = participants.map(p => p.player.id);
    
    console.log('\n🔧 새 브라켓 생성 중...');
    console.log(`참가자 IDs: ${participantIds.length}개`);
    
    const result = await BracketGenerationService.generateHybridBracketWithParticipants(
      tournament.id,
      participantIds,
      'singles',
      4, // groupSize
      1  // advancersPerGroup - 이제 1로 설정
    );
    
    console.log('\n✅ 새 브라켓 생성 완료');
    console.log(`브라켓 ID: ${result.id}`);
    console.log(`브라켓 이름: ${result.name}`);
    
    // 생성된 매치 확인
    const matches = await prisma.match.findMany({
      where: {
        bracketId: result.id
      },
      select: {
        roundName: true,
        player1Name: true,
        player2Name: true
      }
    });
    
    console.log(`\n📊 생성된 매치: ${matches.length}개`);
    
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
    
    console.log('\n📋 라운드별 매치 분포:');
    Object.entries(roundCounts).forEach(([round, count]) => {
      console.log(`  ${round}: ${count}경기`);
    });
    
    // 플레이스홀더 vs 실제 참가자 분석
    const placeholders = Array.from(allPlayerNames).filter(name => 
      name.includes('Group') && (name.includes('1위') || name.includes('2위'))
    );
    
    const realPlayers = Array.from(allPlayerNames).filter(name => 
      !name.includes('Group') || (!name.includes('1위') && !name.includes('2위'))
    );
    
    console.log(`\n👥 참가자 분석:`);
    console.log(`  실제 참가자: ${realPlayers.length}명`);
    console.log(`  플레이스홀더: ${placeholders.length}개`);
    console.log(`  총 참가자: ${allPlayerNames.size}명`);
    
    if (placeholders.length > 0) {
      console.log('\n🔍 플레이스홀더 목록:');
      placeholders.forEach(ph => console.log(`  - ${ph}`));
    }
    
    // 예상 vs 실제 비교
    console.log(`\n🎯 결과 분석:`);
    console.log(`  예상 참가자: 32명`);
    console.log(`  실제 배치: ${realPlayers.length}명`);
    console.log(`  예상 그룹 진출자: 8명 (각 그룹 1명씩)`);
    console.log(`  실제 플레이스홀더: ${placeholders.length}개`);
    
    if (realPlayers.length === 32 && placeholders.length === 8) {
      console.log('✅ 브라켓 생성 성공!');
    } else {
      console.log('⚠️  아직 문제가 있습니다.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewBracket();