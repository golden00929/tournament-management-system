import express from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// Get participants for a tournament
router.get('/tournament/:tournamentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    const {
      page = '1',
      limit = '20',
      search = '',
      approvalStatus,
      paymentStatus,
      eventType,
      sortBy = 'registrationDate',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      tournamentId,
      isActive: true
    };

    // Search by player name
    if (search) {
      where.player = {
        name: { contains: search as string, mode: 'insensitive' }
      };
    }

    // Filter by status
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (eventType) where.eventType = eventType;

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        include: {
          player: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              birthYear: true,
              gender: true,
              province: true,
              district: true,
              eloRating: true,
              skillLevel: true,
              totalMatches: true
            }
          },
          partnerPlayer: {
            select: {
              id: true,
              name: true,
              eloRating: true,
              skillLevel: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy
      }),
      prisma.participant.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      success: true,
      data: {
        participants,
        pagination: {
          current: pageNum,
          total: totalPages,
          count: total,
          hasNext,
          hasPrev,
          limit: limitNum,
        }
      }
    });
  } catch (error) {
    console.error('Get tournament participants error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_PARTICIPANTS_ERROR'
    });
  }
});

// Register a participant for a tournament
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      tournamentId,
      playerId,
      eventType = 'singles',
      partnerPlayerId
    } = req.body;

    console.log('=== PARTICIPANT REGISTRATION DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('tournamentId:', tournamentId);
    console.log('playerId:', playerId);
    console.log('eventType:', eventType);

    if (!tournamentId || !playerId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: '대회 ID와 선수 ID는 필수입니다.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if tournament exists and is open for registration
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        status: true,
        maxParticipants: true,
        minSkillLevel: true,
        maxSkillLevel: true,
        skillLevel: true,  // 추가: 전체/특정 실력 수준 허용 여부
        registrationStart: true,
        registrationEnd: true,
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    console.log('Tournament found:', {
      status: tournament.status,
      maxParticipants: tournament.maxParticipants,
      minSkillLevel: tournament.minSkillLevel,
      maxSkillLevel: tournament.maxSkillLevel
    });

    // 관리자 여부 확인
    const isAdmin = req.user?.role === 'admin';
    
    // 대진표 생성 여부 확인
    const existingBrackets = await prisma.bracket.findMany({
      where: { tournamentId },
      select: { id: true, name: true, status: true }
    });
    
    const hasBrackets = existingBrackets.length > 0;
    console.log('🎯 대진표 생성 상태:', { hasBrackets, bracketCount: existingBrackets.length });

    // 관리자는 대회 상태와 대진표 생성 여부에 관계없이 참가자를 추가할 수 있음
    if (!isAdmin && tournament.status !== 'open') {
      console.log('❌ Tournament status not open for non-admin:', tournament.status);
      return res.status(400).json({
        success: false,
        message: `현재 참가 신청이 불가능한 대회입니다. (상태: ${tournament.status})`,
        error: 'REGISTRATION_NOT_AVAILABLE'
      });
    }
    
    // 일반 사용자는 대진표가 생성된 후에는 참가 신청 불가
    if (!isAdmin && hasBrackets) {
      console.log('❌ Brackets already exist for non-admin');
      return res.status(400).json({
        success: false,
        message: '대진표가 이미 생성되어 참가 신청이 마감되었습니다.',
        error: 'REGISTRATION_CLOSED_BRACKETS_EXIST'
      });
    }
    
    console.log('✅ Tournament status check passed. Admin:', isAdmin, 'Status:', tournament.status, 'HasBrackets:', hasBrackets);

    // 관리자가 아닌 경우에만 등록 기간 체크
    if (!isAdmin) {
      const now = new Date();
      if (now < tournament.registrationStart || now > tournament.registrationEnd) {
        console.log('❌ Outside registration period for non-admin');
        return res.status(400).json({
          success: false,
          message: '참가 신청 기간이 아닙니다.',
          error: 'OUTSIDE_REGISTRATION_PERIOD'
        });
      }
    }
    
    console.log('✅ Registration period check passed. Admin:', isAdmin);

    // Check participant limit by counting manually
    const participantCount = await prisma.participant.count({
      where: { tournamentId, isActive: true }
    });
    
    if (participantCount >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: '참가자 정원이 초과되었습니다.',
        error: 'PARTICIPANT_LIMIT_EXCEEDED'
      });
    }

    // Check if player exists and get their info
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        name: true,
        eloRating: true,
        skillLevel: true,
        isActive: true
      }
    });

    if (!player || !player.isActive) {
      return res.status(404).json({
        success: false,
        message: '선수를 찾을 수 없습니다.',
        error: 'PLAYER_NOT_FOUND'
      });
    }

    console.log('=== SKILL LEVEL CHECK ===');
    console.log('Player:', player.name, 'ELO:', player.eloRating);
    console.log('Tournament requirements - Min:', tournament.minSkillLevel, 'Max:', tournament.maxSkillLevel);
    console.log('Tournament skillLevel setting:', tournament.skillLevel);
    
    // Check skill level requirements - skip if tournament allows 'all' skill levels
    if (tournament.skillLevel !== 'all' && 
        (player.eloRating < tournament.minSkillLevel || player.eloRating > tournament.maxSkillLevel)) {
      console.log('❌ Skill level mismatch - Player ELO:', player.eloRating, 'not in range:', tournament.minSkillLevel, '-', tournament.maxSkillLevel);
      return res.status(400).json({
        success: false,
        message: `선수의 실력 수준(ELO: ${player.eloRating})이 대회 참가 조건(${tournament.minSkillLevel}-${tournament.maxSkillLevel})에 맞지 않습니다.`,
        error: 'SKILL_LEVEL_MISMATCH'
      });
    }
    
    console.log('✅ Skill level check passed');

    // Check if already registered
    const existingParticipant = await prisma.participant.findUnique({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId
        }
      }
    });

    if (existingParticipant && existingParticipant.isActive) {
      return res.status(409).json({
        success: false,
        message: '이미 등록된 선수입니다.',
        error: 'ALREADY_REGISTERED'
      });
    }

    // Validate partner for doubles
    let partnerPlayer = null;
    if (eventType === 'doubles') {
      if (!partnerPlayerId) {
        return res.status(400).json({
          success: false,
          message: '복식 경기는 파트너 선수를 지정해야 합니다.',
          error: 'PARTNER_REQUIRED'
        });
      }

      partnerPlayer = await prisma.player.findUnique({
        where: { id: partnerPlayerId },
        select: { id: true, name: true, eloRating: true, isActive: true }
      });

      if (!partnerPlayer || !partnerPlayer.isActive) {
        return res.status(404).json({
          success: false,
          message: '파트너 선수를 찾을 수 없습니다.',
          error: 'PARTNER_NOT_FOUND'
        });
      }
    }

    // Create participant record
    const participant = await prisma.participant.create({
      data: {
        tournamentId,
        playerId,
        eventType,
        partnerPlayerId: eventType === 'doubles' ? partnerPlayerId : null,
        registrationElo: player.eloRating,
        approvalStatus: 'pending',
        paymentStatus: 'pending'
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            eloRating: true,
            skillLevel: true
          }
        },
        partnerPlayer: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '참가 신청이 완료되었습니다.',
      data: participant
    });
  } catch (error) {
    console.error('Register participant error:', error);
    res.status(500).json({
      success: false,
      message: '참가 신청 중 오류가 발생했습니다.',
      error: 'REGISTER_PARTICIPANT_ERROR'
    });
  }
});

// Get single participant
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            birthYear: true,
            gender: true,
            province: true,
            district: true,
            eloRating: true,
            skillLevel: true,
            totalMatches: true,
            wins: true,
            losses: true
          }
        },
        partnerPlayer: {
          select: {
            id: true,
            name: true,
            email: true,
            eloRating: true,
            skillLevel: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
            category: true,
            startDate: true,
            endDate: true,
            participantFee: true
          }
        }
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: '참가자를 찾을 수 없습니다.',
        error: 'PARTICIPANT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Get participant error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 정보 조회 중 오류가 발생했습니다.',
      error: 'GET_PARTICIPANT_ERROR'
    });
  }
});

// Update participant approval status
router.patch('/:id/approval', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 승인 상태입니다.',
        error: 'INVALID_APPROVAL_STATUS'
      });
    }

    // 관리자가 승인하면 결제도 자동으로 완료 처리 (대진표 생성을 위해)
    const updateData: any = { approvalStatus };
    if (approvalStatus === 'approved') {
      updateData.paymentStatus = 'completed';
      console.log('✅ 승인과 동시에 결제 상태도 completed로 설정');
    }

    const participant = await prisma.participant.update({
      where: { id },
      data: updateData,
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: '참가자 승인 상태가 변경되었습니다.',
      data: participant
    });
  } catch (error) {
    console.error('Update participant approval error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 승인 상태 변경 중 오류가 발생했습니다.',
      error: 'UPDATE_APPROVAL_ERROR'
    });
  }
});

// Update participant payment status
router.patch('/:id/payment', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['pending', 'completed', 'failed', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 결제 상태입니다.',
        error: 'INVALID_PAYMENT_STATUS'
      });
    }

    const participant = await prisma.participant.update({
      where: { id },
      data: { paymentStatus },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: '결제 상태가 변경되었습니다.',
      data: participant
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: '결제 상태 변경 중 오류가 발생했습니다.',
      error: 'UPDATE_PAYMENT_ERROR'
    });
  }
});

// Update participant group assignment
router.patch('/:id/group', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { assignedGroup, seedNumber } = req.body;

    const participant = await prisma.participant.update({
      where: { id },
      data: {
        assignedGroup,
        seedNumber: seedNumber ? parseInt(seedNumber) : null
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            eloRating: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: '참가자 그룹 배정이 완료되었습니다.',
      data: participant
    });
  } catch (error) {
    console.error('Update participant group error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 그룹 배정 중 오류가 발생했습니다.',
      error: 'UPDATE_GROUP_ERROR'
    });
  }
});

// Remove participant (soft delete)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.participant.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: '참가자가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 삭제 중 오류가 발생했습니다.',
      error: 'DELETE_PARTICIPANT_ERROR'
    });
  }
});

// Bulk approve participants
router.patch('/tournament/:tournamentId/bulk-approve', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    const { participantIds, approvalStatus } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '참가자 ID 목록이 필요합니다.',
        error: 'MISSING_PARTICIPANT_IDS'
      });
    }

    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 승인 상태입니다.',
        error: 'INVALID_APPROVAL_STATUS'
      });
    }

    // 관리자가 승인하면 결제도 자동으로 완료 처리 (대진표 생성을 위해)
    const updateData: any = { approvalStatus };
    if (approvalStatus === 'approved') {
      updateData.paymentStatus = 'completed';
      console.log('✅ 대량 승인과 동시에 결제 상태도 completed로 설정');
    }

    const result = await prisma.participant.updateMany({
      where: {
        id: { in: participantIds },
        tournamentId,
        isActive: true
      },
      data: updateData
    });

    res.json({
      success: true,
      message: `${result.count}명의 참가자 상태가 변경되었습니다.`,
      data: { updatedCount: result.count }
    });
  } catch (error) {
    console.error('Bulk approve participants error:', error);
    res.status(500).json({
      success: false,
      message: '일괄 승인 처리 중 오류가 발생했습니다.',
      error: 'BULK_APPROVE_ERROR'
    });
  }
});

// Get tournament participant statistics
router.get('/tournament/:tournamentId/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;

    const participants = await prisma.participant.findMany({
      where: { tournamentId, isActive: true },
      include: {
        player: {
          select: {
            eloRating: true,
            skillLevel: true,
            province: true,
            gender: true
          }
        }
      }
    });

    const stats = {
      total: participants.length,
      byApprovalStatus: {
        pending: participants.filter(p => p.approvalStatus === 'pending').length,
        approved: participants.filter(p => p.approvalStatus === 'approved').length,
        rejected: participants.filter(p => p.approvalStatus === 'rejected').length,
      },
      byPaymentStatus: {
        pending: participants.filter(p => p.paymentStatus === 'pending').length,
        completed: participants.filter(p => p.paymentStatus === 'completed').length,
        failed: participants.filter(p => p.paymentStatus === 'failed').length,
        refunded: participants.filter(p => p.paymentStatus === 'refunded').length,
      },
      bySkillLevel: {
        beginner: participants.filter(p => p.player.skillLevel === 'beginner').length,
        intermediate: participants.filter(p => p.player.skillLevel === 'intermediate').length,
        advanced: participants.filter(p => p.player.skillLevel === 'advanced').length,
        expert: participants.filter(p => p.player.skillLevel === 'expert').length,
      },
      byGender: {
        male: participants.filter(p => p.player.gender === 'male').length,
        female: participants.filter(p => p.player.gender === 'female').length,
      },
      byEventType: {
        singles: participants.filter(p => p.eventType === 'singles').length,
        doubles: participants.filter(p => p.eventType === 'doubles').length,
      },
      ratingDistribution: participants.length > 0 ? {
        average: Math.round(participants.reduce((sum, p) => sum + p.player.eloRating, 0) / participants.length),
        min: Math.min(...participants.map(p => p.player.eloRating)),
        max: Math.max(...participants.map(p => p.player.eloRating)),
        median: participants.sort((a, b) => a.player.eloRating - b.player.eloRating)[Math.floor(participants.length / 2)]?.player.eloRating || 0
      } : null
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get participant stats error:', error);
    res.status(500).json({
      success: false,
      message: '참가자 통계 조회 중 오류가 발생했습니다.',
      error: 'GET_PARTICIPANT_STATS_ERROR'
    });
  }
});

export default router;