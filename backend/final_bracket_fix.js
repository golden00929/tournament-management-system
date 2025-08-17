const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function finalBracketFix() {
  try {
    console.log('=== 최종 브라켓 수정 ===');
    
    const tournament = await prisma.tournament.findFirst({
      where: {
        tournamentType: 'hybrid'
      }
    });
    
    if (!tournament) {
      console.log('하이브리드 대회가 없습니다.');
      return;
    }
    
    console.log(`대회: ${tournament.name}`);
    
    // 1. 모든 기존 브라켓과 매치 삭제
    console.log('\n🗑️  모든 기존 브라켓 삭제 중...');
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
    
    // 2. 참가자 목록 조회
    const participants = await prisma.participant.findMany({
      where: {
        tournamentId: tournament.id,
        approvalStatus: 'approved',
        isActive: true
      },
      include: {
        player: true
      }
    });
    
    console.log(`\n👥 승인된 참가자: ${participants.length}명`);
    
    // 3. 관리자 로그인
    console.log('\n🔐 관리자 로그인...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@tournament.com',
        password: 'admin123'
      })
    });
    
    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error('로그인 실패: ' + loginResult.message);
    }
    
    const token = loginResult.data.token;
    console.log('✅ 로그인 성공');
    
    // 4. 수정된 설정으로 새 브라켓 생성
    console.log('\n🔧 올바른 설정으로 브라켓 생성 중...');
    const bracketData = JSON.stringify({
      tournamentId: tournament.id,
      eventType: 'singles',
      name: '올바른 하이브리드 브라켓 (32명→8그룹→8강)',
      participantIds: participants.map(p => p.player.id),
      tournamentType: 'hybrid',
      groupSize: 4,
      advancersPerGroup: 1  // 이제 확실히 1로 설정!
    });
    
    const bracketResponse = await fetch('http://localhost:5000/api/brackets/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: bracketData
    });
    
    const bracketResult = await bracketResponse.json();
    if (!bracketResult.success) {
      throw new Error('브라켓 생성 실패: ' + bracketResult.message);
    }
    
    console.log('✅ 새 브라켓 생성 성공!');
    
    // 5. 결과 확인
    console.log('\n📊 최종 결과 확인...');
    
    const finalBrackets = await prisma.bracket.findMany({
      where: {
        tournamentId: tournament.id
      }
    });
    
    console.log(`생성된 브라켓: ${finalBrackets.length}개`);
    
    if (finalBrackets.length === 1) {
      const bracket = finalBrackets[0];
      console.log(`브라켓 이름: ${bracket.name}`);
      
      const matches = await prisma.match.findMany({
        where: {
          bracketId: bracket.id
        },
        select: {
          roundName: true,
          player1Name: true,
          player2Name: true
        }
      });
      
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
      
      console.log(`\n👥 최종 참가자 분석:`);
      console.log(`  실제 참가자: ${realPlayers.length}명`);
      console.log(`  진출자 플레이스홀더: ${placeholders.length}개`);
      console.log(`  총 매치: ${matches.length}개`);
      
      console.log(`\n🎯 결과 평가:`);
      if (realPlayers.length === 32 && placeholders.length === 8 && roundCounts['Group Stage'] === 48) {
        console.log('🎉 완벽한 성공!');
        console.log('   ✅ 32명 모든 참가자 배치');
        console.log('   ✅ 8명 진출자 (각 그룹 1명씩)');
        console.log('   ✅ 48개 그룹 스테이지 경기');
        console.log('   ✅ 프론트엔드에서 "총 32명 참가 • XX경기"가 올바르게 표시될 것');
      } else {
        console.log('⚠️  아직 문제가 남아있습니다:');
        console.log(`   - 실제 참가자: ${realPlayers.length}명 (예상: 32명)`);
        console.log(`   - 진출자: ${placeholders.length}명 (예상: 8명)`);
        console.log(`   - 그룹 매치: ${roundCounts['Group Stage'] || 0}개 (예상: 48개)`);
      }
    } else {
      console.log('⚠️  브라켓이 복수 개 생성되었습니다. 중복 생성 문제가 여전히 있습니다.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalBracketFix();