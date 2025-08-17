import { Router } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

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

export default router;