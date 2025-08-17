import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { AISchedulerService, RealTimeAdjustment, ScheduleSlot } from '../services/aiSchedulerService';
import WebSocketConnectionPool, { ConnectionMetrics, PoolConfig } from './connectionPool';

// Interface definitions for WebSocket events
export interface ClientToServerEvents {
  'join-tournament': (tournamentId: string) => void;
  'leave-tournament': (tournamentId: string) => void;
  'request-schedule-update': (data: {
    tournamentId: string;
    reason: string;
    adjustment: RealTimeAdjustment;
  }) => void;
  'court-status-change': (data: {
    tournamentId: string;
    courtId: string;
    status: 'available' | 'occupied' | 'maintenance' | 'break';
    expectedDuration?: number;
  }) => void;
  'match-delay-report': (data: {
    tournamentId: string;
    matchId: string;
    delayMinutes: number;
    reason: string;
  }) => void;
  'emergency-reschedule': (data: {
    tournamentId: string;
    matchId: string;
    newCourtId?: string;
    newStartTime?: string;
    reason: string;
  }) => void;
}

export interface ServerToClientEvents {
  'schedule-updated': (data: {
    tournamentId: string;
    schedule: ScheduleSlot[];
    timestamp: string;
    reason: string;
    aiInsights?: string;
  }) => void;
  'court-status-updated': (data: {
    tournamentId: string;
    courtId: string;
    status: string;
    timestamp: string;
  }) => void;
  'match-delay-notification': (data: {
    tournamentId: string;
    matchId: string;
    delayMinutes: number;
    newStartTime: string;
    affectedMatches: string[];
    timestamp: string;
  }) => void;
  'auto-adjustment-applied': (data: {
    tournamentId: string;
    adjustmentType: string;
    affectedMatches: string[];
    aiRecommendations: string[];
    timestamp: string;
  }) => void;
  'schedule-optimization-complete': (data: {
    tournamentId: string;
    optimizationScore: number;
    insights: string;
    warnings: string[];
    timestamp: string;
  }) => void;
  'notification': (data: {
    id: string;
    tournamentId: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent' | 'success';
    timestamp: string;
    targetPlayers?: string[];
    matchId?: string;
    expiresAt?: string;
    actionUrl?: string;
    sender: {
      name: string;
      role: string;
    };
  }) => void;
  'error': (data: {
    message: string;
    code: string;
    timestamp: string;
  }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userRole: string;
  joinedTournaments: string[];
}

export class TournamentSocketServer {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

  // Store current schedules for each tournament
  private tournamentSchedules: Map<string, ScheduleSlot[]> = new Map();
  
  // Store court statuses
  private courtStatuses: Map<string, Map<string, string>> = new Map(); // tournamentId -> courtId -> status

  // Connection pool for managing WebSocket connections
  private connectionPool: WebSocketConnectionPool;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    // Initialize connection pool with performance-optimized settings
    this.connectionPool = new WebSocketConnectionPool({
      maxConnectionsPerTournament: 200,  // Allow more connections per tournament
      maxTotalConnections: 2000,         // Higher total capacity
      healthCheckInterval: 30000,        // 30 seconds
      connectionTimeout: 600000,         // 10 minutes
      messageRateLimit: 100,             // Higher message rate
      responsiveTimeThreshold: 2000      // 2 seconds
    });

    this.setupConnectionPoolListeners();
    this.setupTournamentNamespace();
    console.log('🏊 WebSocket Connection Pool initialized');
    console.log('🔌 Tournament WebSocket server initialized with connection pooling');
  }

  /**
   * Set up connection pool event listeners
   */
  private setupConnectionPoolListeners(): void {
    this.connectionPool.on('poolCapacityReached', (data) => {
      console.warn(`⚠️ Connection pool at capacity: ${data.totalConnections}/${data.maxConnections}`);
    });

    this.connectionPool.on('tournamentCapacityReached', (data) => {
      console.warn(`⚠️ Tournament ${data.tournamentId} at capacity: ${data.connections}/${data.maxConnections}`);
    });

    this.connectionPool.on('connectionError', (data) => {
      console.error(`❌ Connection error: ${data.socketId} - ${data.error}`);
    });

    this.connectionPool.on('highMessageRate', (data) => {
      console.warn(`⚠️ High message rate detected: ${data.socketId} - ${data.messageRate.toFixed(2)}/min`);
    });
  }

  private setupTournamentNamespace(): void {
    // Create tournament namespace
    const tournamentNamespace = this.io.of('/tournament');

    tournamentNamespace.on('connection', (socket: Socket) => {
      console.log(`📱 Client connected to tournament namespace: ${socket.id}`);

      // Join tournament room with connection pooling
      socket.on('join-tournament', (tournamentId: string) => {
        // Try to add to connection pool first
        const added = this.connectionPool.addConnection(socket, tournamentId, socket.data.userId);
        
        if (!added) {
          socket.emit('error', {
            message: '대회 연결 제한에 도달했습니다. 잠시 후 다시 시도해주세요.',
            code: 'TOURNAMENT_CAPACITY_REACHED',
            timestamp: new Date().toISOString()
          });
          return;
        }

        socket.join(`tournament-${tournamentId}`);
        socket.data.joinedTournaments = socket.data.joinedTournaments || [];
        if (!socket.data.joinedTournaments.includes(tournamentId)) {
          socket.data.joinedTournaments.push(tournamentId);
        }
        
        console.log(`👥 Client ${socket.id} joined tournament ${tournamentId} (Pool: ${this.connectionPool.getTournamentConnectionCount(tournamentId)} connections)`);
        
        // Send current schedule if available
        const currentSchedule = this.tournamentSchedules.get(tournamentId);
        if (currentSchedule) {
          socket.emit('schedule-updated', {
            tournamentId,
            schedule: currentSchedule,
            timestamp: new Date().toISOString(),
            reason: 'Initial schedule load'
          });
        }

        // Send current court statuses
        const courtStatus = this.courtStatuses.get(tournamentId);
        if (courtStatus) {
          for (const [courtId, status] of courtStatus.entries()) {
            socket.emit('court-status-updated', {
              tournamentId,
              courtId,
              status,
              timestamp: new Date().toISOString()
            });
          }
        }
      });

      // Leave tournament room
      socket.on('leave-tournament', (tournamentId: string) => {
        socket.leave(`tournament-${tournamentId}`);
        if (socket.data.joinedTournaments) {
          socket.data.joinedTournaments = socket.data.joinedTournaments.filter((id: string) => id !== tournamentId);
        }
        console.log(`👋 Client ${socket.id} left tournament ${tournamentId}`);
      });

      // Handle schedule update requests
      socket.on('request-schedule-update', async (data) => {
        try {
          console.log(`🔄 Schedule update requested for tournament ${data.tournamentId}`);
          
          const currentSchedule = this.tournamentSchedules.get(data.tournamentId) || [];
          
          // Get default constraints (in a real app, these would be stored in database)
          const constraints = {
            totalCourts: 4,
            courtNames: ['코트 1', '코트 2', '코트 3', '코트 4'],
            startTime: '09:00',
            endTime: '18:00',
            lunchBreakStart: '12:00',
            lunchBreakEnd: '13:00',
            matchDuration: 45,
            breakBetweenMatches: 15,
            maxConsecutiveMatches: 6,
            restDuration: 30
          };

          const adjustmentResult = await AISchedulerService.adjustScheduleRealTime(
            data.adjustment,
            currentSchedule,
            constraints
          );

          if (adjustmentResult.success) {
            // Update stored schedule
            this.tournamentSchedules.set(data.tournamentId, adjustmentResult.updatedSchedule);

            // Broadcast to all clients in the tournament
            tournamentNamespace.to(`tournament-${data.tournamentId}`).emit('schedule-updated', {
              tournamentId: data.tournamentId,
              schedule: adjustmentResult.updatedSchedule,
              timestamp: new Date().toISOString(),
              reason: data.reason,
              aiInsights: adjustmentResult.aiRecommendations.join('. ')
            });

            // Notify about cascade changes
            if (adjustmentResult.cascadeChanges.length > 0) {
              tournamentNamespace.to(`tournament-${data.tournamentId}`).emit('auto-adjustment-applied', {
                tournamentId: data.tournamentId,
                adjustmentType: data.adjustment.type,
                affectedMatches: adjustmentResult.cascadeChanges.map(c => c.matchId),
                aiRecommendations: adjustmentResult.aiRecommendations,
                timestamp: new Date().toISOString()
              });
            }
          } else {
            socket.emit('error', {
              message: '스케줄 업데이트에 실패했습니다.',
              code: 'SCHEDULE_UPDATE_FAILED',
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Schedule update error:', error);
          socket.emit('error', {
            message: '스케줄 업데이트 중 오류가 발생했습니다.',
            code: 'SCHEDULE_UPDATE_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle court status changes
      socket.on('court-status-change', (data) => {
        console.log(`🏟️ Court status change: ${data.courtId} -> ${data.status}`);
        
        // Update stored court status
        if (!this.courtStatuses.has(data.tournamentId)) {
          this.courtStatuses.set(data.tournamentId, new Map());
        }
        this.courtStatuses.get(data.tournamentId)!.set(data.courtId, data.status);

        // Broadcast to all clients in the tournament
        tournamentNamespace.to(`tournament-${data.tournamentId}`).emit('court-status-updated', {
          tournamentId: data.tournamentId,
          courtId: data.courtId,
          status: data.status,
          timestamp: new Date().toISOString()
        });

        // If court becomes unavailable, suggest schedule adjustments
        if (data.status === 'maintenance' || data.status === 'break') {
          this.handleCourtUnavailability(data.tournamentId, data.courtId, data.expectedDuration);
        }
      });

      // Handle match delay reports
      socket.on('match-delay-report', async (data) => {
        console.log(`⏰ Match delay reported: ${data.matchId} - ${data.delayMinutes} minutes`);
        
        try {
          const adjustment: RealTimeAdjustment = {
            type: 'delay',
            matchId: data.matchId,
            delayMinutes: data.delayMinutes,
            reason: data.reason,
            cascadeEffects: []
          };

          // Trigger automatic schedule adjustment
          socket.emit('request-schedule-update', {
            tournamentId: data.tournamentId,
            reason: `Match delay: ${data.reason}`,
            adjustment
          });

        } catch (error) {
          console.error('Match delay handling error:', error);
          socket.emit('error', {
            message: '경기 지연 처리 중 오류가 발생했습니다.',
            code: 'MATCH_DELAY_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle emergency reschedule requests
      socket.on('emergency-reschedule', async (data) => {
        console.log(`🚨 Emergency reschedule: ${data.matchId}`);
        
        try {
          const adjustment: RealTimeAdjustment = {
            type: data.newCourtId ? 'court_change' : 'reschedule',
            matchId: data.matchId,
            newCourtId: data.newCourtId,
            newStartTime: data.newStartTime ? new Date(data.newStartTime) : undefined,
            reason: data.reason,
            cascadeEffects: []
          };

          // Trigger schedule adjustment
          socket.emit('request-schedule-update', {
            tournamentId: data.tournamentId,
            reason: `Emergency reschedule: ${data.reason}`,
            adjustment
          });

        } catch (error) {
          console.error('Emergency reschedule error:', error);
          socket.emit('error', {
            message: '긴급 일정 변경 처리 중 오류가 발생했습니다.',
            code: 'EMERGENCY_RESCHEDULE_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`📱 Client disconnected: ${socket.id}, reason: ${reason}`);
      });
    });
  }

  /**
   * Handle court unavailability and suggest adjustments
   */
  private async handleCourtUnavailability(
    tournamentId: string,
    courtId: string,
    expectedDuration?: number
  ): Promise<void> {
    try {
      const currentSchedule = this.tournamentSchedules.get(tournamentId) || [];
      
      // Find matches scheduled on the unavailable court
      const affectedMatches = currentSchedule.filter(slot => 
        slot.courtId === courtId && 
        slot.matchId &&
        slot.startTime > new Date()
      );

      if (affectedMatches.length > 0) {
        console.log(`⚠️ Found ${affectedMatches.length} affected matches due to court unavailability`);
        
        // Emit notification about potential schedule impacts
        this.io.of('/tournament').to(`tournament-${tournamentId}`).emit('auto-adjustment-applied', {
          tournamentId,
          adjustmentType: 'court_unavailable',
          affectedMatches: affectedMatches.map(m => m.matchId!),
          aiRecommendations: [
            `${courtId}가 사용 불가능해져 ${affectedMatches.length}개 경기가 영향을 받습니다.`,
            '다른 코트로 이동하거나 일정을 조정하는 것을 권장합니다.',
            expectedDuration ? `예상 복구 시간: ${expectedDuration}분` : '복구 시간 미정'
          ],
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Court unavailability handling error:', error);
    }
  }

  /**
   * Broadcast schedule optimization result using connection pool
   */
  public broadcastScheduleOptimization(
    tournamentId: string,
    optimizationResult: any
  ): void {
    // Update stored schedule
    if (optimizationResult.success) {
      this.tournamentSchedules.set(tournamentId, optimizationResult.schedule);
    }

    // Broadcast using connection pool for better performance
    const optimizationData = {
      tournamentId,
      optimizationScore: optimizationResult.optimizationScore,
      insights: optimizationResult.aiInsights,
      warnings: optimizationResult.warnings,
      timestamp: new Date().toISOString()
    };

    const sentCount = this.connectionPool.broadcastToTournament(
      tournamentId,
      'schedule-optimization-complete',
      optimizationData
    );

    if (optimizationResult.success) {
      const scheduleData = {
        tournamentId,
        schedule: optimizationResult.schedule,
        timestamp: new Date().toISOString(),
        reason: 'AI optimization complete',
        aiInsights: optimizationResult.aiInsights
      };

      this.connectionPool.broadcastToTournament(
        tournamentId,
        'schedule-updated',
        scheduleData
      );
    }

    console.log(`📊 Schedule optimization broadcast sent to ${sentCount} connections`);
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Get current schedule for a tournament
   */
  public getTournamentSchedule(tournamentId: string): ScheduleSlot[] | undefined {
    return this.tournamentSchedules.get(tournamentId);
  }

  /**
   * Set tournament schedule
   */
  public setTournamentSchedule(tournamentId: string, schedule: ScheduleSlot[]): void {
    this.tournamentSchedules.set(tournamentId, schedule);
  }

  /**
   * Get court statuses for a tournament
   */
  public getCourtStatuses(tournamentId: string): Map<string, string> | undefined {
    return this.courtStatuses.get(tournamentId);
  }

  /**
   * Get connection pool metrics
   */
  public getConnectionPoolMetrics() {
    return this.connectionPool.getMetrics();
  }

  /**
   * Get tournament connection count
   */
  public getTournamentConnectionCount(tournamentId: string): number {
    return this.connectionPool.getTournamentConnectionCount(tournamentId);
  }

  /**
   * Send notification to tournament participants
   */
  public sendNotification(
    tournamentId: string,
    notification: {
      id?: string;
      title: string;
      message: string;
      type: 'info' | 'warning' | 'urgent' | 'success';
      targetPlayers?: string[];
      matchId?: string;
      expiresAt?: Date;
      actionUrl?: string;
      sender: {
        name: string;
        role: string;
      };
    }
  ): number {
    const notificationData = {
      id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tournamentId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: new Date().toISOString(),
      targetPlayers: notification.targetPlayers,
      matchId: notification.matchId,
      expiresAt: notification.expiresAt?.toISOString(),
      actionUrl: notification.actionUrl,
      sender: notification.sender
    };

    let sentCount = 0;

    if (notification.targetPlayers && notification.targetPlayers.length > 0) {
      // Send to specific players only
      // Note: This would require player-to-socket mapping, simplified for now
      sentCount = this.connectionPool.broadcastToTournament(
        tournamentId,
        'notification',
        notificationData
      );
    } else {
      // Send to all tournament participants
      sentCount = this.connectionPool.broadcastToTournament(
        tournamentId,
        'notification',
        notificationData
      );
    }

    console.log(`📢 Notification sent to ${sentCount} connections in tournament ${tournamentId}`);
    console.log(`📄 Message: "${notification.title}" - ${notification.message}`);

    return sentCount;
  }

  /**
   * Send match-specific notification (경기별 알림)
   */
  public sendMatchNotification(
    tournamentId: string,
    matchId: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'urgent' | 'success';
      actionUrl?: string;
      sender: {
        name: string;
        role: string;
      };
    }
  ): number {
    return this.sendNotification(tournamentId, {
      ...notification,
      matchId,
      id: `match-${matchId}-${Date.now()}`
    });
  }

  /**
   * Send urgent announcement to all tournament participants
   */
  public sendUrgentAnnouncement(
    tournamentId: string,
    title: string,
    message: string,
    sender: { name: string; role: string }
  ): number {
    return this.sendNotification(tournamentId, {
      title,
      message,
      type: 'urgent',
      sender
    });
  }

  /**
   * Send match starting soon notification
   */
  public sendMatchStartingSoon(
    tournamentId: string,
    matchId: string,
    minutesUntilStart: number,
    courtNumber: number,
    player1Name: string,
    player2Name: string
  ): number {
    return this.sendMatchNotification(tournamentId, matchId, {
      title: '경기 시작 알림',
      message: `${minutesUntilStart}분 후 경기가 시작됩니다.\n코트 ${courtNumber}: ${player1Name} vs ${player2Name}`,
      type: 'info',
      actionUrl: `/tournaments/${tournamentId}/bracket`,
      sender: {
        name: '대회 시스템',
        role: 'system'
      }
    });
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🔽 Shutting down Tournament WebSocket server...');
    
    // Close connection pool
    await this.connectionPool.shutdown();
    
    // Close Socket.IO server
    this.io.close();
    
    console.log('✅ Tournament WebSocket server shutdown complete');
  }
}

// Singleton instance
let socketServer: TournamentSocketServer | null = null;

export const initializeSocketServer = (server: HTTPServer): TournamentSocketServer => {
  if (!socketServer) {
    socketServer = new TournamentSocketServer(server);
  }
  return socketServer;
};

export const getSocketServer = (): TournamentSocketServer | null => {
  return socketServer;
};

export default TournamentSocketServer;