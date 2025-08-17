const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeDuplicateBracket() {
  try {
    console.log('=== 중복 브라켓 제거 ===');
    
    const tournament = await prisma.tournament.findFirst({
      where: {
        tournamentType: 'hybrid'
      }
    });
    
    if (!tournament) {
      console.log('하이브리드 대회가 없습니다.');
      return;
    }
    
    // 모든 브라켓 조회
    const brackets = await prisma.bracket.findMany({
      where: {
        tournamentId: tournament.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`전체 브라켓: ${brackets.length}개`);
    
    if (brackets.length <= 1) {
      console.log('중복 브라켓이 없습니다.');
      return;
    }
    
    // 가장 최근 브라켓(첫 번째)을 유지하고 나머지 삭제
    const keepBracket = brackets[0];
    const deleteBrackets = brackets.slice(1);
    
    console.log(`\n유지할 브라켓: "${keepBracket.name}" (ID: ${keepBracket.id})`);
    console.log(`삭제할 브라켓: ${deleteBrackets.length}개`);
    
    // 삭제할 브라켓들의 매치 먼저 삭제
    for (const bracket of deleteBrackets) {
      console.log(`\n🗑️  브라켓 "${bracket.name}" 삭제 중...`);
      
      // 매치 삭제
      const deleteMatchResult = await prisma.match.deleteMany({
        where: {
          bracketId: bracket.id
        }
      });
      console.log(`  - 매치 ${deleteMatchResult.count}개 삭제`);
      
      // 브라켓 삭제
      await prisma.bracket.delete({
        where: {
          id: bracket.id
        }
      });
      console.log(`  - 브라켓 삭제 완료`);
    }
    
    console.log('\n✅ 중복 브라켓 제거 완료');
    
    // 최종 확인
    const finalBrackets = await prisma.bracket.findMany({
      where: {
        tournamentId: tournament.id
      }
    });
    
    console.log(`\n📊 최종 브라켓 수: ${finalBrackets.length}개`);
    
    if (finalBrackets.length === 1) {
      const bracket = finalBrackets[0];
      const matchCount = await prisma.match.count({
        where: {
          bracketId: bracket.id
        }
      });
      
      const groupStageMatches = await prisma.match.count({
        where: {
          bracketId: bracket.id,
          roundName: 'Group Stage'
        }
      });
      
      console.log(`\n🎯 유지된 브라켓 분석:`);
      console.log(`  이름: ${bracket.name}`);
      console.log(`  전체 매치: ${matchCount}개`);
      console.log(`  그룹 스테이지: ${groupStageMatches}개`);
      console.log(`  기타 라운드: ${matchCount - groupStageMatches}개`);
      
      if (matchCount === 63 && groupStageMatches === 48) {
        console.log('\n🎉 완벽한 상태입니다!');
        console.log('   ✅ 32명 참가자 → 48개 그룹 매치 → 15개 토너먼트 매치');
        console.log('   ✅ 프론트엔드에서 "총 32명 참가 • 63경기"가 정확히 표시될 것입니다');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicateBracket();