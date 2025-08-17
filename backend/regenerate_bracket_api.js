const https = require('http');

async function regenerateBracket() {
  try {
    console.log('=== API를 통한 브라켓 재생성 ===');
    
    // 1. 관리자 로그인
    console.log('🔐 관리자 로그인 중...');
    const loginData = JSON.stringify({
      email: 'admin@tournament.com',
      password: 'admin123'
    });
    
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: loginData
    });
    
    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error('로그인 실패: ' + loginResult.message);
    }
    
    const token = loginResult.data.token;
    console.log('✅ 로그인 성공');
    
    // 2. 하이브리드 대회 ID 조회
    console.log('\n📋 대회 목록 조회 중...');
    const tournamentsResponse = await fetch('http://localhost:5000/api/tournaments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const tournamentsResult = await tournamentsResponse.json();
    if (!tournamentsResult.success) {
      throw new Error('대회 목록 조회 실패: ' + tournamentsResult.message);
    }
    
    const hybridTournament = tournamentsResult.data.tournaments.find(t => t.tournamentType === 'hybrid');
    if (!hybridTournament) {
      throw new Error('하이브리드 대회를 찾을 수 없습니다.');
    }
    
    console.log(`✅ 하이브리드 대회 발견: ${hybridTournament.name} (ID: ${hybridTournament.id})`);
    
    // 3. 참가자 목록 조회
    console.log('\n👥 참가자 목록 조회 중...');
    const participantsResponse = await fetch(`http://localhost:5000/api/participants/tournament/${hybridTournament.id}?limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const participantsResult = await participantsResponse.json();
    if (!participantsResult.success) {
      throw new Error('참가자 목록 조회 실패: ' + participantsResult.message);
    }
    
    const approvedParticipants = participantsResult.data.participants.filter(p => p.approvalStatus === 'approved');
    console.log(`✅ 승인된 참가자: ${approvedParticipants.length}명`);
    
    // 4. 브라켓 생성 (구성된 대진표)
    console.log('\n🔧 새 브라켓 생성 중...');
    const bracketData = JSON.stringify({
      tournamentId: hybridTournament.id,
      eventType: 'singles',
      name: '수정된 하이브리드 브라켓',
      participantIds: approvedParticipants.map(p => p.player.id),
      tournamentType: 'hybrid',
      groupSize: 4,
      advancersPerGroup: 1  // 이제 1로 설정!
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
    
    console.log('✅ 브라켓 생성 성공!');
    console.log(`브라켓 ID: ${bracketResult.data.id}`);
    console.log(`브라켓 이름: ${bracketResult.data.name}`);
    
    // 5. 생성된 브라켓 확인
    console.log('\n📊 생성된 브라켓 확인 중...');
    const checkResponse = await fetch(`http://localhost:5000/api/tournaments/${hybridTournament.id}/bracket`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const checkResult = await checkResponse.json();
    if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
      const latestBracket = checkResult.data[checkResult.data.length - 1]; // 최신 브라켓
      console.log(`✅ 브라켓 확인 완료`);
      console.log(`매치 수: ${latestBracket.matches ? latestBracket.matches.length : 0}경기`);
      
      if (latestBracket.matches) {
        // 라운드별 매치 분석
        const roundCounts = {};
        const allPlayerNames = new Set();
        
        latestBracket.matches.forEach(match => {
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
        
        console.log(`\n👥 참가자 분석:`);
        console.log(`  실제 참가자: ${realPlayers.length}명`);
        console.log(`  플레이스홀더: ${placeholders.length}개`);
        console.log(`  총 참가자: ${allPlayerNames.size}명`);
        
        console.log(`\n🎯 최종 결과:`);
        if (realPlayers.length === 32 && placeholders.length === 8) {
          console.log('✅ 완벽! 32명 참가자 + 8명 진출자 플레이스홀더');
          console.log('🎉 이제 프론트엔드에서 올바른 "총 32명 참가 • XX경기 • 0경기 완료"가 표시될 것입니다!');
        } else {
          console.log('⚠️  아직 문제가 있습니다:');
          console.log(`   - 실제 참가자: ${realPlayers.length}명 (예상: 32명)`);
          console.log(`   - 플레이스홀더: ${placeholders.length}개 (예상: 8개)`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// fetch polyfill for Node.js
const fetch = require('node-fetch');

regenerateBracket();