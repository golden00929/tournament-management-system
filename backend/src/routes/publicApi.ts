import express from 'express';
import { prisma } from '../config/database';

const router = express.Router();

// 공개 토너먼트 목록 (선수가 볼 수 있는 정보만)
router.get('/tournaments', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, skillLevel, status = 'open' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: { in: ['open', 'ongoing'] }, // 공개된 대회만
    };

    if (category) {
      where.category = category;
    }

    if (skillLevel && skillLevel !== 'all') {
      where.skillLevel = skillLevel;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        startDate: true,
        endDate: true,
        registrationStart: true,
        registrationEnd: true,
        location: true,
        venue: true,
        maxParticipants: true,
        participantFee: true,
        skillLevel: true,
        status: true,
        posterImage: true,
        contactEmail: true,
        organizerInfo: true,
        // 민감한 정보는 제외 (organizerFee, bankInfo 등)
        _count: {
          select: {
            participants: {
              where: { approvalStatus: 'approved' }
            }
          }
        }
      },
      orderBy: { startDate: 'asc' },
      skip,
      take: limitNum,
    });

    const total = await prisma.tournament.count({ where });

    res.json({
      success: true,
      data: {
        tournaments: tournaments.map(tournament => ({
          ...tournament,
          availableSlots: tournament.maxParticipants - tournament._count.participants
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get public tournaments error:', error);
    res.status(500).json({
      success: false,
      message: '토너먼트 목록을 가져오는 중 오류가 발생했습니다.',
      error: 'GET_TOURNAMENTS_ERROR'
    });
  }
});

// 특정 토너먼트 상세 정보 (공개)
router.get('/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        startDate: true,
        endDate: true,
        registrationStart: true,
        registrationEnd: true,
        location: true,
        venue: true,
        maxParticipants: true,
        minSkillLevel: true,
        maxSkillLevel: true,
        participantFee: true,
        skillLevel: true,
        tournamentType: true,
        status: true,
        posterImage: true,
        rulesDocument: true,
        contactPhone: true,
        contactEmail: true,
        organizerInfo: true,
        participants: {
          where: { approvalStatus: 'approved' },
          select: {
            id: true,
            eventType: true,
            registrationDate: true,
            player: {
              select: {
                id: true,
                name: true,
                eloRating: true,
                skillLevel: true
              }
            }
          }
        },
        brackets: {
          where: { status: { in: ['published', 'ongoing', 'completed'] } },
          select: {
            id: true,
            name: true,
            eventType: true,
            type: true,
            status: true
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

    // 공개되지 않은 대회는 접근 차단
    if (!['open', 'ongoing', 'completed'].includes(tournament.status)) {
      return res.status(403).json({
        success: false,
        message: '공개되지 않은 토너먼트입니다.',
        error: 'TOURNAMENT_NOT_PUBLIC'
      });
    }

    res.json({
      success: true,
      data: {
        ...tournament,
        availableSlots: tournament.maxParticipants - tournament.participants.length
      }
    });
  } catch (error) {
    console.error('Get public tournament error:', error);
    res.status(500).json({
      success: false,
      message: '토너먼트 정보를 가져오는 중 오류가 발생했습니다.',
      error: 'GET_TOURNAMENT_ERROR'
    });
  }
});

// 토너먼트 대진표 (공개)
router.get('/tournaments/:id/bracket', async (req, res) => {
  try {
    const { id } = req.params;

    // 토너먼트가 공개 상태인지 확인
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, status: true, name: true }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '토너먼트를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    if (!['ongoing', 'completed'].includes(tournament.status)) {
      return res.status(403).json({
        success: false,
        message: '대진표가 아직 공개되지 않았습니다.',
        error: 'BRACKET_NOT_PUBLIC'
      });
    }

    const brackets = await prisma.bracket.findMany({
      where: {
        tournamentId: id,
        status: { in: ['published', 'ongoing', 'completed'] }
      },
      select: {
        id: true,
        name: true,
        eventType: true,
        type: true,
        participants: true,
        bracketData: true,
        status: true,
        matches: {
          select: {
            id: true,
            roundName: true,
            matchNumber: true,
            player1Name: true,
            player2Name: true,
            player1Score: true,
            player2Score: true,
            winnerId: true,
            status: true,
            scheduledTime: true,
            courtNumber: true
          },
          orderBy: [
            { roundName: 'asc' },
            { matchNumber: 'asc' }
          ]
        }
      }
    });

    res.json({
      success: true,
      data: {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status
        },
        brackets
      }
    });
  } catch (error) {
    console.error('Get public bracket error:', error);
    res.status(500).json({
      success: false,
      message: '대진표를 가져오는 중 오류가 발생했습니다.',
      error: 'GET_BRACKET_ERROR'
    });
  }
});

// 경기 일정 (공개)
router.get('/tournaments/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;

    // 토너먼트가 공개 상태인지 확인
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, status: true, name: true }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '토너먼트를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    if (!['ongoing', 'completed'].includes(tournament.status)) {
      return res.status(403).json({
        success: false,
        message: '경기 일정이 아직 공개되지 않았습니다.',
        error: 'SCHEDULE_NOT_PUBLIC'
      });
    }

    const matches = await prisma.match.findMany({
      where: { tournamentId: id },
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
        status: true
      },
      orderBy: [
        { scheduledTime: 'asc' },
        { courtNumber: 'asc' },
        { matchNumber: 'asc' }
      ]
    });

    const schedules = await prisma.schedule.findMany({
      where: {
        tournamentId: id,
        isPublic: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        courtNumber: true,
        type: true
      },
      orderBy: { startTime: 'asc' }
    });

    res.json({
      success: true,
      data: {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status
        },
        matches,
        schedules
      }
    });
  } catch (error) {
    console.error('Get public schedule error:', error);
    res.status(500).json({
      success: false,
      message: '경기 일정을 가져오는 중 오류가 발생했습니다.',
      error: 'GET_SCHEDULE_ERROR'
    });
  }
});

export default router;