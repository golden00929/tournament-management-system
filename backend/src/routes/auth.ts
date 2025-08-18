import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateTokenPair, verifyRefreshToken, JwtPayload } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import { env } from '../config/environment';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError, AuthError, NotFoundError, SystemError } from '../utils/AppError';

const router = express.Router();

// Admin login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('🔐 Login attempt:', { email, passwordLength: password?.length });

  if (!email || !password) {
    console.log('❌ Missing credentials');
    throw new ValidationError('이메일과 비밀번호를 입력해주세요.');
  }

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
      }
    });

    console.log('👤 Admin found:', admin ? { 
      id: admin.id, 
      email: admin.email, 
      isActive: admin.isActive,
      passwordHash: admin.password?.substring(0, 20) + '...'
    } : null);

    if (!admin || !admin.isActive) {
      console.log('❌ Admin not found or inactive');
      throw AuthError.loginFailed();
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    
    if (!passwordMatch) {
      console.log('❌ Password mismatch');
      throw AuthError.loginFailed();
    }

    // Generate JWT token pair (access + refresh)
    const tokenPair = generateTokenPair({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    });

    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        }
      }
    });
}));

// Get current user info
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    }
  });

  if (!admin) {
    throw NotFoundError.admin(req.user!.userId);
  }

    res.json({
      success: true,
      data: admin
    });
}));

// Create initial admin account (only if no admins exist)
router.post('/init-admin', asyncHandler(async (req, res) => {
  // Check if any admin exists
  const adminCount = await prisma.admin.count();
  if (adminCount > 0) {
    throw new ValidationError('이미 관리자 계정이 존재합니다.', { adminCount });
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw new ValidationError('필수 정보를 모두 입력해주세요.', {
      missingFields: { email: !email, password: !password, name: !name }
    });
  }

    // Hash password using environment config
    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    res.status(201).json({
      success: true,
      message: '관리자 계정이 생성되었습니다.',
      data: admin
    });
}));

/**
 * 리프레시 토큰을 사용한 액세스 토큰 갱신
 * 더 이상 인증 미들웨어를 사용하지 않고, 리프레시 토큰으로만 검증합니다.
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new ValidationError('리프레시 토큰이 필요합니다.');
  }

  // 리프레시 토큰 검증
  const decoded = verifyRefreshToken(refreshToken);
  
  // 사용자가 여전히 존재하고 활성화되어 있는지 확인
  let user: any = null;
  
  if (decoded.role === 'admin') {
    user = await prisma.admin.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    });
  } else if (decoded.role === 'player') {
    user = await prisma.player.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isVerified: true,
      }
    });
    
    if (user) {
      user.role = 'player';
    }
  }

  if (!user || !user.isActive) {
    throw new AuthError('유효하지 않은 사용자입니다.', 401, 'INVALID_USER');
  }

  // 새로운 토큰 쌍 생성
  const newTokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  res.json({
    success: true,
    message: '토큰이 갱신되었습니다.',
    data: {
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
      expiresIn: newTokenPair.expiresIn
    }
  });
}));

export default router;