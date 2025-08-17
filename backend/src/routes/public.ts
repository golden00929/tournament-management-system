import express from 'express';
import { prisma } from '../config/database';

const router = express.Router();

// 공개 대회 목록 조회 (인증 불필요)
router.get('/tournaments', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      status = '',
      skillLevel = '',
      location = ''
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // 검색 조건 구성
    const where: any = {
      status: {
        in: ['open', 'ongoing'] // 공개적으로 볼 수 있는 대회 상태만
      }
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { location: { contains: search as string } },
        { venue: { contains: search as string } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status && ['open', 'ongoing'].includes(status as string)) {
      where.status = status;
    }

    if (skillLevel && skillLevel !== 'all') {
      where.skillLevel = skillLevel;
    }

    if (location) {
      where.location = { contains: location as string };
    }

    // 대회 목록 조회
    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
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
          minSkillLevel: true,
          maxSkillLevel: true,
          skillLevel: true,
          participantFee: true,
          pricingTier: true,
          status: true,
          posterImage: true,
          contactPhone: true,
          contactEmail: true,
          organizerInfo: true,
          createdAt: true,
          // 참가자 수 계산을 위한 관계 포함
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
        orderBy: [
          { status: 'asc' }, // 'open' 상태를 우선
          { startDate: 'asc' }
        ],
        skip: offset,
        take: limitNum
      }),
      prisma.tournament.count({ where })
    ]);

    // 응답 데이터 가공
    const tournamentsWithStats = tournaments.map(tournament => ({
      ...tournament,
      currentParticipants: tournament._count.participants,
      isRegistrationOpen: tournament.status === 'open' &&
        new Date() >= new Date(tournament.registrationStart) &&
        new Date() <= new Date(tournament.registrationEnd),
      daysUntilStart: Math.ceil(
        (new Date(tournament.startDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
      )
    }));

    res.json({
      success: true,
      data: {
        tournaments: tournamentsWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        filters: {
          search,
          category,
          status,
          skillLevel,
          location
        }
      }
    });

  } catch (error) {
    console.error('Get public tournaments error:', error);
    res.status(500).json({
      success: false,
      message: '대회 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_TOURNAMENTS_ERROR'
    });
  }
});

// 공개 대회 상세 정보 조회 (인증 불필요)
router.get('/tournament/:id', async (req, res) => {
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
        skillDiffLimit: true,
        tournamentType: true,
        skillLevel: true,
        participantFee: true,
        organizerFee: true,
        pricingTier: true,
        status: true,
        posterImage: true,
        rulesDocument: true,
        contactPhone: true,
        contactEmail: true,
        bankInfo: true,
        organizerInfo: true,
        createdAt: true,
        // 참가자 통계
        _count: {
          select: {
            participants: {
              where: {
                approvalStatus: 'approved',
                isActive: true
              }
            }
          }
        },
        // 승인된 참가자 목록 (공개 정보만)
        participants: {
          where: {
            approvalStatus: 'approved',
            isActive: true
          },
          select: {
            id: true,
            eventType: true,
            registrationElo: true,
            assignedGroup: true,
            seedNumber: true,
            registrationDate: true,
            player: {
              select: {
                id: true,
                name: true,
                province: true,
                district: true,
                eloRating: true,
                skillLevel: true
              }
            },
            partnerPlayer: {
              select: {
                id: true,
                name: true,
                province: true,
                district: true,
                eloRating: true,
                skillLevel: true
              }
            }
          },
          orderBy: [
            { seedNumber: 'asc' },
            { registrationDate: 'asc' }
          ]
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

    // 공개 대회가 아닌 경우 제한된 정보만 제공
    if (!['open', 'ongoing', 'completed'].includes(tournament.status)) {
      return res.status(403).json({
        success: false,
        message: '비공개 대회입니다.',
        error: 'TOURNAMENT_NOT_PUBLIC'
      });
    }

    // 응답 데이터 가공
    const tournamentWithStats = {
      ...tournament,
      currentParticipants: tournament._count.participants,
      isRegistrationOpen: tournament.status === 'open' &&
        new Date() >= new Date(tournament.registrationStart) &&
        new Date() <= new Date(tournament.registrationEnd),
      daysUntilStart: Math.ceil(
        (new Date(tournament.startDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
      ),
      // 참가자 통계
      participantStats: {
        total: tournament._count.participants,
        byEventType: tournament.participants.reduce((acc: any, p) => {
          acc[p.eventType] = (acc[p.eventType] || 0) + 1;
          return acc;
        }, {}),
        bySkillLevel: tournament.participants.reduce((acc: any, p) => {
          const skillLevel = p.player.skillLevel;
          acc[skillLevel] = (acc[skillLevel] || 0) + 1;
          return acc;
        }, {}),
        avgEloRating: tournament.participants.length > 0 ?
          Math.round(tournament.participants.reduce((sum, p) => sum + p.player.eloRating, 0) / tournament.participants.length) :
          0
      }
    };

    res.json({
      success: true,
      data: tournamentWithStats
    });

  } catch (error) {
    console.error('Get public tournament detail error:', error);
    res.status(500).json({
      success: false,
      message: '대회 정보 조회 중 오류가 발생했습니다.',
      error: 'GET_TOURNAMENT_ERROR'
    });
  }
});

// 공개 대회 대진표 조회 (인증 불필요)
router.get('/tournament/:id/bracket', async (req, res) => {
  try {
    const { id } = req.params;

    // 먼저 대회가 공개적으로 접근 가능한지 확인
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, status: true, name: true }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
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

    // 대진표 조회
    const brackets = await prisma.bracket.findMany({
      where: {
        tournamentId: id,
        status: { in: ['published', 'ongoing', 'completed'] }
      },
      select: {
        id: true,
        name: true,
        eventType: true,
        skillLevelMin: true,
        skillLevelMax: true,
        type: true,
        maxParticipants: true,
        participants: true,
        bracketData: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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
            scheduledTime: true,
            status: true
          },
          orderBy: [
            { roundName: 'asc' },
            { matchNumber: 'asc' }
          ]
        }
      },
      orderBy: { createdAt: 'asc' }
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
    console.error('Get public tournament bracket error:', error);
    res.status(500).json({
      success: false,
      message: '대진표 조회 중 오류가 발생했습니다.',
      error: 'GET_BRACKET_ERROR'
    });
  }
});

// 공개 랭킹 조회 (상위 100명)
router.get('/rankings', async (req, res) => {
  try {
    const {
      skillLevel = '',
      province = '',
      limit = '100'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10), 100); // 최대 100명으로 제한

    // 검색 조건 구성
    const where: any = {
      isActive: true,
      totalMatches: { gt: 0 } // 최소 1경기 이상한 선수만
    };

    if (skillLevel && skillLevel !== 'all') {
      where.skillLevel = skillLevel;
    }

    if (province) {
      where.province = province;
    }

    const players = await prisma.player.findMany({
      where,
      select: {
        id: true,
        name: true,
        province: true,
        district: true,
        eloRating: true,
        skillLevel: true,
        totalMatches: true,
        wins: true,
        losses: true,
        consistencyIndex: true,
        performanceIndex: true,
        lastMatchDate: true
      },
      orderBy: [
        { performanceIndex: 'desc' },
        { eloRating: 'desc' },
        { totalMatches: 'desc' }
      ],
      take: limitNum
    });

    // 순위와 승률 계산
    const playersWithRank = players.map((player, index) => ({
      ...player,
      rank: index + 1,
      winRate: player.totalMatches > 0 ?
        parseFloat(((player.wins / player.totalMatches) * 100).toFixed(1)) :
        0,
      // 개인정보는 제외하고 공개 가능한 정보만
      id: undefined, // ID는 공개하지 않음
    }));

    res.json({
      success: true,
      data: {
        players: playersWithRank,
        filters: {
          skillLevel,
          province,
          limit: limitNum
        },
        meta: {
          total: playersWithRank.length,
          lastUpdated: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get public rankings error:', error);
    res.status(500).json({
      success: false,
      message: '랭킹 조회 중 오류가 발생했습니다.',
      error: 'GET_RANKINGS_ERROR'
    });
  }
});

export default router;