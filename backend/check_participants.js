const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkParticipants() {
  try {
    // 특정 하이브리드 대회 ID 확인
    const hybridTournamentId = 'ca1d9ea3-6f3e-491a-962e-828bd48ee037';
    
    // 대회 정보 확인
    const tournament = await prisma.tournament.findUnique({
      where: { id: hybridTournamentId },
      select: { id: true, name: true, maxParticipants: true }
    });
    
    if (!tournament) {
      console.log('하이브리드 대회를 찾을 수 없습니다.');
      return;
    }
    
    // 참가자 수 확인
    const participants = await prisma.participant.findMany({
      where: {
        tournamentId: hybridTournamentId,
        isActive: true
      },
      include: {
        player: {
          select: { name: true }
        }
      }
    });
    
    console.log(`\nTournament: ${tournament.name} (Max: ${tournament.maxParticipants})`);
    console.log(`Total participants: ${participants.length}`);
    console.log(`Approved participants: ${participants.filter(p => p.approvalStatus === 'approved').length}`);
    console.log(`Pending participants: ${participants.filter(p => p.approvalStatus === 'pending').length}`);
    
    // 상태별 참가자 이름 출력
    console.log('\nApproved participants:');
    participants
      .filter(p => p.approvalStatus === 'approved')
      .forEach((p, i) => {
        console.log(`${i+1}. ${p.player.name}`);
      });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParticipants();