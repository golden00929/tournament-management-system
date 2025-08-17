const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testBracketIntegration() {
  try {
    console.log('🔍 Testing bracket integration...');
    
    // Get tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: '2025 신년 배드민턴 대회' }
    });
    
    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }
    
    console.log('✅ Tournament found:', tournament.id);
    console.log('📊 Tournament status:', tournament.status);
    
    // Check if bracket exists
    const brackets = await prisma.bracket.findMany({
      where: { tournamentId: tournament.id }
    });
    
    console.log('🎯 Brackets found:', brackets.length);
    
    if (brackets.length === 0) {
      console.log('⚠️ No brackets found - this is the issue!');
      console.log('💡 Solution: Create a bracket for this tournament in admin panel');
      
      // Check participants
      const participants = await prisma.participant.findMany({
        where: { 
          tournamentId: tournament.id,
          approvalStatus: 'approved'
        }
      });
      
      console.log('👥 Approved participants:', participants.length);
      
      if (participants.length >= 4) {
        console.log('✅ Enough participants to create bracket (4+ needed)');
      } else {
        console.log('❌ Not enough participants for bracket creation');
      }
    } else {
      // Test API endpoint
      console.log('🌐 Testing API endpoint...');
      
      try {
        const response = await axios.get(`http://localhost:5000/api/public/tournament/${tournament.id}/bracket`);
        console.log('✅ API Response:', response.data.success ? 'Success' : 'Failed');
        console.log('📝 Brackets returned:', response.data.data?.brackets?.length || 0);
      } catch (apiError) {
        console.log('❌ API Error:', apiError.response?.data?.message || apiError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBracketIntegration();