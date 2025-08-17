const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRankingsAPI() {
  try {
    console.log('=== 순위표 API 테스트 ===');
    
    // 실제 API와 동일한 조건으로 쿼리
    const skillLevel = '';
    const province = '';
    const limitNum = 50;
    
    const where = {
      isActive: true,
      totalMatches: { gt: 0 } // 최소 1경기 이상한 선수만
    };

    if (skillLevel && skillLevel !== 'all') {
      where.skillLevel = skillLevel;
    }

    if (province) {
      where.province = province;
    }

    console.log('쿼리 조건:', where);
    console.log('Limit:', limitNum);

    const players = await prisma.player.findMany({
      where,
      select: {
        id: true,
        name: true,
        province: true,
        district: true,
        eloRating: true,
        skillLevel: true,
        totalMatches: true,
        wins: true,
        losses: true,
        consistencyIndex: true,
        performanceIndex: true,
        lastMatchDate: true,
        isActive: true
      },
      orderBy: [
        { performanceIndex: 'desc' },
        { eloRating: 'desc' },
        { totalMatches: 'desc' }
      ],
      take: limitNum
    });

    console.log('\n=== 결과 ===');
    console.log(`전체 조건에 맞는 선수 수: ${players.length}`);
    console.log('조건별 분석:');
    
    // 전체 활성 선수 수
    const totalActivePlayers = await prisma.player.count({
      where: { isActive: true }
    });
    console.log(`- 전체 활성 선수: ${totalActivePlayers}명`);
    
    // 1경기 이상한 선수 수  
    const playersWithMatches = await prisma.player.count({
      where: { 
        isActive: true,
        totalMatches: { gt: 0 }
      }
    });
    console.log(`- 1경기 이상한 선수: ${playersWithMatches}명`);
    
    // 0경기 선수 수
    const playersWithoutMatches = await prisma.player.count({
      where: { 
        isActive: true,
        totalMatches: 0
      }
    });
    console.log(`- 0경기 선수: ${playersWithoutMatches}명`);
    
    console.log('\n처음 5명:');
    players.slice(0, 5).forEach((p, i) => {
      console.log(`${i+1}. ${p.name} - ELO: ${p.eloRating}, 경기수: ${p.totalMatches}, 승: ${p.wins}, 패: ${p.losses}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRankingsAPI();