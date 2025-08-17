import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!', 12);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@tournament.com' },
    update: {},
    create: {
      email: 'admin@tournament.com',
      password: adminPassword,
      name: '시스템 관리자',
      role: 'admin',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample players
  const samplePlayers = [
    {
      name: '김철수',
      email: 'kim.cs@example.com',
      phone: '010-1234-5678',
      birthYear: 1990,
      gender: 'male',
      province: '서울특별시',
      district: '강남구',
      eloRating: 1800,
      skillLevel: 'b_class',
      consistencyIndex: 0.85,
      momentumScore: 15.0,
      performanceIndex: 1803.0,
    },
    {
      name: '이영희',
      email: 'lee.yh@example.com',
      phone: '010-2345-6789',
      birthYear: 1985,
      gender: 'female',
      province: '서울특별시',
      district: '서초구',
      eloRating: 1650,
      skillLevel: 'c_class',
      consistencyIndex: 0.92,
      momentumScore: 8.5,
      performanceIndex: 1661.7,
    },
    {
      name: '박민수',
      email: 'park.ms@example.com',
      phone: '010-3456-7890',
      birthYear: 1995,
      gender: 'male',
      province: '경기도',
      district: '수원시',
      eloRating: 1400,
      skillLevel: 'c_class',
      consistencyIndex: 0.73,
      momentumScore: -5.2,
      performanceIndex: 1392.7,
    },
    {
      name: '최지연',
      email: 'choi.jy@example.com',
      phone: '010-4567-8901',
      birthYear: 1992,
      gender: 'female',
      province: '부산광역시',
      district: '해운대구',
      eloRating: 1200,
      skillLevel: 'd_class',
      consistencyIndex: 0.65,
      momentumScore: 2.8,
      performanceIndex: 1206.5,
    },
    {
      name: '장동건',
      email: 'jang.dg@example.com',
      phone: '010-5678-9012',
      birthYear: 1988,
      gender: 'male',
      province: '인천광역시',
      district: '남동구',
      eloRating: 2100,
      skillLevel: 'b_class',
      consistencyIndex: 0.95,
      momentumScore: 22.3,
      performanceIndex: 2114.5,
    }
  ];

  const players = [];
  for (const playerData of samplePlayers) {
    const player = await prisma.player.upsert({
      where: { email: playerData.email },
      update: {},
      create: playerData,
    });
    players.push(player);

    // Create initial rating history
    await prisma.playerRatingHistory.create({
      data: {
        playerId: player.id,
        oldRating: playerData.eloRating,
        newRating: playerData.eloRating,
        ratingChange: 0,
        reason: 'initial_rating',
      }
    });
  }

  console.log(`✅ Created ${players.length} sample players`);

  // Create sample tournament (using upsert to prevent duplicates)
  const tournament = await prisma.tournament.upsert({
    where: { 
      name: '2025 신년 배드민턴 대회'
    },
    update: {},
    create: {
      name: '2025 신년 배드민턴 대회',
      description: '새해를 맞이하여 개최하는 배드민턴 대회입니다.',
      category: 'badminton',
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-16'),
      registrationStart: new Date('2025-01-15'),
      registrationEnd: new Date('2025-02-10'),
      location: '서울특별시 강남구',
      venue: '강남스포츠센터',
      maxParticipants: 64,
      minSkillLevel: 1000,
      maxSkillLevel: 2500,
      participantFee: 30000,
      organizerFee: 150000,
      pricingTier: 'standard',
      status: 'open',
      contactPhone: '02-1234-5678',
      contactEmail: 'contact@tournament.com',
      organizerInfo: '서울배드민턴협회',
    }
  });

  console.log('✅ Created sample tournament:', tournament.name);

  // Create sample participants for the tournament (with duplicate prevention)
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    
    // Check if participant already exists
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        tournamentId: tournament.id,
        playerId: player.id,
        eventType: 'singles'
      }
    });

    if (!existingParticipant) {
      await prisma.participant.create({
        data: {
          tournamentId: tournament.id,
          playerId: player.id,
          eventType: 'singles',
          approvalStatus: 'approved',
          paymentStatus: 'completed',
          registrationElo: player.eloRating,
        }
      });
    }
  }

  console.log(`✅ Created ${players.length} participants for the tournament`);

  // Create system configs
  const systemConfigs = [
    {
      key: 'DEFAULT_ELO_RATING',
      value: '1200',
      description: '신규 선수 기본 ELO 레이팅',
    },
    {
      key: 'ELO_K_FACTOR',
      value: '32',
      description: 'ELO 레이팅 계산에 사용하는 K 인수',
    },
    {
      key: 'MAX_SKILL_DIFF_LIMIT',
      value: '200',
      description: '같은 그룹 내 최대 실력 차이 제한',
    },
    {
      key: 'TOURNAMENT_BASIC_FEE',
      value: '50000',
      description: '기본형 대회 수수료',
    },
    {
      key: 'TOURNAMENT_STANDARD_FEE',
      value: '150000',
      description: '표준형 대회 수수료',
    },
    {
      key: 'TOURNAMENT_PREMIUM_FEE',
      value: '300000',
      description: '프리미엄 대회 수수료',
    }
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log('✅ Created system configurations');

  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('  Email: admin@tournament.com');
  console.log('  Password: admin123!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });