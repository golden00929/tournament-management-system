import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: JwtPayload & {
    id: string;
    name: string;
    isActive: boolean;
  };
  body: any;
  params: any;
  query: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid Bearer token found');
      res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.',
        error: 'NO_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted, length:', token.length);
    
    try {
      const decoded = verifyToken(token);
      console.log('Token decoded successfully:', decoded.userId);
      
      // Verify user still exists and is active (admin or player)
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
        
        // 선수의 경우 role을 추가
        if (user) {
          user.role = 'player';
        }
      }

      if (!user || !user.isActive) {
        console.log('User validation failed:', { 
          user: !!user, 
          isActive: user?.isActive,
          isVerified: user?.isVerified,
          role: decoded.role
        });
        res.status(401).json({
          success: false,
          message: '유효하지 않은 사용자입니다.',
          error: 'INVALID_USER'
        });
        return;
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        id: user.id,
        name: user.name,
        isActive: user.isActive,
      };

      console.log('Authentication successful for user:', user.email);
      next();
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError);
      res.status(401).json({
        success: false,
        message: '인증 토큰이 유효하지 않습니다.',
        error: 'INVALID_TOKEN'
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: '인증 중 오류가 발생했습니다.',
      error: 'AUTH_ERROR'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
        error: 'NO_AUTH'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '권한이 부족합니다.',
        error: 'INSUFFICIENT_PERMISSION'
      });
      return;
    }

    next();
  };
};