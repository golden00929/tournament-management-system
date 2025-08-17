import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';

const router = express.Router();

// 회원가입 (기존 선수가 비밀번호 설정)
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
        error: 'MISSING_FIELDS'
      });
    }

    // 이메일로 기존 선수 찾기
    const existingPlayer = await prisma.player.findUnique({
      where: { email }
    });

    if (!existingPlayer) {
      return res.status(404).json({
        success: false,
        message: '등록되지 않은 선수입니다. 관리자에게 먼저 등록을 요청하세요.',
        error: 'PLAYER_NOT_FOUND'
      });
    }

    if (existingPlayer.password) {
      return res.status(400).json({
        success: false,
        message: '이미 가입된 계정입니다.',
        error: 'ALREADY_REGISTERED'
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12);
    const verifyToken = uuidv4();

    // 선수 정보 업데이트
    const updatedPlayer = await prisma.player.update({
      where: { id: existingPlayer.id },
      data: {
        password: hashedPassword,
        verifyToken,
        verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
        isVerified: true // 개발 환경에서는 바로 인증 완료
      }
    });

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        playerId: updatedPlayer.id,
        name: updatedPlayer.name,
        email: updatedPlayer.email,
        isVerified: updatedPlayer.isVerified
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
      error: 'REGISTER_ERROR'
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
        error: 'MISSING_CREDENTIALS'
      });
    }

    console.log('🔐 Player login attempt:', { email, passwordLength: password.length });

    // 선수 찾기
    const player = await prisma.player.findUnique({
      where: { email }
    });

    if (!player || !player.password) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        error: 'INVALID_CREDENTIALS'
      });
    }

    console.log('👤 Player found:', {
      id: player.id,
      email: player.email,
      name: player.name,
      isVerified: player.isVerified,
      hasPassword: !!player.password
    });

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, player.password);
    
    if (!isPasswordValid) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // 개발 환경에서는 이메일 인증 검사 스킵
    // if (!player.isVerified) {
    //   return res.status(401).json({
    //     success: false,
    //     message: '이메일 인증이 필요합니다.',
    //     error: 'EMAIL_NOT_VERIFIED'
    //   });
    // }

    // 마지막 로그인 시간 업데이트
    await prisma.player.update({
      where: { id: player.id },
      data: { lastLoginAt: new Date() }
    });

    // JWT 토큰 생성
    const token = generateToken({
      userId: player.id,
      email: player.email,
      role: 'player',
      name: player.name
    });

    console.log('✅ Player login successful:', player.email);

    res.json({
      success: true,
      message: '로그인되었습니다.',
      data: {
        token,
        player: {
          id: player.id,
          name: player.name,
          email: player.email,
          eloRating: player.eloRating,
          skillLevel: player.skillLevel,
          isVerified: player.isVerified
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

// 이메일 인증
router.put('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: '인증 토큰이 필요합니다.',
        error: 'MISSING_TOKEN'
      });
    }

    // 토큰으로 선수 찾기
    const player = await prisma.player.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!player) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않거나 만료된 인증 토큰입니다.',
        error: 'INVALID_TOKEN'
      });
    }

    // 이메일 인증 완료
    await prisma.player.update({
      where: { id: player.id },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null
      }
    });

    res.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      data: {
        playerId: player.id,
        email: player.email
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: '이메일 인증 중 오류가 발생했습니다.',
      error: 'VERIFICATION_ERROR'
    });
  }
});

// 비밀번호 재설정 요청
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: '이메일을 입력해주세요.',
        error: 'MISSING_EMAIL'
      });
    }

    const player = await prisma.player.findUnique({
      where: { email }
    });

    if (!player) {
      // 보안상 계정 존재 여부를 숨김
      return res.json({
        success: true,
        message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
      });
    }

    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후 만료

    await prisma.player.update({
      where: { id: player.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry
      }
    });

    // TODO: 실제 이메일 발송 로직 추가
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
      // 개발 환경에서만 토큰 반환
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 재설정 요청 중 오류가 발생했습니다.',
      error: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

// 비밀번호 재설정 실행
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '토큰과 새 비밀번호를 입력해주세요.',
        error: 'MISSING_FIELDS'
      });
    }

    // 토큰으로 선수 찾기
    const player = await prisma.player.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date()
        }
      }
    });

    if (!player) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않거나 만료된 재설정 토큰입니다.',
        error: 'INVALID_RESET_TOKEN'
      });
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 비밀번호 업데이트
    await prisma.player.update({
      where: { id: player.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null
      }
    });

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
      data: {
        playerId: player.id
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 재설정 중 오류가 발생했습니다.',
      error: 'RESET_PASSWORD_ERROR'
    });
  }
});

export default router;