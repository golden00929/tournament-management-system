const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTournamentStatus() {
  try {
    console.log('🔧 Fixing tournament status...');

    // First find the tournament by name
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: '2025 신년 배드민턴 대회'
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    // Update tournament status to 'ongoing' so players can view bracket
    const updatedTournament = await prisma.tournament.update({
      where: {
        id: tournament.id
      },
      data: {
        status: 'ongoing'
      }
    });

    console.log(`✅ Updated tournament status to: ${updatedTournament.status}`);
    console.log(`📋 Tournament: ${updatedTournament.name} (ID: ${updatedTournament.id})`);

    // Also check if we need to update bracket format
    const bracket = await prisma.bracket.findFirst({
      where: {
        tournamentId: updatedTournament.id
      }
    });

    if (bracket && !bracket.bracketFormat) {
      await prisma.bracket.update({
        where: {
          id: bracket.id
        },
        data: {
          bracketFormat: 'single_elimination'
        }
      });
      console.log('✅ Updated bracket format to single_elimination');
    }

    console.log('🎉 Tournament status fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTournamentStatus();