const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findMissingParticipants() {
  try {
    console.log('=== 누락된 참가자 찾기 ===');
    
    const tournament = await prisma.tournament.findFirst({
      where: {
        tournamentType: 'hybrid'
      }
    });
    
    if (!tournament) {
      console.log('하이브리드 대회가 없습니다.');
      return;
    }
    
    // 승인된 모든 참가자 목록
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
    
    console.log(`\n👥 승인된 참가자: ${approvedParticipants.length}명`);
    
    // 그룹 스테이지 매치에 포함된 참가자들
    const groupMatches = await prisma.match.findMany({
      where: {
        tournament: {
          id: tournament.id
        },
        roundName: 'Group Stage'
      },
      select: {
        player1Name: true,
        player2Name: true
      }
    });
    
    const groupParticipantNames = new Set();
    groupMatches.forEach(match => {
      if (match.player1Name && match.player1Name !== 'TBD') {
        groupParticipantNames.add(match.player1Name);
      }
      if (match.player2Name && match.player2Name !== 'TBD') {
        groupParticipantNames.add(match.player2Name);
      }
    });
    
    console.log(`📊 그룹 스테이지에 포함된 참가자: ${groupParticipantNames.size}명`);
    
    // 누락된 참가자 찾기
    const approvedNames = approvedParticipants.map(p => p.player.name);
    const missingParticipants = approvedNames.filter(name => !groupParticipantNames.has(name));
    
    console.log(`\n❌ 그룹 스테이지에서 누락된 참가자 (${missingParticipants.length}명):`);
    missingParticipants.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    
    // 중복 참가자 확인
    const nameCount = {};
    approvedNames.forEach(name => {
      nameCount[name] = (nameCount[name] || 0) + 1;
    });
    
    const duplicateNames = Object.entries(nameCount).filter(([name, count]) => count > 1);
    
    if (duplicateNames.length > 0) {
      console.log(`\n⚠️  중복된 이름의 참가자 (${duplicateNames.length}개):`);
      duplicateNames.forEach(([name, count]) => {
        console.log(`  ${name}: ${count}번 등록됨`);
      });
    } else {
      console.log('\n✅ 중복된 이름 없음');
    }
    
    // 실제 참가자 ID와 이름 매핑 확인
    console.log(`\n🔍 실제 데이터 분석:`);
    console.log(`승인된 참가자 목록:`);
    approvedParticipants.forEach((p, index) => {
      const isInGroup = groupParticipantNames.has(p.player.name);
      console.log(`  ${index + 1}. ${p.player.name} (ID: ${p.player.id}) ${isInGroup ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMissingParticipants();