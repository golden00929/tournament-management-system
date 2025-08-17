const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkHybridBrackets() {
  try {
    console.log('=== 하이브리드 대회 브라켓 분석 ===');
    
    // 하이브리드 대회 찾기
    const tournament = await prisma.tournament.findFirst({
      where: {
        tournamentType: 'hybrid'
      },
      select: {
        id: true,
        name: true,
        tournamentType: true,
        maxParticipants: true
      }
    });
    
    if (!tournament) {
      console.log('하이브리드 대회가 없습니다.');
      return;
    }
    
    console.log(`대회: ${tournament.name} (ID: ${tournament.id})`);
    console.log(`대회 타입: ${tournament.tournamentType}`);
    console.log(`최대 참가자: ${tournament.maxParticipants}`);
    
    // 참가자 수 확인
    const participantCount = await prisma.participant.count({
      where: {
        tournamentId: tournament.id,
        approvalStatus: 'approved',
        isActive: true
      }
    });
    console.log(`승인된 참가자 수: ${participantCount}`);
    
    // 해당 대회의 모든 브라켓 조회
    const brackets = await prisma.bracket.findMany({
      where: {
        tournamentId: tournament.id
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
        matches: {
          select: {
            id: true,
            roundName: true,
            matchNumber: true,
            player1Name: true,
            player2Name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n브라켓 개수: ${brackets.length}`);
    
    brackets.forEach((bracket, index) => {
      console.log(`\n--- 브라켓 ${index + 1} ---`);
      console.log(`ID: ${bracket.id}`);
      console.log(`이름: ${bracket.name}`);
      console.log(`타입: ${bracket.type}`);
      console.log(`상태: ${bracket.status}`);
      console.log(`생성시간: ${bracket.createdAt}`);
      console.log(`매치 수: ${bracket.matches.length}`);
      
      // 참가자 수 계산
      const participants = new Set();
      bracket.matches.forEach(match => {
        if (match.player1Name && match.player1Name !== 'TBD') {
          participants.add(match.player1Name);
        }
        if (match.player2Name && match.player2Name !== 'TBD') {
          participants.add(match.player2Name);
        }
      });
      
      console.log(`참가자 수: ${participants.size}`);
      console.log(`완료된 매치: ${bracket.matches.filter(m => m.status === 'completed').length}`);
      
      // 라운드별 매치 분석
      const roundCounts = {};
      bracket.matches.forEach(match => {
        roundCounts[match.roundName] = (roundCounts[match.roundName] || 0) + 1;
      });
      
      console.log('라운드별 매치 수:');
      Object.entries(roundCounts).forEach(([round, count]) => {
        console.log(`  ${round}: ${count}경기`);
      });
    });
    
    // 브라켓 선택 로직 시뮬레이션 (프론트엔드 로직과 동일)
    console.log('\n=== 브라켓 선택 로직 시뮬레이션 ===');
    const bracketSelectionCandidates = brackets
      .filter(b => b.matches && b.matches.length > 0) // 매치가 있는 브라켓만
      .sort((a, b) => {
        // 1순위: 매치 수가 많은 것
        const matchCountDiff = (b.matches?.length || 0) - (a.matches?.length || 0);
        if (matchCountDiff !== 0) return matchCountDiff;
        // 2순위: 최근에 생성된 것
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    if (bracketSelectionCandidates.length > 0) {
      const selectedBracket = bracketSelectionCandidates[0];
      console.log(`선택된 브라켓: ${selectedBracket.name}`);
      console.log(`선택된 브라켓 매치 수: ${selectedBracket.matches.length}`);
      
      const selectedParticipants = new Set();
      selectedBracket.matches.forEach(match => {
        if (match.player1Name && match.player1Name !== 'TBD') {
          selectedParticipants.add(match.player1Name);
        }
        if (match.player2Name && match.player2Name !== 'TBD') {
          selectedParticipants.add(match.player2Name);
        }
      });
      console.log(`선택된 브라켓 참가자 수: ${selectedParticipants.size}`);
      
      // 예상 표시: "총 X명 참가 • Y경기 • Z경기 완료"
      const completedMatches = selectedBracket.matches.filter(m => m.status === 'completed').length;
      console.log(`\n🎯 최종 표시 예상: 총 ${selectedParticipants.size}명 참가 • ${selectedBracket.matches.length}경기 • ${completedMatches}경기 완료`);
      
      // 사용자가 보고한 문제와 비교
      console.log(`\n❗ 사용자 보고: 총 29명 참가 • 48경기`);
      console.log(`❗ 실제 계산: 총 ${selectedParticipants.size}명 참가 • ${selectedBracket.matches.length}경기`);
      if (selectedParticipants.size !== 29 || selectedBracket.matches.length !== 48) {
        console.log('⚠️  불일치 발견!');
      } else {
        console.log('✅ 일치함 - 다른 문제가 있을 수 있음');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHybridBrackets();