const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugGroupAllocation() {
  try {
    console.log('=== 그룹 배치 로직 디버깅 ===');
    
    // 하이브리드 대회의 최신 브라켓 매치 분석
    const tournament = await prisma.tournament.findFirst({
      where: {
        tournamentType: 'hybrid'
      }
    });
    
    if (!tournament) {
      console.log('하이브리드 대회가 없습니다.');
      return;
    }
    
    // 그룹 스테이지 매치만 조회
    const groupMatches = await prisma.match.findMany({
      where: {
        tournament: {
          id: tournament.id
        },
        roundName: 'Group Stage'
      },
      select: {
        id: true,
        matchNumber: true,
        player1Name: true,
        player2Name: true
      },
      orderBy: {
        matchNumber: 'asc'
      }
    });
    
    console.log(`📊 그룹 스테이지 매치: ${groupMatches.length}개`);
    
    // 각 그룹별 참가자 분석
    const groups = {};
    const allParticipants = new Set();
    
    groupMatches.forEach(match => {
      // 매치에서 그룹 정보 추출 (매치 번호 기반으로 추정)
      const participants = [];
      if (match.player1Name && match.player1Name !== 'TBD') {
        participants.push(match.player1Name);
        allParticipants.add(match.player1Name);
      }
      if (match.player2Name && match.player2Name !== 'TBD') {
        participants.push(match.player2Name);
        allParticipants.add(match.player2Name);
      }
      
      participants.forEach(name => {
        if (!groups[name]) {
          groups[name] = [];
        }
        groups[name].push({
          matchNumber: match.matchNumber,
          opponent: participants.find(p => p !== name)
        });
      });
    });
    
    console.log(`\n👥 그룹 스테이지 참가자: ${allParticipants.size}명`);
    console.log(`예상 참가자: 32명`);
    console.log(`누락된 참가자: ${32 - allParticipants.size}명`);
    
    // 참가자별 경기 수 분석 (같은 그룹 내에서 몇 명과 경기하는지)
    const participantMatchCounts = {};
    Object.entries(groups).forEach(([name, matches]) => {
      participantMatchCounts[name] = matches.length;
    });
    
    console.log('\n📋 참가자별 그룹 스테이지 경기 수:');
    const matchCountDistribution = {};
    Object.values(participantMatchCounts).forEach(count => {
      matchCountDistribution[count] = (matchCountDistribution[count] || 0) + 1;
    });
    
    Object.entries(matchCountDistribution).forEach(([matchCount, playerCount]) => {
      console.log(`  ${matchCount}경기: ${playerCount}명`);
    });
    
    // 그룹별 분석 (각 참가자가 몇 명과 경기하는지로 그룹 크기 추정)
    console.log('\n🔍 그룹 크기 분석:');
    if (matchCountDistribution['3']) {
      console.log(`4명 그룹: ${matchCountDistribution['3']}명 (각자 3경기)`);
    }
    if (matchCountDistribution['2']) {
      console.log(`3명 그룹: ${matchCountDistribution['2']}명 (각자 2경기)`);
    }
    if (matchCountDistribution['1']) {
      console.log(`2명 그룹: ${matchCountDistribution['1']}명 (각자 1경기)`);
    }
    
    // 이론적 계산
    console.log('\n🧮 이론적 분석:');
    console.log('32명을 8그룹(4명씩)으로 나누면:');
    console.log('- 각 그룹: 4명 → 6경기 (4C2)');
    console.log('- 총 그룹 스테이지 경기: 8그룹 × 6경기 = 48경기');
    console.log('- 각 참가자당 경기: 3경기 (같은 그룹 내 다른 3명과)');
    
    console.log(`\n실제 결과:`);
    console.log(`- 그룹 스테이지 경기: ${groupMatches.length}경기`);
    console.log(`- 참가자 수: ${allParticipants.size}명`);
    console.log(`- 평균 경기수: ${Object.values(participantMatchCounts).length > 0 ? (Object.values(participantMatchCounts).reduce((a, b) => a + b, 0) / Object.values(participantMatchCounts).length).toFixed(1) : 0}경기`);
    
    // 누락된 참가자 찾기
    const approvedParticipants = await prisma.participant.findMany({
      where: {
        tournamentId: tournament.id,
        approvalStatus: 'approved',
        isActive: true
      },
      include: {
        player: true
      }
    });
    
    const allApprovedNames = approvedParticipants.map(p => p.player.name);
    const missingParticipants = allApprovedNames.filter(name => !allParticipants.has(name));
    
    if (missingParticipants.length > 0) {
      console.log(`\n❌ 그룹 스테이지에 누락된 참가자 (${missingParticipants.length}명):`);
      missingParticipants.forEach(name => console.log(`  - ${name}`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGroupAllocation();