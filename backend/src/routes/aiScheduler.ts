import express from 'express';
import { AISchedulerService, ScheduleConstraints } from '../services/aiSchedulerService';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { getSocketServer } from '../websocket/socketServer';
import { cacheAIOptimization, invalidateTournamentCache, getCacheStats } from '../middleware/cache';

const router = express.Router();

/**
 * Generate AI-optimized schedule for a tournament
 */
router.post('/optimize/:tournamentId', authenticate, requireRole(['admin']), cacheAIOptimization(1800), async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    const {
      totalCourts = 4,
      courtNames = ['코트 1', '코트 2', '코트 3', '코트 4'],
      startTime = '09:00',
      endTime = '18:00',
      lunchBreakStart = '12:00',
      lunchBreakEnd = '13:00',
      matchDuration = 45,
      breakBetweenMatches = 15,
      maxConsecutiveMatches = 6,
      restDuration = 30
    } = req.body;

    console.log(`🤖 Starting AI schedule optimization for tournament: ${tournamentId}`);

    const constraints: ScheduleConstraints = {
      totalCourts,
      courtNames,
      startTime,
      endTime,
      lunchBreakStart,
      lunchBreakEnd,
      matchDuration,
      breakBetweenMatches,
      maxConsecutiveMatches,
      restDuration
    };

    const optimizationResult = await AISchedulerService.optimizeSchedule(
      tournamentId,
      constraints
    );

    // Broadcast result via WebSocket
    const socketServer = getSocketServer();
    if (socketServer) {
      socketServer.broadcastScheduleOptimization(tournamentId, optimizationResult);
    }

    res.json({
      success: true,
      message: 'AI 스케줄 최적화가 완료되었습니다.',
      data: {
        optimizationResult,
        totalMatches: optimizationResult.schedule.filter(s => s.matchId).length,
        unscheduledCount: optimizationResult.unscheduledMatches.length,
        courtUtilization: optimizationResult.schedule.length > 0 ? 
          (optimizationResult.schedule.filter(s => s.matchId).length / optimizationResult.schedule.length * 100).toFixed(1) + '%' : '0%'
      }
    });

  } catch (error) {
    console.error('AI schedule optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'AI 스케줄 최적화 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get current schedule for a tournament
 */
router.get('/schedule/:tournamentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    
    const socketServer = getSocketServer();
    const currentSchedule = socketServer?.getTournamentSchedule(tournamentId);

    if (!currentSchedule) {
      return res.status(404).json({
        success: false,
        message: '해당 대회의 스케줄을 찾을 수 없습니다.',
        error: 'SCHEDULE_NOT_FOUND'
      });
    }

    // Group schedule by court for better visualization
    const courtSchedules = currentSchedule.reduce((acc, slot) => {
      if (!acc[slot.courtId]) {
        acc[slot.courtId] = {
          courtId: slot.courtId,
          courtName: slot.courtName,
          slots: []
        };
      }
      acc[slot.courtId].slots.push(slot);
      return acc;
    }, {} as any);

    const statistics = {
      totalSlots: currentSchedule.length,
      matchSlots: currentSchedule.filter(s => s.matchId).length,
      breakSlots: currentSchedule.filter(s => s.isBreak).length,
      lunchBreakSlots: currentSchedule.filter(s => s.isLunchBreak).length,
      utilization: currentSchedule.length > 0 ? 
        (currentSchedule.filter(s => s.matchId).length / currentSchedule.length * 100).toFixed(1) + '%' : '0%'
    };

    res.json({
      success: true,
      data: {
        tournamentId,
        schedule: currentSchedule,
        courtSchedules: Object.values(courtSchedules),
        statistics,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: '스케줄 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update court status
 */
router.patch('/court-status/:tournamentId/:courtId', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId, courtId } = req.params;
    const { status, expectedDuration } = req.body;

    const validStatuses = ['available', 'occupied', 'maintenance', 'break'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 코트 상태입니다.',
        error: 'INVALID_COURT_STATUS'
      });
    }

    console.log(`🏟️ Court status update: ${courtId} -> ${status}`);

    // Broadcast via WebSocket
    const socketServer = getSocketServer();
    if (socketServer) {
      const io = socketServer.getIO();
      io.of('/tournament').to(`tournament-${tournamentId}`).emit('court-status-change', {
        tournamentId,
        courtId,
        status,
        expectedDuration
      });
    }

    res.json({
      success: true,
      message: '코트 상태가 업데이트되었습니다.',
      data: {
        tournamentId,
        courtId,
        status,
        expectedDuration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Court status update error:', error);
    res.status(500).json({
      success: false,
      message: '코트 상태 업데이트 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Report match delay
 */
router.post('/match-delay/:tournamentId/:matchId', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId, matchId } = req.params;
    const { delayMinutes, reason } = req.body;

    if (!delayMinutes || delayMinutes < 0) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 지연 시간입니다.',
        error: 'INVALID_DELAY_TIME'
      });
    }

    console.log(`⏰ Match delay reported: ${matchId} - ${delayMinutes} minutes`);

    // Broadcast via WebSocket
    const socketServer = getSocketServer();
    if (socketServer) {
      const io = socketServer.getIO();
      io.of('/tournament').to(`tournament-${tournamentId}`).emit('match-delay-report', {
        tournamentId,
        matchId,
        delayMinutes,
        reason: reason || 'Unspecified delay'
      });
    }

    res.json({
      success: true,
      message: '경기 지연이 보고되었습니다.',
      data: {
        tournamentId,
        matchId,
        delayMinutes,
        reason,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Match delay report error:', error);
    res.status(500).json({
      success: false,
      message: '경기 지연 보고 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Emergency reschedule request
 */
router.post('/emergency-reschedule/:tournamentId/:matchId', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId, matchId } = req.params;
    const { newCourtId, newStartTime, reason } = req.body;

    if (!newCourtId && !newStartTime) {
      return res.status(400).json({
        success: false,
        message: '새로운 코트 또는 시간을 지정해야 합니다.',
        error: 'MISSING_RESCHEDULE_PARAMS'
      });
    }

    console.log(`🚨 Emergency reschedule: ${matchId}`);

    // Broadcast via WebSocket
    const socketServer = getSocketServer();
    if (socketServer) {
      const io = socketServer.getIO();
      io.of('/tournament').to(`tournament-${tournamentId}`).emit('emergency-reschedule', {
        tournamentId,
        matchId,
        newCourtId,
        newStartTime,
        reason: reason || 'Emergency reschedule'
      });
    }

    res.json({
      success: true,
      message: '긴급 일정 변경이 요청되었습니다.',
      data: {
        tournamentId,
        matchId,
        newCourtId,
        newStartTime,
        reason,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Emergency reschedule error:', error);
    res.status(500).json({
      success: false,
      message: '긴급 일정 변경 요청 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get AI scheduling insights for a tournament
 */
router.get('/insights/:tournamentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    
    // This would typically fetch stored optimization results from database
    // For now, return placeholder insights
    const insights = {
      tournamentId,
      lastOptimization: new Date().toISOString(),
      recommendations: [
        '현재 스케줄의 코트 활용률이 85%로 양호합니다.',
        '오후 시간대에 약간의 여유가 있어 추가 경기 배치가 가능합니다.',
        '선수들의 휴식 시간이 적절히 배분되어 있습니다.'
      ],
      warnings: [
        '코트 3번이 점심시간 직후 연속 경기로 스케줄되어 있습니다.',
        '일부 선수들의 경기 간격이 30분 미만입니다.'
      ],
      optimizationScore: 87,
      efficiency: {
        courtUtilization: 85,
        playerRestBalance: 92,
        timeSlotOptimization: 78
      }
    };

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Get AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'AI 인사이트 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get cache statistics
 */
router.get('/cache/stats', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const stats = getCacheStats();
    
    res.json({
      success: true,
      message: 'Cache statistics retrieved',
      data: {
        cacheStats: stats,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Invalidate tournament cache
 */
router.delete('/cache/tournament/:tournamentId', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    
    invalidateTournamentCache(tournamentId);
    
    res.json({
      success: true,
      message: `Tournament cache invalidated for ${tournamentId}`,
      data: {
        tournamentId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Cache invalidation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate tournament cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get WebSocket connection pool metrics
 */
router.get('/websocket/metrics', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const socketServer = getSocketServer();
    if (!socketServer) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket server not available',
        error: 'WEBSOCKET_NOT_INITIALIZED'
      });
    }

    const metrics = socketServer.getConnectionPoolMetrics();
    
    res.json({
      success: true,
      message: 'WebSocket connection pool metrics retrieved',
      data: {
        connectionPool: metrics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('WebSocket metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve WebSocket metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get tournament connection count
 */
router.get('/websocket/tournament/:tournamentId/connections', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    const socketServer = getSocketServer();
    
    if (!socketServer) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket server not available',
        error: 'WEBSOCKET_NOT_INITIALIZED'
      });
    }

    const connectionCount = socketServer.getTournamentConnectionCount(tournamentId);
    
    res.json({
      success: true,
      data: {
        tournamentId,
        activeConnections: connectionCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Tournament connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tournament connections',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test AI connection
 */
router.get('/test-ai', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Test OpenAI connection
    const testResult = await AISchedulerService.optimizeSchedule(
      'test-tournament',
      {
        totalCourts: 2,
        courtNames: ['Test Court 1', 'Test Court 2'],
        startTime: '09:00',
        endTime: '17:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        matchDuration: 30,
        breakBetweenMatches: 10,
        maxConsecutiveMatches: 4,
        restDuration: 20
      },
      [] // Empty matches for test
    );

    res.json({
      success: true,
      message: 'AI 연결 테스트 성공',
      data: {
        aiServiceWorking: testResult.success,
        aiInsights: testResult.aiInsights,
        openaiStatus: process.env.OPENAI_API_KEY ? 'API Key configured' : 'API Key missing',
        testTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({
      success: false,
      message: 'AI 연결 테스트 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    });
  }
});

export default router;