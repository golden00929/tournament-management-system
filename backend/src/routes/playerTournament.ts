import express from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 선수가 참가 가능한 대회 목록 조회
router.get('/available', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log('🎾 대회 목록 조회 - User role:', req.user?.role, 'User ID:', req.user?.userId);
    
    if (req.user?.role !== 'player') {
      console.log('❌ 권한 거부 - role이 player가 아님:', req.user?.role);
      return res.status(403).json({
        success: false,
        message: '선수만 접근할 수 있습니다.',
        error: 'PLAYER_ONLY'
      });
    }

    const playerId = req.user.userId;

    // 선수 정보 조회
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        eloRating: true,
        skillLevel: true,
        isActive: true,
        isVerified: true
      }
    });

    // 개발 환경에서는 이메일 인증 요구사항 비활성화
    if (!player || !player.isActive) {
      return res.status(403).json({
        success: false,
        message: '대회 참가 권한이 없습니다. 계정 상태를 확인해주세요.',
        error: 'INELIGIBLE_PLAYER'
      });
    }

    // 참가 가능한 대회 조회
    const availableTournaments = await prisma.tournament.findMany({
      where: {
        status: 'open',
        registrationStart: { lte: new Date() },
        registrationEnd: { gte: new Date() },
        minSkillLevel: { lte: player.eloRating },
        maxSkillLevel: { gte: player.eloRating },
        // 이미 참가 신청한 대회는 제외
        participants: {
          none: {
            playerId: playerId,
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        startDate: true,
        endDate: true,
        registrationEnd: true,
        location: true,
        venue: true,
        maxParticipants: true,
        minSkillLevel: true,
        maxSkillLevel: true,
        skillLevel: true,
        participantFee: true,
        posterImage: true,
        contactPhone: true,
        contactEmail: true,
        organizerInfo: true,
        _count: {
          select: {
            participants: {
              where: {
                approvalStatus: 'approved',
                isActive: true
              }
            }
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    // 응답 데이터 가공
    const tournamentsWithStats = availableTournaments.map(tournament => ({
      ...tournament,
      currentParticipants: tournament._count.participants,
      availableSlots: tournament.maxParticipants - tournament._count.participants,
      daysUntilRegistrationEnd: Math.ceil(
        (new Date(tournament.registrationEnd).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
      ),
      playerEligible: player.eloRating >= tournament.minSkillLevel && 
                     player.eloRating <= tournament.maxSkillLevel
    }));

    res.json({
      success: true,
      data: {
        tournaments: tournamentsWithStats,
        playerInfo: {
          eloRating: player.eloRating,
          skillLevel: player.skillLevel
        }
      }
    });

  } catch (error) {
    console.error('Get available tournaments error:', error);
    res.status(500).json({
      success: false,
      message: '대회 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_AVAILABLE_TOURNAMENTS_ERROR'
    });
  }
});

// 대회 참가 신청
router.post('/:tournamentId/apply', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log('🎾 대회 참가 신청 - User role:', req.user?.role, 'User ID:', req.user?.userId);
    
    if (req.user?.role !== 'player') {
      console.log('❌ 권한 거부 - role이 player가 아님:', req.user?.role);
      return res.status(403).json({
        success: false,
        message: '선수만 접근할 수 있습니다.',
        error: 'PLAYER_ONLY'
      });
    }

    const { tournamentId } = req.params;
    const { eventType = 'singles', partnerPlayerId } = req.body;
    const playerId = req.user.userId;

    // 대회 정보 확인
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
        participantFee: true,
        _count: {
          select: {
            participants: {
              where: {
                approvalStatus: { in: ['pending', 'approved'] },
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    // 참가 신청 가능 여부 확인
    if (tournament.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: '참가 신청이 불가능한 대회입니다.',
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
        message: '참가 인원이 모두 찼습니다.',
        error: 'TOURNAMENT_FULL'
      });
    }

    // 선수 정보 확인
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        name: true,
        eloRating: true,
        isActive: true,
        isVerified: true
      }
    });

    // 개발 환경에서는 이메일 인증 요구사항 비활성화
    if (!player || !player.isActive) {
      return res.status(403).json({
        success: false,
        message: '대회 참가 권한이 없습니다.',
        error: 'INELIGIBLE_PLAYER'
      });
    }

    // ELO 레이팅 범위 확인
    if (player.eloRating < tournament.minSkillLevel || player.eloRating > tournament.maxSkillLevel) {
      return res.status(400).json({
        success: false,
        message: '참가 가능한 실력 범위를 벗어났습니다.',
        error: 'SKILL_LEVEL_MISMATCH'
      });
    }

    // 중복 신청 확인
    const existingParticipation = await prisma.participant.findFirst({
      where: {
        tournamentId,
        playerId,
        isActive: true
      }
    });

    if (existingParticipation) {
      return res.status(409).json({
        success: false,
        message: '이미 참가 신청한 대회입니다.',
        error: 'ALREADY_REGISTERED'
      });
    }

    // 복식인 경우 파트너 확인
    let partnerPlayer = null;
    if (eventType === 'doubles') {
      if (!partnerPlayerId) {
        return res.status(400).json({
          success: false,
          message: '복식 참가 시 파트너를 선택해주세요.',
          error: 'PARTNER_REQUIRED'
        });
      }

      partnerPlayer = await prisma.player.findUnique({
        where: { id: partnerPlayerId },
        select: {
          id: true,
          name: true,
          eloRating: true,
          isActive: true,
          isVerified: true
        }
      });

      // 개발 환경에서는 이메일 인증 요구사항 비활성화
      if (!partnerPlayer || !partnerPlayer.isActive) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 파트너입니다.',
          error: 'INVALID_PARTNER'
        });
      }

      // 파트너도 실력 범위 확인
      if (partnerPlayer.eloRating < tournament.minSkillLevel || 
          partnerPlayer.eloRating > tournament.maxSkillLevel) {
        return res.status(400).json({
          success: false,
          message: '파트너의 실력이 참가 가능 범위를 벗어났습니다.',
          error: 'PARTNER_SKILL_MISMATCH'
        });
      }
    }

    // 참가 신청 생성
    const participant = await prisma.participant.create({
      data: {
        tournamentId,
        playerId,
        eventType,
        partnerPlayerId: partnerPlayerId || undefined,
        registrationElo: player.eloRating,
        approvalStatus: 'pending',
        paymentStatus: 'pending'
      },
      include: {
        tournament: {
          select: {
            name: true,
            participantFee: true
          }
        },
        player: {
          select: {
            name: true,
            email: true
          }
        },
        partnerPlayer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`🎾 새 참가 신청: ${player.name} → ${tournament.name}`);

    res.status(201).json({
      success: true,
      message: '대회 참가 신청이 완료되었습니다. 승인을 기다려주세요.',
      data: {
        participantId: participant.id,
        tournament: {
          name: participant.tournament.name,
          participantFee: participant.tournament.participantFee
        },
        eventType: participant.eventType,
        approvalStatus: participant.approvalStatus,
        paymentStatus: participant.paymentStatus,
        registrationDate: participant.registrationDate,
        partner: partnerPlayer ? {
          name: partnerPlayer.name
        } : null
      }
    });

  } catch (error) {
    console.error('Tournament application error:', error);
    res.status(500).json({
      success: false,
      message: '대회 참가 신청 중 오류가 발생했습니다.',
      error: 'APPLICATION_ERROR'
    });
  }
});

// 선수의 참가 신청 내역 조회
router.get('/applications', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'player') {
      return res.status(403).json({
        success: false,
        message: '선수만 접근할 수 있습니다.',
        error: 'PLAYER_ONLY'
      });
    }

    const playerId = req.user.userId;
    const { status, limit = '20' } = req.query;

    const where: any = {
      playerId,
      isActive: true
    };

    if (status) {
      where.approvalStatus = status;
    }

    const applications = await prisma.participant.findMany({
      where,
      select: {
        id: true,
        eventType: true,
        approvalStatus: true,
        paymentStatus: true,
        registrationDate: true,
        registrationElo: true,
        tournament: {
          select: {
            id: true,
            name: true,
            category: true,
            startDate: true,
            endDate: true,
            location: true,
            venue: true,
            participantFee: true,
            status: true,
            posterImage: true
          }
        },
        partnerPlayer: {
          select: {
            id: true,
            name: true,
            eloRating: true
          }
        }
      },
      orderBy: { registrationDate: 'desc' },
      take: parseInt(limit as string, 10)
    });

    res.json({
      success: true,
      data: {
        applications,
        meta: {
          total: applications.length,
          playerId
        }
      }
    });

  } catch (error) {
    console.error('Get player applications error:', error);
    res.status(500).json({
      success: false,
      message: '참가 신청 내역 조회 중 오류가 발생했습니다.',
      error: 'GET_APPLICATIONS_ERROR'
    });
  }
});

// 참가 신청 취소
router.delete('/application/:participantId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'player') {
      return res.status(403).json({
        success: false,
        message: '선수만 접근할 수 있습니다.',
        error: 'PLAYER_ONLY'
      });
    }

    const { participantId } = req.params;
    const playerId = req.user.userId;

    // 참가 신청 확인
    const participant = await prisma.participant.findFirst({
      where: {
        id: participantId,
        playerId,
        isActive: true
      },
      include: {
        tournament: {
          select: {
            name: true,
            status: true,
            startDate: true
          }
        }
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: '참가 신청을 찾을 수 없습니다.',
        error: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // 취소 가능 여부 확인
    if (participant.approvalStatus === 'approved' && participant.tournament.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: '이미 진행 중인 대회의 참가 신청은 취소할 수 없습니다.',
        error: 'CANNOT_CANCEL_ONGOING'
      });
    }

    // 대회 시작 24시간 전까지만 취소 가능
    const hoursUntilStart = (new Date(participant.tournament.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursUntilStart < 24) {
      return res.status(400).json({
        success: false,
        message: '대회 시작 24시간 전까지만 취소할 수 있습니다.',
        error: 'CANCELLATION_DEADLINE_PASSED'
      });
    }

    // 참가 신청 비활성화 (완전 삭제하지 않고 기록 유지)
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        isActive: false,
        approvalStatus: 'rejected' // 취소된 신청으로 표시
      }
    });

    console.log(`🎾 참가 신청 취소: ${participant.tournament.name} - ${participantId}`);

    res.json({
      success: true,
      message: '대회 참가 신청이 취소되었습니다.',
      data: {
        participantId,
        tournamentName: participant.tournament.name
      }
    });

  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({
      success: false,
      message: '참가 신청 취소 중 오류가 발생했습니다.',
      error: 'CANCEL_APPLICATION_ERROR'
    });
  }
});

export default router;