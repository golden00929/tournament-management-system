import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', { email, passwordLength: password?.length });

    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
        error: 'MISSING_CREDENTIALS'
      });
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
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    
    if (!passwordMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: 'LOGIN_ERROR'
    });
  }
});

// Get current user info
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
      error: 'GET_USER_ERROR'
    });
  }
});

// Create initial admin account (only if no admins exist)
router.post('/init-admin', async (req, res) => {
  try {
    // Check if any admin exists
    const adminCount = await prisma.admin.count();
    if (adminCount > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 관리자 계정이 존재합니다.',
        error: 'ADMIN_EXISTS'
      });
    }

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '필수 정보를 모두 입력해주세요.',
        error: 'MISSING_FIELDS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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
  } catch (error) {
    console.error('Init admin error:', error);
    res.status(500).json({
      success: false,
      message: '관리자 계정 생성 중 오류가 발생했습니다.',
      error: 'INIT_ADMIN_ERROR'
    });
  }
});

// Refresh token (extend current session)
router.post('/refresh', authenticate, async (req: AuthRequest, res) => {
  try {
    const newToken = generateToken({
      userId: req.user!.userId,
      email: req.user!.email,
      role: req.user!.role,
    });

    res.json({
      success: true,
      message: '토큰이 갱신되었습니다.',
      data: { token: newToken }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: '토큰 갱신 중 오류가 발생했습니다.',
      error: 'REFRESH_TOKEN_ERROR'
    });
  }
});

export default router;