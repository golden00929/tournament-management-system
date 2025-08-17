const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testParticipantsAPI() {
  try {
    const tournamentId = 'ca1d9ea3-6f3e-491a-962e-828bd48ee037';
    const limit = 200;
    const page = 1;
    
    console.log('=== API 테스트 시작 ===');
    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`Limit: ${limit}, Page: ${page}`);
    
    const skip = (page - 1) * limit;
    
    // 실제 API와 동일한 쿼리 실행
    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where: {
          tournamentId,
          isActive: true
        },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              birthYear: true,
              gender: true,
              province: true,
              district: true,
              eloRating: true,
              skillLevel: true,
              totalMatches: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { registrationDate: 'desc' }
      }),
      prisma.participant.count({
        where: {
          tournamentId,
          isActive: true
        }
      })
    ]);
    
    console.log(`\n=== 결과 ===`);
    console.log(`Total count: ${total}`);
    console.log(`Returned participants: ${participants.length}`);
    console.log(`Approved: ${participants.filter(p => p.approvalStatus === 'approved').length}`);
    console.log(`Pending: ${participants.filter(p => p.approvalStatus === 'pending').length}`);
    
    // API 응답 형태로 구성
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    const response = {
      success: true,
      data: {
        participants,
        pagination: {
          current: page,
          total: totalPages,
          count: total,
          hasNext,
          hasPrev,
          limit
        }
      }
    };
    
    console.log(`\n=== API 응답 구조 ===`);
    console.log(`data.participants.length: ${response.data.participants.length}`);
    console.log(`data.pagination.count: ${response.data.pagination.count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testParticipantsAPI();