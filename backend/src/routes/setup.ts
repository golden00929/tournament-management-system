import { Router } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import { env } from '../config/environment';

const router = Router();

// 데이터베이스 초기 설정 API (프로덕션에서 한 번만 실행)
router.post('/initialize', async (req, res) => {
  try {
    console.log('🚀 데이터베이스 초기화 시작...');

    // 기존 관리자 확인
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: 'admin@tournament.com' }
    });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: '데이터베이스가 이미 초기화되었습니다.',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          created: false
        }
      });
    }

    // 관리자 계정 생성
    const hashedPassword = await bcrypt.hash('admin123', env.BCRYPT_SALT_ROUNDS);
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@tournament.com',
        password: hashedPassword,
        name: '시스템 관리자',
        role: 'admin',
        isActive: true,
      },
    });

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
      }
    }

    console.log('✅ 데이터베이스 초기화 완료');

    res.json({
      success: true,
      message: '데이터베이스가 성공적으로 초기화되었습니다.',
      admin: {
        email: admin.email,
        name: admin.name,
        created: true
      }
    });

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    res.status(500).json({
      success: false,
      message: '데이터베이스 초기화에 실패했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 데이터베이스 상태 확인
router.get('/status', async (req, res) => {
  try {
    const adminCount = await prisma.admin.count();
    const playerCount = await prisma.player.count();
    const tournamentCount = await prisma.tournament.count();

    res.json({
      success: true,
      database: {
        connected: true,
        adminCount,
        playerCount,
        tournamentCount,
        initialized: adminCount > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '데이터베이스 상태 확인 실패',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 테스트 선수 계정 생성 (개발/테스트용)
router.post('/create-test-player', async (req, res) => {
  try {
    console.log('🧪 테스트 선수 계정 생성 시작...');

    // 기존 테스트 선수 확인
    const existingPlayer = await prisma.player.findUnique({
      where: { email: 'testplayer@example.com' }
    });

    if (existingPlayer) {
      return res.json({
        success: true,
        message: '테스트 선수 계정이 이미 존재합니다.',
        player: {
          email: existingPlayer.email,
          name: existingPlayer.name,
          created: false
        }
      });
    }

    // 테스트 선수 계정 생성
    const hashedPlayerPassword = await bcrypt.hash('testpass123', env.BCRYPT_SALT_ROUNDS);
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

    console.log('✅ 테스트 선수 계정 생성 완료:', player.email);

    res.json({
      success: true,
      message: '테스트 선수 계정이 성공적으로 생성되었습니다.',
      player: {
        email: player.email,
        name: player.name,
        created: true
      }
    });

  } catch (error) {
    console.error('❌ 테스트 선수 계정 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '테스트 선수 계정 생성에 실패했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 테스트 선수 계정 재생성 (bcrypt 호환성 문제 해결용)
router.post('/recreate-test-player', async (req, res) => {
  try {
    console.log('🔄 테스트 선수 계정 재생성 시작...');

    // 기존 테스트 선수 삭제
    const deletedPlayer = await prisma.player.deleteMany({
      where: { email: 'testplayer@example.com' }
    });

    console.log(`🗑️ 기존 테스트 선수 삭제됨: ${deletedPlayer.count}개`);

    // 새로운 테스트 선수 계정 생성 (올바른 bcrypt 사용)
    const hashedPlayerPassword = await bcrypt.hash('testpass123', env.BCRYPT_SALT_ROUNDS);
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

    console.log('✅ 테스트 선수 계정 재생성 완료:', player.email);

    res.json({
      success: true,
      message: '테스트 선수 계정이 성공적으로 재생성되었습니다.',
      player: {
        email: player.email,
        name: player.name,
        created: true,
        bcryptVersion: 'bcrypt'
      }
    });

  } catch (error) {
    console.error('❌ 테스트 선수 계정 재생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '테스트 선수 계정 재생성에 실패했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;