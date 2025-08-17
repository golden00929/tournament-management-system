const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateTournamentApplications() {
  console.log('🏸 대회 참가 신청 데이터 생성 시작...');

  // 1. 활성 대회 목록 조회
  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ['open', 'ongoing'] }
    },
    select: {
      id: true,
      name: true,
      maxParticipants: true,
      minSkillLevel: true,
      maxSkillLevel: true,
      skillLevel: true,
      status: true
    }
  });

  if (tournaments.length === 0) {
    console.log('❌ 참가 가능한 대회가 없습니다.');
    return;
  }

  console.log(`📋 발견된 대회: ${tournaments.length}개`);
  tournaments.forEach(t => {
    console.log(`  - ${t.name} (${t.status}) - 최대 ${t.maxParticipants}명`);
  });

  // 2. 활성 선수 목록 조회
  const players = await prisma.player.findMany({
    where: {
      isActive: true,
      eloRating: { gt: 0 }
    },
    select: {
      id: true,
      name: true,
      eloRating: true,
      skillLevel: true
    },
    orderBy: { eloRating: 'desc' }
  });

  console.log(`👥 활성 선수: ${players.length}명`);

  // 3. 각 대회별로 참가 신청 생성
  for (const tournament of tournaments) {
    console.log(`\n🎯 ${tournament.name} 참가 신청 생성 중...`);

    // 해당 대회에 적합한 선수들 필터링
    let eligiblePlayers = players.filter(player => {
      // ELO 레이팅 범위 확인
      if (tournament.minSkillLevel && tournament.maxSkillLevel) {
        return player.eloRating >= tournament.minSkillLevel && 
               player.eloRating <= tournament.maxSkillLevel;
      }
      
      // skillLevel 기반 필터링
      if (tournament.skillLevel) {
        return player.skillLevel === tournament.skillLevel;
      }
      
      return true;
    });

    console.log(`   적합한 선수: ${eligiblePlayers.length}명`);

    // 이미 참가 신청한 선수들 제외
    const existingParticipants = await prisma.participant.findMany({
      where: {
        tournamentId: tournament.id,
        isActive: true
      },
      select: { playerId: true }
    });

    const existingPlayerIds = existingParticipants.map(p => p.playerId);
    eligiblePlayers = eligiblePlayers.filter(p => !existingPlayerIds.includes(p.id));

    console.log(`   신규 신청 가능: ${eligiblePlayers.length}명`);

    // 참가 신청할 선수 수 결정 (최대 참가자의 70-90% 랜덤)
    const maxApplications = Math.min(
      tournament.maxParticipants - existingParticipants.length,
      eligiblePlayers.length
    );
    
    const targetApplications = Math.floor(maxApplications * (0.7 + Math.random() * 0.2));
    
    if (targetApplications <= 0) {
      console.log(`   ⚠️  참가 신청할 수 없음 (이미 가득참 또는 적합한 선수 없음)`);
      continue;
    }

    // 랜덤하게 선수 선택
    const shuffledPlayers = [...eligiblePlayers].sort(() => Math.random() - 0.5);
    const selectedPlayers = shuffledPlayers.slice(0, targetApplications);

    console.log(`   🎲 선택된 선수: ${selectedPlayers.length}명`);

    // 참가 신청 생성
    const applications = [];
    for (const player of selectedPlayers) {
      const eventTypes = ['singles', 'doubles', 'mixed'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // 승인 상태 랜덤 결정 (70% 승인, 20% 대기, 10% 거부)
      const rand = Math.random();
      let approvalStatus;
      if (rand < 0.7) approvalStatus = 'approved';
      else if (rand < 0.9) approvalStatus = 'pending';
      else approvalStatus = 'rejected';

      // 결제 상태 (승인된 경우 80% 완료, 대기 중인 경우 50% 완료)
      let paymentStatus = 'pending';
      if (approvalStatus === 'approved' && Math.random() < 0.8) {
        paymentStatus = 'completed';
      } else if (approvalStatus === 'pending' && Math.random() < 0.5) {
        paymentStatus = 'completed';
      }

      // 등록일 (최근 30일 내 랜덤)
      const registrationDate = new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
      );

      applications.push({
        tournamentId: tournament.id,
        playerId: player.id,
        eventType,
        approvalStatus,
        paymentStatus,
        registrationDate,
        registrationElo: player.eloRating,
        isActive: true
      });
    }

    // 데이터베이스에 일괄 삽입
    try {
      await prisma.participant.createMany({
        data: applications
      });

      // 상태별 통계 출력
      const approved = applications.filter(a => a.approvalStatus === 'approved').length;
      const pending = applications.filter(a => a.approvalStatus === 'pending').length;
      const rejected = applications.filter(a => a.approvalStatus === 'rejected').length;
      const completed = applications.filter(a => a.paymentStatus === 'completed').length;

      console.log(`   ✅ 생성 완료: 승인 ${approved}명, 대기 ${pending}명, 거부 ${rejected}명`);
      console.log(`   💰 결제 완료: ${completed}명`);

    } catch (error) {
      console.error(`   ❌ 생성 실패:`, error.message);
    }
  }

  // 4. 전체 통계 출력
  console.log('\n📊 전체 참가 신청 통계:');
  
  const totalStats = await prisma.participant.groupBy({
    by: ['approvalStatus'],
    _count: { id: true },
    where: { isActive: true }
  });

  totalStats.forEach(stat => {
    const statusName = {
      'approved': '승인됨',
      'pending': '대기 중',
      'rejected': '거부됨'
    }[stat.approvalStatus];
    console.log(`  ${statusName}: ${stat._count.id}명`);
  });

  const paymentStats = await prisma.participant.groupBy({
    by: ['paymentStatus'],
    _count: { id: true },
    where: { isActive: true }
  });

  console.log('\n💰 결제 상태 통계:');
  paymentStats.forEach(stat => {
    const statusName = {
      'pending': '대기 중',
      'completed': '완료',
      'failed': '실패',
      'refunded': '환불'
    }[stat.paymentStatus];
    console.log(`  ${statusName}: ${stat._count.id}명`);
  });

  console.log('\n🎉 대회 참가 신청 데이터 생성 완료!');
}

async function main() {
  try {
    await generateTournamentApplications();
  } catch (error) {
    console.error('❌ 참가 신청 데이터 생성 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();