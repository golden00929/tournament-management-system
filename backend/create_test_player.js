const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestPlayer() {
  try {
    console.log('🔧 Creating test player account...');

    // Create test player with authentication
    const hashedPassword = await bcrypt.hash('testpass123', 12);
    
    const testPlayer = await prisma.player.upsert({
      where: { email: 'testplayer@example.com' },
      update: {
        password: hashedPassword,
        isVerified: true,
        verifyToken: null,
      },
      create: {
        name: 'Test Player',
        email: 'testplayer@example.com',
        password: hashedPassword,
        phone: '010-1234-5678',
        birthYear: 1995,
        gender: 'male',
        province: '호치민시',
        district: 'Quận 1',
        address: '123 Test Street',
        emergencyContact: 'Test Contact',
        emergencyPhone: '010-9999-9999',
        eloRating: 1400,
        skillLevel: 'c_class',
        isVerified: true,
        verifyToken: null,
        registrationDate: new Date(),
        consistencyIndex: 0.75,
        momentumScore: 0.0,
        performanceIndex: 1400.0,
      }
    });

    console.log('✅ Test player created/updated:', testPlayer.name);
    console.log('📧 Email:', testPlayer.email);
    console.log('🔑 Password: testpass123');
    console.log('✅ Verified:', testPlayer.isVerified);

    // Check if player is a participant in the tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: '2025 신년 배드민턴 대회' }
    });

    if (tournament) {
      const existingParticipant = await prisma.participant.findFirst({
        where: {
          tournamentId: tournament.id,
          playerId: testPlayer.id
        }
      });

      if (!existingParticipant) {
        await prisma.participant.create({
          data: {
            tournamentId: tournament.id,
            playerId: testPlayer.id,
            eventType: 'singles',
            approvalStatus: 'approved',
            paymentStatus: 'completed',
            registrationElo: testPlayer.eloRating,
          }
        });
        console.log('✅ Test player added as participant to tournament');
      } else {
        console.log('✅ Test player is already a participant');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPlayer();