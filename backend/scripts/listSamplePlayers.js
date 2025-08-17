const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listTopPlayers() {
  console.log('🏸 상위 선수 10명 목록:\n');
  
  const topPlayers = await prisma.player.findMany({
    where: { isActive: true },
    select: {
      name: true,
      email: true,
      skillLevel: true,
      eloRating: true,
      province: true,
      district: true,
      isVerified: true
    },
    orderBy: { eloRating: 'desc' },
    take: 10
  });
  
  console.log('순위 | 이름 | 이메일 | 등급 | ELO | 지역 | 인증');
  console.log(''.padEnd(100, '-'));
  
  topPlayers.forEach((player, index) => {
    const skillName = {
      'a_class': 'Group A',
      'b_class': 'Group B', 
      'c_class': 'Group C',
      'd_class': 'Group D'
    }[player.skillLevel] || player.skillLevel;
    
    const verified = player.isVerified ? '✅' : '❌';
    
    console.log(`${String(index + 1).padStart(2)} | ${player.name.padEnd(20)} | ${player.email.padEnd(25)} | ${skillName.padEnd(7)} | ${String(player.eloRating).padStart(4)} | ${(player.province + ' ' + player.district).padEnd(15)} | ${verified}`);
  });
  
  console.log('\n💡 로그인 정보:');
  console.log('   비밀번호: player123');
  console.log('   이메일: 위 목록의 이메일 주소 사용');
  
  // 각 등급별 통계
  console.log('\n📊 등급별 선수 분포:');
  const stats = await prisma.player.groupBy({
    by: ['skillLevel'],
    _count: { id: true },
    where: { isActive: true }
  });
  
  stats.forEach(stat => {
    const levelName = {
      'a_class': 'Group A (Expert)',
      'b_class': 'Group B (Advanced)', 
      'c_class': 'Group C (Intermediate)',
      'd_class': 'Group D (Beginner)'
    }[stat.skillLevel] || `Unknown (${stat.skillLevel})`;
    console.log(`   ${levelName}: ${stat._count.id}명`);
  });
}

async function main() {
  try {
    await listTopPlayers();
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();