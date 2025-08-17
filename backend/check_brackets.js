const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBrackets() {
  try {
    console.log('=== 브라켓 데이터 분석 ===');
    
    // 첫 번째 대회 찾기
    const tournament = await prisma.tournament.findFirst({
      select: {
        id: true,
        name: true,
        tournamentType: true
      }
    });
    
    if (!tournament) {
      console.log('대회가 없습니다.');
      return;
    }
    
    console.log(`대회: ${tournament.name} (ID: ${tournament.id})`);
    console.log(`대회 타입: ${tournament.tournamentType}`);
    
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
      
      // 첫 5개 매치 정보
      console.log('첫 5개 매치:');
      bracket.matches.slice(0, 5).forEach(match => {
        console.log(`  ${match.roundName} #${match.matchNumber}: ${match.player1Name} vs ${match.player2Name} (${match.status})`);
      });
    });
    
    // 브라켓 선택 로직 시뮬레이션
    console.log('\n=== 브라켓 선택 로직 시뮬레이션 ===');
    const bracketSelectionCandidates = brackets
      .filter(b => b.matches && b.matches.length > 0)
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
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrackets();