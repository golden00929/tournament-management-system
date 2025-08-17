import express from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { EloRatingService } from '../services/eloRatingService';
import { AISchedulingService } from '../services/aiSchedulingService';

const router = express.Router();

// Get matches for a tournament or bracket
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      tournamentId,
      bracketId,
      page = '1',
      limit = '20',
      status,
      roundName,
      courtNumber,
      sortBy = 'scheduledTime',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    if (tournamentId) where.tournamentId = tournamentId as string;
    if (bracketId) where.bracketId = bracketId as string;
    if (status) where.status = status as string;
    if (roundName) where.roundName = roundName as string;
    if (courtNumber) where.courtNumber = parseInt(courtNumber as string);

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          player1: {
            select: {
              id: true,
              name: true,
              eloRating: true,
              skillLevel: true
            }
          },
          player2: {
            select: {
              id: true,
              name: true,
              eloRating: true,
              skillLevel: true
            }
          },
          tournament: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          bracket: {
            select: {
              id: true,
              name: true,
              eventType: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy
      }),
      prisma.match.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      success: true,
      data: {
        matches,
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
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: '경기 목록 조회 중 오류가 발생했습니다.',
      error: 'GET_MATCHES_ERROR'
    });
  }
});

// Get single match details
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            eloRating: true,
            skillLevel: true,
            totalMatches: true,
            wins: true,
            losses: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            eloRating: true,
            skillLevel: true,
            totalMatches: true,
            wins: true,
            losses: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
            category: true,
            startDate: true,
            venue: true
          }
        },
        bracket: {
          select: {
            id: true,
            name: true,
            eventType: true,
            type: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '경기를 찾을 수 없습니다.',
        error: 'MATCH_NOT_FOUND'
      });
    }

    // Calculate expected outcomes if both players exist
    let predictions = null;
    if (match.player1 && match.player2) {
      const player1Rating = match.player1.eloRating;
      const player2Rating = match.player2.eloRating;
      
      // Simple probability calculation
      const player1WinProb = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
      const player2WinProb = 1 - player1WinProb;
      
      predictions = {
        player1WinProbability: Math.round(player1WinProb * 100),
        player2WinProbability: Math.round(player2WinProb * 100),
        ratingDifference: Math.abs(player1Rating - player2Rating),
        expectedOutcome: player1WinProb > 0.5 ? match.player1.name : match.player2.name
      };
    }

    res.json({
      success: true,
      data: {
        ...match,
        predictions
      }
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({
      success: false,
      message: '경기 정보 조회 중 오류가 발생했습니다.',
      error: 'GET_MATCH_ERROR'
    });
  }
});

// Create new match
router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const {
      tournamentId,
      bracketId,
      roundName,
      matchNumber,
      player1Id,
      player2Id,
      courtNumber,
      scheduledTime,
      notes
    } = req.body;

    if (!tournamentId || !roundName || !matchNumber) {
      return res.status(400).json({
        success: false,
        message: '대회 ID, 라운드명, 경기 번호는 필수입니다.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Get player names if IDs provided
    let player1Name = null;
    let player2Name = null;

    if (player1Id) {
      const player1 = await prisma.player.findUnique({
        where: { id: player1Id },
        select: { name: true }
      });
      player1Name = player1?.name;
    }

    if (player2Id) {
      const player2 = await prisma.player.findUnique({
        where: { id: player2Id },
        select: { name: true }
      });
      player2Name = player2?.name;
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        bracketId,
        roundName,
        matchNumber: parseInt(matchNumber),
        player1Id,
        player2Id,
        player1Name,
        player2Name,
        courtNumber: courtNumber ? parseInt(courtNumber) : null,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        notes,
        status: 'scheduled'
      },
      include: {
        player1: { select: { id: true, name: true, eloRating: true } },
        player2: { select: { id: true, name: true, eloRating: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: '경기가 생성되었습니다.',
      data: match
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({
      success: false,
      message: '경기 생성 중 오류가 발생했습니다.',
      error: 'CREATE_MATCH_ERROR'
    });
  }
});

// Update match result with ELO rating calculation
router.put('/:id/result', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      player1Score,
      player2Score,
      winnerId,
      notes,
      actualStartTime,
      actualEndTime
    } = req.body;

    if (player1Score === undefined || player2Score === undefined) {
      return res.status(400).json({
        success: false,
        message: '경기 점수는 필수입니다.',
        error: 'MISSING_SCORES'
      });
    }

    // Get current match info
    const currentMatch = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        player1Id: true,
        player2Id: true,
        status: true,
        player1Score: true,
        player2Score: true,
        winnerId: true
      }
    });

    if (!currentMatch) {
      return res.status(404).json({
        success: false,
        message: '경기를 찾을 수 없습니다.',
        error: 'MATCH_NOT_FOUND'
      });
    }

    if (!currentMatch.player1Id || !currentMatch.player2Id) {
      return res.status(400).json({
        success: false,
        message: '두 선수가 모두 배정된 경기만 결과 입력이 가능합니다.',
        error: 'INCOMPLETE_MATCH_SETUP'
      });
    }

    // Determine winner if not provided
    let finalWinnerId = winnerId;
    if (!finalWinnerId) {
      if (parseInt(player1Score) > parseInt(player2Score)) {
        finalWinnerId = currentMatch.player1Id;
      } else if (parseInt(player2Score) > parseInt(player1Score)) {
        finalWinnerId = currentMatch.player2Id;
      }
      // If scores are equal, no winner (draw)
    }

    // Check if this is a result update (match already completed)
    const isResultUpdate = currentMatch.status === 'completed' && 
                           (currentMatch.player1Score !== 0 || currentMatch.player2Score !== 0);

    // Update match result
    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        player1Score: parseInt(player1Score),
        player2Score: parseInt(player2Score),
        winnerId: finalWinnerId,
        status: 'completed',
        actualStartTime: actualStartTime ? new Date(actualStartTime) : undefined,
        actualEndTime: actualEndTime ? new Date(actualEndTime) : new Date(),
        notes
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            eloRating: true,
            skillLevel: true
          }
        }
      }
    });

    let ratingUpdate = null;

    // Update ELO ratings if there's a clear winner and it's not a result update
    if (finalWinnerId && !isResultUpdate) {
      try {
        const player1Won = finalWinnerId === currentMatch.player1Id;
        
        ratingUpdate = await EloRatingService.updatePlayerRatings(
          currentMatch.player1Id!,
          currentMatch.player2Id!,
          player1Won,
          id
        );
      } catch (ratingError) {
        console.error('ELO rating update error:', ratingError);
        // Continue without failing the match result update
      }
    }

    res.json({
      success: true,
      message: '경기 결과가 저장되었습니다.',
      data: {
        match: updatedMatch,
        ratingUpdate: ratingUpdate ? {
          player1: {
            oldRating: updatedMatch.player1?.eloRating || 0,
            newRating: ratingUpdate.player1NewRating,
            change: ratingUpdate.player1Change
          },
          player2: {
            oldRating: updatedMatch.player2?.eloRating || 0,
            newRating: ratingUpdate.player2NewRating,
            change: ratingUpdate.player2Change
          }
        } : null
      }
    });
  } catch (error) {
    console.error('Update match result error:', error);
    res.status(500).json({
      success: false,
      message: '경기 결과 저장 중 오류가 발생했습니다.',
      error: 'UPDATE_MATCH_RESULT_ERROR'
    });
  }
});

// Update match schedule
router.patch('/:id/schedule', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      courtNumber,
      scheduledTime,
      notes
    } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        courtNumber: courtNumber ? parseInt(courtNumber) : undefined,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        notes
      }
    });

    res.json({
      success: true,
      message: '경기 일정이 변경되었습니다.',
      data: match
    });
  } catch (error) {
    console.error('Update match schedule error:', error);
    res.status(500).json({
      success: false,
      message: '경기 일정 변경 중 오류가 발생했습니다.',
      error: 'UPDATE_MATCH_SCHEDULE_ERROR'
    });
  }
});

// Start match (update status to ongoing)
router.patch('/:id/start', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.update({
      where: { id },
      data: {
        status: 'ongoing',
        actualStartTime: new Date()
      }
    });

    res.json({
      success: true,
      message: '경기가 시작되었습니다.',
      data: match
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({
      success: false,
      message: '경기 시작 처리 중 오류가 발생했습니다.',
      error: 'START_MATCH_ERROR'
    });
  }
});

// Cancel match
router.patch('/:id/cancel', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: reason || 'Cancelled by administrator'
      }
    });

    res.json({
      success: true,
      message: '경기가 취소되었습니다.',
      data: match
    });
  } catch (error) {
    console.error('Cancel match error:', error);
    res.status(500).json({
      success: false,
      message: '경기 취소 처리 중 오류가 발생했습니다.',
      error: 'CANCEL_MATCH_ERROR'
    });
  }
});

// Get match statistics for a tournament
router.get('/tournament/:tournamentId/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;

    const matches = await prisma.match.findMany({
      where: { tournamentId },
      include: {
        player1: { select: { skillLevel: true, province: true } },
        player2: { select: { skillLevel: true, province: true } }
      }
    });

    const stats = {
      total: matches.length,
      byStatus: {
        scheduled: matches.filter(m => m.status === 'scheduled').length,
        ongoing: matches.filter(m => m.status === 'ongoing').length,
        completed: matches.filter(m => m.status === 'completed').length,
        cancelled: matches.filter(m => m.status === 'cancelled').length,
      },
      byRound: matches.reduce((acc: any, match) => {
        acc[match.roundName] = (acc[match.roundName] || 0) + 1;
        return acc;
      }, {}),
      byCourt: matches.reduce((acc: any, match) => {
        if (match.courtNumber) {
          acc[`Court ${match.courtNumber}`] = (acc[`Court ${match.courtNumber}`] || 0) + 1;
        }
        return acc;
      }, {}),
      averageMatchDuration: matches
        .filter(m => m.actualStartTime && m.actualEndTime)
        .reduce((acc, match) => {
          const duration = new Date(match.actualEndTime!).getTime() - new Date(match.actualStartTime!).getTime();
          return acc + duration;
        }, 0) / Math.max(1, matches.filter(m => m.actualStartTime && m.actualEndTime).length),
      completionRate: matches.length > 0 ? 
        Math.round((matches.filter(m => m.status === 'completed').length / matches.length) * 100) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get match stats error:', error);
    res.status(500).json({
      success: false,
      message: '경기 통계 조회 중 오류가 발생했습니다.',
      error: 'GET_MATCH_STATS_ERROR'
    });
  }
});

// Bulk update match schedules
router.patch('/bulk/schedule', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: '업데이트할 경기 목록이 필요합니다.',
        error: 'MISSING_UPDATES'
      });
    }

    const results = [];

    for (const update of updates) {
      try {
        const match = await prisma.match.update({
          where: { id: update.matchId },
          data: {
            courtNumber: update.courtNumber ? parseInt(update.courtNumber) : undefined,
            scheduledTime: update.scheduledTime ? new Date(update.scheduledTime) : undefined,
          }
        });
        results.push({ matchId: update.matchId, success: true });
      } catch (error) {
        results.push({ matchId: update.matchId, success: false, error });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `${successCount}개 경기의 일정이 업데이트되었습니다.`,
      data: {
        totalUpdated: successCount,
        totalFailed: results.length - successCount,
        results
      }
    });
  } catch (error) {
    console.error('Bulk update match schedules error:', error);
    res.status(500).json({
      success: false,
      message: '일괄 일정 업데이트 중 오류가 발생했습니다.',
      error: 'BULK_UPDATE_SCHEDULES_ERROR'
    });
  }
});

// Clean old brackets and matches for tournament
router.delete('/debug/clean/:tournamentId', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    const { keepLatest } = req.query;
    const keepCount = parseInt(keepLatest as string) || 1;

    // Get all brackets for this tournament
    const brackets = await prisma.bracket.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' }
    });

    if (brackets.length <= keepCount) {
      return res.json({
        success: true,
        message: `${brackets.length}개의 브라켓만 있어서 정리할 필요가 없습니다.`,
        data: { deletedBrackets: 0, deletedMatches: 0 }
      });
    }

    // Keep the latest N brackets, delete the rest
    const bracketsToDelete = brackets.slice(keepCount);
    const bracketIdsToDelete = bracketsToDelete.map(b => b.id);

    console.log(`🗑️ 정리할 브라켓: ${bracketIdsToDelete.length}개`);
    console.log(`🗑️ 브라켓 ID들:`, bracketIdsToDelete);

    // Delete matches for these brackets
    const deletedMatches = await prisma.match.deleteMany({
      where: { bracketId: { in: bracketIdsToDelete } }
    });

    // Delete the brackets
    const deletedBrackets = await prisma.bracket.deleteMany({
      where: { id: { in: bracketIdsToDelete } }
    });

    res.json({
      success: true,
      message: `${deletedBrackets.count}개의 오래된 브라켓과 ${deletedMatches.count}개의 매치를 정리했습니다.`,
      data: {
        deletedBrackets: deletedBrackets.count,
        deletedMatches: deletedMatches.count,
        remainingBrackets: brackets.length - bracketIdsToDelete.length
      }
    });
  } catch (error) {
    console.error('Clean brackets error:', error);
    res.status(500).json({
      success: false,
      message: '브라켓 정리 중 오류가 발생했습니다.',
      error: 'CLEAN_BRACKETS_ERROR'
    });
  }
});

// Debug: Get matches count by tournament
router.get('/debug/count/:tournamentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;

    const [totalMatches, totalBrackets] = await Promise.all([
      prisma.match.count({ where: { tournamentId } }),
      prisma.bracket.count({ where: { tournamentId } })
    ]);

    const bracketMatches = await prisma.bracket.findMany({
      where: { tournamentId },
      include: {
        _count: {
          select: { matches: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const recentMatches = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        matchNumber: true,
        roundName: true,
        bracketId: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        tournamentId,
        totalMatches,
        totalBrackets,
        bracketMatches: bracketMatches.map(b => ({
          id: b.id,
          name: b.name,
          type: b.type,
          matchCount: b._count.matches,
          createdAt: b.createdAt
        })),
        recentMatches
      }
    });
  } catch (error) {
    console.error('Debug matches count error:', error);
    res.status(500).json({
      success: false,
      message: '매치 카운트 조회 중 오류가 발생했습니다.',
      error: 'DEBUG_MATCHES_COUNT_ERROR'
    });
  }
});

// Delete match
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if match has results
    const match = await prisma.match.findUnique({
      where: { id },
      select: { status: true, winnerId: true }
    });

    if (match?.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '완료된 경기는 삭제할 수 없습니다.',
        error: 'CANNOT_DELETE_COMPLETED_MATCH'
      });
    }

    await prisma.match.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '경기가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({
      success: false,
      message: '경기 삭제 중 오류가 발생했습니다.',
      error: 'DELETE_MATCH_ERROR'
    });
  }
});

// 🤖 AI 자동 일정 생성
router.post('/tournament/:tournamentId/ai-schedule', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    const {
      startTime,
      courtCount = 4,
      matchDuration = 60,
      restBetweenMatches = 30,
      courtChangeDuration = 10
    } = req.body;

    if (!startTime) {
      return res.status(400).json({
        success: false,
        message: '대회 시작 시간이 필요합니다.',
        error: 'MISSING_START_TIME'
      });
    }

    console.log(`🤖 AI 일정 생성 시작 - 대회: ${tournamentId}`);
    console.log(`⚙️ 설정: ${courtCount}개 코트, ${matchDuration}분 경기, ${restBetweenMatches}분 휴식`);

    const result = await AISchedulingService.generateOptimalSchedule({
      tournamentId,
      startTime,
      courtCount,
      matchDuration,
      restBetweenMatches,
      courtChangeDuration
    });

    console.log(`✅ AI 일정 생성 완료 - ${result.data.scheduledMatches}개 경기 배정`);

    res.json(result);
  } catch (error) {
    console.error('AI 일정 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: 'AI 일정 생성 중 오류가 발생했습니다.',
      error: 'AI_SCHEDULE_GENERATION_ERROR'
    });
  }
});

// 일정 충돌 검사
router.get('/tournament/:tournamentId/schedule-validation', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;

    const validation = await AISchedulingService.validateSchedule(tournamentId);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('일정 검증 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 검증 중 오류가 발생했습니다.',
      error: 'SCHEDULE_VALIDATION_ERROR'
    });
  }
});

export default router;