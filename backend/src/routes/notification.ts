import express from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { getSocketServer } from '../websocket/socketServer';
import { prisma } from '../config/database';

const router = express.Router();

// 🔔 대회 참가자들에게 알림 전송
router.post('/tournament/:tournamentId', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    const {
      title,
      message,
      type = 'info',
      targetPlayers,
      matchId,
      expiresAt,
      actionUrl
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: '제목과 메시지는 필수입니다.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 대회 존재 확인
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, name: true }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: '대회를 찾을 수 없습니다.',
        error: 'TOURNAMENT_NOT_FOUND'
      });
    }

    // WebSocket 서버 가져오기
    const socketServer = getSocketServer();
    if (!socketServer) {
      return res.status(500).json({
        success: false,
        message: 'WebSocket 서버가 사용 불가능합니다.',
        error: 'WEBSOCKET_UNAVAILABLE'
      });
    }

    // 알림 전송
    const sentCount = socketServer.sendNotification(tournamentId, {
      title,
      message,
      type,
      targetPlayers,
      matchId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      actionUrl,
      sender: {
        name: req.user!.name,
        role: req.user!.role
      }
    });

    console.log(`📢 알림 전송 완료 - 대회: ${tournament.name}, 수신자: ${sentCount}명`);

    res.json({
      success: true,
      message: `${sentCount}명의 참가자에게 알림을 전송했습니다.`,
      data: {
        tournamentId,
        tournamentName: tournament.name,
        sentCount,
        notification: {
          title,
          message,
          type,
          targetPlayerCount: targetPlayers?.length || null,
          matchId,
          sender: req.user!.name
        }
      }
    });

  } catch (error) {
    console.error('알림 전송 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 전송 중 오류가 발생했습니다.',
      error: 'NOTIFICATION_SEND_ERROR'
    });
  }
});

// 🚨 긴급 공지사항 전송
router.post('/tournament/:tournamentId/urgent', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: '제목과 메시지는 필수입니다.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const socketServer = getSocketServer();
    if (!socketServer) {
      return res.status(500).json({
        success: false,
        message: 'WebSocket 서버가 사용 불가능합니다.',
        error: 'WEBSOCKET_UNAVAILABLE'
      });
    }

    const sentCount = socketServer.sendUrgentAnnouncement(
      tournamentId,
      title,
      message,
      {
        name: req.user!.name,
        role: req.user!.role
      }
    );

    console.log(`🚨 긴급 공지 전송 완료 - 대회: ${tournamentId}, 수신자: ${sentCount}명`);

    res.json({
      success: true,
      message: `${sentCount}명의 참가자에게 긴급 공지를 전송했습니다.`,
      data: {
        tournamentId,
        sentCount,
        announcement: {
          title,
          message,
          type: 'urgent',
          sender: req.user!.name
        }
      }
    });

  } catch (error) {
    console.error('긴급 공지 전송 오류:', error);
    res.status(500).json({
      success: false,
      message: '긴급 공지 전송 중 오류가 발생했습니다.',
      error: 'URGENT_NOTIFICATION_ERROR'
    });
  }
});

// ⏰ 경기 시작 알림 전송
router.post('/match/:matchId/starting-soon', authenticate, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { minutesUntilStart = 10 } = req.body;

    // 경기 정보 가져오기
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: { select: { name: true } },
        player2: { select: { name: true } },
        tournament: { select: { id: true, name: true } }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '경기를 찾을 수 없습니다.',
        error: 'MATCH_NOT_FOUND'
      });
    }

    if (!match.courtNumber) {
      return res.status(400).json({
        success: false,
        message: '코트가 배정되지 않은 경기입니다.',
        error: 'COURT_NOT_ASSIGNED'
      });
    }

    const socketServer = getSocketServer();
    if (!socketServer) {
      return res.status(500).json({
        success: false,
        message: 'WebSocket 서버가 사용 불가능합니다.',
        error: 'WEBSOCKET_UNAVAILABLE'
      });
    }

    const sentCount = socketServer.sendMatchStartingSoon(
      match.tournament.id,
      matchId,
      minutesUntilStart,
      match.courtNumber,
      match.player1?.name || match.player1Name || 'TBD',
      match.player2?.name || match.player2Name || 'TBD'
    );

    console.log(`⏰ 경기 시작 알림 전송 완료 - 경기: ${match.matchNumber}, 수신자: ${sentCount}명`);

    res.json({
      success: true,
      message: `${sentCount}명에게 경기 시작 알림을 전송했습니다.`,
      data: {
        matchId,
        tournamentId: match.tournament.id,
        sentCount,
        notification: {
          minutesUntilStart,
          courtNumber: match.courtNumber,
          player1: match.player1?.name || match.player1Name,
          player2: match.player2?.name || match.player2Name,
          matchNumber: match.matchNumber
        }
      }
    });

  } catch (error) {
    console.error('경기 시작 알림 전송 오류:', error);
    res.status(500).json({
      success: false,
      message: '경기 시작 알림 전송 중 오류가 발생했습니다.',
      error: 'MATCH_NOTIFICATION_ERROR'
    });
  }
});

// 📊 알림 전송 통계 (선택사항)
router.get('/tournament/:tournamentId/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentId } = req.params;

    const socketServer = getSocketServer();
    if (!socketServer) {
      return res.status(500).json({
        success: false,
        message: 'WebSocket 서버가 사용 불가능합니다.',
        error: 'WEBSOCKET_UNAVAILABLE'
      });
    }

    const connectionCount = socketServer.getTournamentConnectionCount(tournamentId);
    const connectionMetrics = socketServer.getConnectionPoolMetrics();

    res.json({
      success: true,
      data: {
        tournamentId,
        connectedParticipants: connectionCount,
        totalConnections: connectionMetrics.totalConnections,
        serverCapacity: connectionMetrics.maxConnections,
        canSendNotifications: connectionCount > 0
      }
    });

  } catch (error) {
    console.error('알림 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 통계 조회 중 오류가 발생했습니다.',
      error: 'NOTIFICATION_STATS_ERROR'
    });
  }
});

export default router;