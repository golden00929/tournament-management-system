#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestPlayer {
  name: string;
  email: string;
  phone: string;
  birthYear: number;
  birthDate: Date;
  gender: string;
  province: string;
  district: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  skillLevel: string;
  eloRating: number;
}

/**
 * Generate 100 test players with realistic data distribution
 */
async function generateTestPlayers(): Promise<void> {
  console.log('🎯 Generating 100 test players for large-scale simulation...');

  const provinces = ['하노이', '호치민', '다낭', '하이퐁', '껀터', '푸옥', '나트랑', '후에'];
  const districts = ['District 1', 'District 2', 'District 3', 'Ba Dinh', 'Dong Da', 'Hai Ba Trung', 'Cau Giay', 'Thanh Xuan'];
  const maleNames = [
    'Nguyen Van An', 'Tran Duc Minh', 'Le Hoang Long', 'Pham Thanh Son',
    'Hoang Van Duc', 'Vu Minh Tuan', 'Do Thanh Tung', 'Bui Van Hieu',
    'Dang Quoc Hung', 'Ngo Van Tam', 'Ly Duc Nam', 'Truong Van Phong',
    'Cao Minh Hai', 'Luu Van Thang', 'Mac Duc Vinh', 'To Van Dung',
    'Dinh Thanh Lam', 'Duong Van Kien', 'Bach Minh Duc', 'Trinh Van Hoa'
  ];
  
  const femaleNames = [
    'Nguyen Thi Lan', 'Tran Thi Hoa', 'Le Thi Mai', 'Pham Thi Linh',
    'Hoang Thi Thu', 'Vu Thi Nga', 'Do Thi Huong', 'Bui Thi Yen',
    'Dang Thi Phuong', 'Ngo Thi Hong', 'Ly Thi Van', 'Truong Thi Thanh',
    'Cao Thi Minh', 'Luu Thi Ha', 'Mac Thi Loan', 'To Thi Dieu',
    'Dinh Thi Kim', 'Duong Thi Thuy', 'Bach Thi Anh', 'Trinh Thi Xuan'
  ];

  // Realistic skill level distribution
  const skillDistribution = [
    { level: 'a_class', count: 5, eloRange: [2500, 3000] },   // 5% - Expert
    { level: 'b_class', count: 15, eloRange: [2000, 2499] }, // 15% - Advanced  
    { level: 'c_class', count: 50, eloRange: [1500, 1999] }, // 50% - Intermediate
    { level: 'd_class', count: 30, eloRange: [1000, 1499] }  // 30% - Beginner
  ];

  const players: TestPlayer[] = [];

  // Generate players based on skill distribution
  for (const skillGroup of skillDistribution) {
    for (let i = 0; i < skillGroup.count; i++) {
      const isMale = Math.random() > 0.4; // 60% male, 40% female (realistic for badminton)
      const nameList = isMale ? maleNames : femaleNames;
      const baseName = nameList[Math.floor(Math.random() * nameList.length)];
      const uniqueName = `${baseName} ${players.length + 1}`;
      
      // Generate realistic birth date (18-50 years old)
      const age = Math.floor(Math.random() * 32) + 18; // 18-50 years
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - age);
      birthDate.setMonth(Math.floor(Math.random() * 12));
      birthDate.setDate(Math.floor(Math.random() * 28) + 1);

      // Generate ELO rating within range with some variation
      const [minElo, maxElo] = skillGroup.eloRange;
      const eloRating = Math.floor(Math.random() * (maxElo - minElo + 1)) + minElo;

      const player: TestPlayer = {
        name: uniqueName,
        email: `player${players.length + 1}@test.com`,
        phone: `+84${Math.floor(Math.random() * 900000000) + 100000000}`,
        birthYear: birthDate.getFullYear(),
        birthDate,
        gender: isMale ? 'male' : 'female',
        province: provinces[Math.floor(Math.random() * provinces.length)],
        district: districts[Math.floor(Math.random() * districts.length)],
        emergencyContact: `Emergency Contact ${players.length + 1}`,
        emergencyPhone: `+84${Math.floor(Math.random() * 900000000) + 100000000}`,
        skillLevel: skillGroup.level,
        eloRating
      };

      players.push(player);
    }
  }

  console.log(`📊 Player distribution by skill level:`);
  skillDistribution.forEach(group => {
    console.log(`  ${group.level}: ${group.count} players (ELO ${group.eloRange[0]}-${group.eloRange[1]})`);
  });

  // Insert players into database
  try {
    console.log('💾 Inserting players into database...');
    
    for (const player of players) {
      await prisma.player.create({
        data: player
      });
    }

    console.log(`✅ Successfully created ${players.length} test players!`);

    // Show statistics
    const genderStats = {
      male: players.filter(p => p.gender === 'male').length,
      female: players.filter(p => p.gender === 'female').length
    };

    const provinceStats = provinces.reduce((acc, province) => {
      acc[province] = players.filter(p => p.province === province).length;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n📈 Generated player statistics:`);
    console.log(`  Gender: ${genderStats.male} male, ${genderStats.female} female`);
    console.log(`  Provinces:`, provinceStats);
    console.log(`  Average ELO: ${Math.round(players.reduce((sum, p) => sum + p.eloRating, 0) / players.length)}`);

  } catch (error) {
    console.error('❌ Error creating test players:', error);
    throw error;
  }
}

/**
 * Create a large-scale tournament for testing
 */
async function createLargeScaleTournament(): Promise<string> {
  console.log('\n🏆 Creating large-scale tournament for 100 participants...');

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name: '대규모 테스트 대회 - 100명 참가',
        description: '통합 테스트 및 성능 최적화를 위한 100명 규모의 시뮬레이션 대회입니다.',
        category: 'badminton',
        startDate: new Date(),
        endDate: new Date(),
        registrationStart: new Date(),
        registrationEnd: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        location: 'Hanoi, Vietnam',
        venue: '하노이 배드민턴 센터',
        maxParticipants: 100,
        participantFee: 50000,
        tournamentType: 'single_elimination',
        status: 'open',
        skillDiffLimit: 300,
        contactPhone: '+84123456789',
        contactEmail: 'test-admin@tournament.com',
        rulesDocument: `
# 대규모 테스트 대회 규정

## 경기 형식
- 단일 토너먼트
- 3세트 2승제
- 21점 듀스 룰

## 코트 배정
- 총 8개 코트 동시 운영
- 경기당 평균 45분 소요
- 코트간 15분 휴식

## 성능 테스트 목표
- 100명 동시 참가자 처리
- 실시간 스케줄링 최적화
- AI 기반 경기 배정
- WebSocket 실시간 통신
        `
      }
    });

    console.log(`✅ Created tournament: ${tournament.name} (ID: ${tournament.id})`);
    return tournament.id;

  } catch (error) {
    console.error('❌ Error creating tournament:', error);
    throw error;
  }
}

/**
 * Register all players as participants
 */
async function registerAllParticipants(tournamentId: string): Promise<void> {
  console.log('\n👥 Registering all players as tournament participants...');

  try {
    const players = await prisma.player.findMany({
      where: {
        email: {
          contains: '@test.com'
        }
      }
    });

    console.log(`Found ${players.length} test players to register`);

    // Register players in batches to avoid overwhelming the system
    const batchSize = 10;
    let registered = 0;

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (player) => {
        await prisma.participant.create({
          data: {
            tournamentId,
            playerId: player.id,
            registrationDate: new Date(),
            approvalStatus: 'approved', // Auto-approve for testing
            paymentStatus: 'completed', // Auto-complete payment for testing
            registrationElo: player.eloRating
          }
        });
      }));

      registered += batch.length;
      console.log(`  Registered batch: ${registered}/${players.length} players`);
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Successfully registered ${registered} participants!`);

  } catch (error) {
    console.error('❌ Error registering participants:', error);
    throw error;
  }
}

/**
 * Generate performance test data
 */
async function generatePerformanceTestData(): Promise<void> {
  console.log('🚀 Starting large-scale tournament simulation data generation...\n');

  try {
    // Check if test data already exists
    const existingPlayers = await prisma.player.count({
      where: {
        email: {
          contains: '@test.com'
        }
      }
    });

    if (existingPlayers > 0) {
      console.log(`⚠️  Found ${existingPlayers} existing test players. Cleaning up first...`);
      
      // Clean up existing test data
      await prisma.participant.deleteMany({
        where: {
          player: {
            email: {
              contains: '@test.com'
            }
          }
        }
      });

      await prisma.player.deleteMany({
        where: {
          email: {
            contains: '@test.com'
          }
        }
      });

      await prisma.tournament.deleteMany({
        where: {
          name: {
            contains: '대규모 테스트 대회'
          }
        }
      });

      console.log('🧹 Cleaned up existing test data');
    }

    // Generate fresh test data
    await generateTestPlayers();
    const tournamentId = await createLargeScaleTournament();
    await registerAllParticipants(tournamentId);

    console.log('\n🎉 Large-scale simulation data generation completed!');
    console.log(`\n📋 Summary:`);
    console.log(`  - Created 100 test players with realistic skill distribution`);
    console.log(`  - Created large-scale tournament (ID: ${tournamentId})`);
    console.log(`  - Registered all players as approved participants`);
    console.log(`  - Ready for performance testing and AI optimization`);
    
    console.log(`\n🔗 Next steps:`);
    console.log(`  1. Use tournament ID ${tournamentId} for AI schedule optimization`);
    console.log(`  2. Test real-time WebSocket communications with 100 participants`);
    console.log(`  3. Measure AI response times under load`);
    console.log(`  4. Validate multi-court scheduling optimization`);

  } catch (error) {
    console.error('💥 Error in performance test data generation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  generatePerformanceTestData();
}

export { generatePerformanceTestData, generateTestPlayers, createLargeScaleTournament, registerAllParticipants };