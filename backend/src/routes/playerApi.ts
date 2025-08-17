import express from 'express';
import { prisma } from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 모든 라우트에 선수 인증 필요
router.use(authenticate);
router.use(requireRole(['player']));

// 내 프로필 조회
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const playerId = req.user!.userId;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthYear: true,
        birthDate: true,
        gender: true,
        province: true,
        district: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        eloRating: true,
        skillLevel: true,
        consistencyIndex: true,
        momentumScore: true,
        performanceIndex: true,
        totalMatches: true,
        wins: true,
        losses: true,
        lastMatchDate: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: '선수 정보를 찾을 수 없습니다.',
        error: 'PLAYER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Get player profile error:', error);
    res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다.',
      error: 'GET_PROFILE_ERROR'
    });
  }
});

// 프로필 수정
router.put('/profile', async (req: AuthRequest, res) => {
  try {
    const playerId = req.user!.userId;
    const {
      phone,
      birthDate,
      address,
      emergencyContact,
      emergencyPhone
    } = req.body;

    // 수정 가능한 필드만 허용
    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (address !== undefined) updateData.address = address;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (emergencyPhone !== undefined) updateData.emergencyPhone = emergencyPhone;

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true
      }
    });

    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      data: updatedPlayer
    });
  } catch (error) {
    console.error('Update player profile error:', error);
    res.status(500).json({
      success: false,
      message: '프로필 수정 중 오류가 발생했습니다.',
      error: 'UPDATE_PROFILE_ERROR'
    });
  }
});

// 내 참가 신청 목록
router.get('/participations', async (req: AuthRequest, res) => {
  try {
    const playerId = req.user!.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { playerId };
    if (status) {
      where.approvalStatus = status;
    }

    const participations = await prisma.participant.findMany({
      where,
      select: {
        id: true,
        eventType: true,
        registrationElo: true,
        approvalStatus: true,
        paymentStatus: true,
        registrationDate: true,
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            location: true,
            venue: true,
            participantFee: true,
            status: true
          }
        }
      },
      orderBy: { registrationDate: 'desc' },
      skip,
      take: limitNum
    });

    const total = await prisma.participant.count({ where });

    res.json({
      success: true,
      data: {
        participations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get player participations error:', error);
    res.status(500).json({
      success: false,
      message: '참가 신청 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_PARTICIPATIONS_ERROR'
    });
  }
});

// 토너먼트 참가 신청
router.post('/participate', async (req: AuthRequest, res) => {
  try {
    const playerId = req.user!.userId;
    const { tournamentId, eventType = 'singles', partnerPlayerId } = req.body;

    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        message: '토너먼트 ID가 필요합니다.',
        error: 'MISSING_TOURNAMENT_ID'
      });
    }

    // 토너먼트 존재 및 참가 가능 여부 확인
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        status: true,
        registrationStart: true,
        registrationEnd: true,
        maxParticipants: true,
        minSkillLevel: true,
        maxSkillLevel: true,
        _count: {
          select: {
            participants: {
              where: { approvalStatus: 'approved' }
            }
          }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '토너먼트를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    if (tournament.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: '현재 참가 신청을 받지 않는 토너먼트입니다.',
        error: 'REGISTRATION_CLOSED'
      });
    }

    const now = new Date();
    if (now < tournament.registrationStart || now > tournament.registrationEnd) {
      return res.status(400).json({
        success: false,
        message: '참가 신청 기간이 아닙니다.',
        error: 'REGISTRATION_PERIOD_INVALID'
      });
    }

    if (tournament._count.participants >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: '참가 신청이 마감되었습니다.',
        error: 'TOURNAMENT_FULL'
      });
    }

    // 선수 정보 조회
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, name: true, eloRating: true, isActive: true }
    });

    if (!player || !player.isActive) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 선수 계정입니다.',
        error: 'INVALID_PLAYER'
      });
    }

    // ELO 레이팅 제한 확인
    if (player.eloRating < tournament.minSkillLevel || player.eloRating > tournament.maxSkillLevel) {
      return res.status(400).json({
        success: false,
        message: `이 토너먼트는 ELO ${tournament.minSkillLevel}~${tournament.maxSkillLevel} 범위의 선수만 참가할 수 있습니다.`,
        error: 'ELO_REQUIREMENT_NOT_MET'
      });
    }

    // 중복 참가 확인
    const existingParticipation = await prisma.participant.findUnique({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId
        }
      }
    });

    if (existingParticipation) {
      return res.status(409).json({
        success: false,
        message: '이미 이 토너먼트에 참가 신청했습니다.',
        error: 'ALREADY_REGISTERED'
      });
    }

    // 복식의 경우 파트너 확인
    let partnerPlayer = null;
    if (eventType === 'doubles') {
      if (!partnerPlayerId) {
        return res.status(400).json({
          success: false,
          message: '복식 참가 시 파트너 선수 ID가 필요합니다.',
          error: 'MISSING_PARTNER'
        });
      }

      partnerPlayer = await prisma.player.findUnique({
        where: { id: partnerPlayerId },
        select: { id: true, name: true, eloRating: true, isActive: true }
      });

      if (!partnerPlayer || !partnerPlayer.isActive) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 파트너 선수입니다.',
          error: 'INVALID_PARTNER'
        });
      }
    }

    // 참가 신청 생성
    const participation = await prisma.participant.create({
      data: {
        tournamentId,
        playerId,
        eventType,
        partnerPlayerId: partnerPlayerId || null,
        registrationElo: player.eloRating,
        approvalStatus: 'pending',
        paymentStatus: 'pending'
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            participantFee: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '참가 신청이 완료되었습니다. 승인을 기다려주세요.',
      data: participation
    });
  } catch (error) {
    console.error('Tournament participation error:', error);
    res.status(500).json({
      success: false,
      message: '참가 신청 중 오류가 발생했습니다.',
      error: 'PARTICIPATION_ERROR'
    });
  }
});

// 참가 신청 취소
router.delete('/participate/:participationId', async (req: AuthRequest, res) => {
  try {
    const playerId = req.user!.userId;
    const { participationId } = req.params;

    // 참가 신청 확인
    const participation = await prisma.participant.findUnique({
      where: { id: participationId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            registrationEnd: true
          }
        }
      }
    });

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: '참가 신청을 찾을 수 없습니다.',
        error: 'PARTICIPATION_NOT_FOUND'
      });
    }

    if (participation.playerId !== playerId) {
      return res.status(403).json({
        success: false,
        message: '본인의 참가 신청만 취소할 수 있습니다.',
        error: 'UNAUTHORIZED_CANCELLATION'
      });
    }

    // 취소 가능 여부 확인
    if (participation.tournament.status === 'ongoing' || participation.tournament.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '진행 중이거나 완료된 토너먼트의 참가 신청은 취소할 수 없습니다.',
        error: 'CANCELLATION_NOT_ALLOWED'
      });
    }

    // 참가 신청 삭제
    await prisma.participant.delete({
      where: { id: participationId }
    });

    res.json({
      success: true,
      message: '참가 신청이 취소되었습니다.',
    });
  } catch (error) {
    console.error('Cancel participation error:', error);
    res.status(500).json({
      success: false,
      message: '참가 신청 취소 중 오류가 발생했습니다.',
      error: 'CANCEL_PARTICIPATION_ERROR'
    });
  }
});

// 내 경기 일정
router.get('/matches', async (req: AuthRequest, res) => {
  try {
    const playerId = req.user!.userId;
    const { status, tournamentId } = req.query;

    const where: any = {
      OR: [
        { player1Id: playerId },
        { player2Id: playerId }
      ]
    };

    if (status) {
      where.status = status;
    }

    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    const matches = await prisma.match.findMany({
      where,
      select: {
        id: true,
        roundName: true,
        matchNumber: true,
        player1Name: true,
        player2Name: true,
        player1Score: true,
        player2Score: true,
        winnerId: true,
        courtNumber: true,
        scheduledTime: true,
        actualStartTime: true,
        actualEndTime: true,
        status: true,
        tournament: {
          select: {
            id: true,
            name: true,
            location: true,
            venue: true
          }
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Get player matches error:', error);
    res.status(500).json({
      success: false,
      message: '경기 일정 조회 중 오류가 발생했습니다.',
      error: 'GET_MATCHES_ERROR'
    });
  }
});

// 내 레이팅 히스토리
router.get('/rating-history', async (req: AuthRequest, res) => {
  try {
    const playerId = req.user!.userId;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const ratingHistory = await prisma.playerRatingHistory.findMany({
      where: { playerId },
      select: {
        id: true,
        oldRating: true,
        newRating: true,
        ratingChange: true,
        reason: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    const total = await prisma.playerRatingHistory.count({
      where: { playerId }
    });

    res.json({
      success: true,
      data: {
        ratingHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get rating history error:', error);
    res.status(500).json({
      success: false,
      message: '레이팅 히스토리 조회 중 오류가 발생했습니다.',
      error: 'GET_RATING_HISTORY_ERROR'
    });
  }
});

export default router;