const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBracketStatus() {
  try {
    console.log('🔍 Checking tournament and bracket status...');

    // Get the tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: '2025 신년 배드민턴 대회'
      },
      include: {
        participants: {
          include: {
            player: true
          }
        }
      }
    });

    if (!tournament) {
      console.log('❌ No tournament found');
      return;
    }

    console.log(`📋 Tournament: ${tournament.name} (ID: ${tournament.id})`);
    console.log(`👥 Participants: ${tournament.participants.length}`);
    console.log(`📊 Status: ${tournament.status}`);

    // Check if bracket exists
    const brackets = await prisma.bracket.findMany({
      where: {
        tournamentId: tournament.id
      }
    });

    console.log(`🎯 Brackets found: ${brackets.length}`);

    if (brackets.length > 0) {
      for (const bracket of brackets) {
        console.log(`  - Bracket ID: ${bracket.id}`);
        console.log(`  - Format: ${bracket.bracketFormat}`);
        console.log(`  - Status: ${bracket.status}`);
        console.log(`  - Created: ${bracket.createdAt}`);
        
        // Check matches for this bracket
        const matches = await prisma.match.findMany({
          where: {
            bracketId: bracket.id
          }
        });
        console.log(`  - Matches: ${matches.length}`);
      }
    } else {
      console.log('⚠️  No brackets found for this tournament');
      
      // Check approved participants
      const approvedParticipants = tournament.participants.filter(p => p.approvalStatus === 'approved');
      console.log(`✅ Approved participants: ${approvedParticipants.length}`);
      
      if (approvedParticipants.length >= 4) {
        console.log('💡 Sufficient participants to create bracket');
      } else {
        console.log('❌ Insufficient participants (need at least 4)');
      }
    }

    console.log('\n📊 Participant details:');
    tournament.participants.forEach((participant, index) => {
      console.log(`  ${index + 1}. ${participant.player.name} - ${participant.approvalStatus} - ${participant.paymentStatus}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBracketStatus();