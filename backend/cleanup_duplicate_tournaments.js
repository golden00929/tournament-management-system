const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateTournaments() {
  try {
    console.log('🧹 Cleaning up duplicate tournaments...');

    // Find all tournaments with same name
    const duplicateTournaments = await prisma.tournament.findMany({
      where: {
        name: '2025 신년 배드민턴 대회'
      },
      orderBy: {
        createdAt: 'asc' // Keep the first one (oldest)
      }
    });

    console.log(`Found ${duplicateTournaments.length} tournaments with the same name`);

    if (duplicateTournaments.length <= 1) {
      console.log('✅ No duplicates found');
      return;
    }

    // Keep the first tournament and delete the rest
    const tournamentToKeep = duplicateTournaments[0];
    const tournamentsToDelete = duplicateTournaments.slice(1);

    console.log(`Keeping tournament ID: ${tournamentToKeep.id} (created: ${tournamentToKeep.createdAt})`);

    for (const tournament of tournamentsToDelete) {
      console.log(`Deleting duplicate tournament ID: ${tournament.id} (created: ${tournament.createdAt})`);
      
      // Delete related participants first
      await prisma.participant.deleteMany({
        where: {
          tournamentId: tournament.id
        }
      });

      // Delete related brackets
      await prisma.bracket.deleteMany({
        where: {
          tournamentId: tournament.id
        }
      });

      // Delete related matches
      await prisma.match.deleteMany({
        where: {
          tournamentId: tournament.id
        }
      });

      // Delete the tournament
      await prisma.tournament.delete({
        where: {
          id: tournament.id
        }
      });

      console.log(`✅ Deleted tournament ID: ${tournament.id}`);
    }

    console.log('🎉 Cleanup completed successfully!');
    console.log(`Remaining tournament: ${tournamentToKeep.name} (ID: ${tournamentToKeep.id})`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateTournaments();