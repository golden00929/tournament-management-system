import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 기존 관리자 확인
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: 'admin@tournament.com' }
  });

  if (!existingAdmin) {
    // 기본 관리자 계정 생성
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@tournament.com',
        password: hashedPassword,
        name: '시스템 관리자',
        role: 'admin',
        isActive: true,
      },
    });
    console.log('✅ 관리자 계정 생성:', admin.email);
  } else {
    console.log('✅ 관리자 계정이 이미 존재합니다:', existingAdmin.email);
  }

  // 테스트 선수 계정 확인 및 생성
  const existingPlayer = await prisma.player.findUnique({
    where: { email: 'testplayer@example.com' }
  });

  if (!existingPlayer) {
    // 테스트 선수 계정 생성
    const hashedPlayerPassword = await bcrypt.hash('testpass123', 12);
    const player = await prisma.player.create({
      data: {
        email: 'testplayer@example.com',
        password: hashedPlayerPassword,
        name: '테스트 선수',
        phone: '0123456789',
        birthYear: 1990,
        gender: 'male',
        province: 'Ho Chi Minh City',
        district: 'District 1',
        skillLevel: 'c_class',
        eloRating: 1200,
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });
    console.log('✅ 테스트 선수 계정 생성:', player.email);
  } else {
    console.log('✅ 테스트 선수 계정이 이미 존재합니다:', existingPlayer.email);
  }

  // 시스템 설정 생성
  const configs = [
    {
      key: 'DEFAULT_ELO_RATING',
      value: '1200',
      description: '신규 선수 기본 ELO 레이팅',
    },
    {
      key: 'ELO_K_FACTOR',
      value: '32',
      description: 'ELO 레이팅 K 팩터',
    },
    {
      key: 'MAX_PARTICIPANTS',
      value: '100',
      description: '대회 최대 참가자 수',
    },
  ];

  for (const config of configs) {
    const existing = await prisma.systemConfig.findUnique({
      where: { key: config.key }
    });
    
    if (!existing) {
      await prisma.systemConfig.create({ data: config });
      console.log(`✅ 시스템 설정 생성: ${config.key}`);
    }
  }

  console.log('🎉 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });