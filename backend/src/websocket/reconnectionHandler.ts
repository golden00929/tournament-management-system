/**
 * WebSocket Reconnection Handler
 * Server-side component that manages reconnection logic, session persistence,
 * and coordinates with the connection pool for seamless reconnections
 */

import { Socket } from 'socket.io';
import { EventEmitter } from 'events';
import WebSocketConnectionPool from './connectionPool';

export interface SessionData {
  userId: string | null;
  tournamentId: string;
  lastActivity: Date;
  messageHistory: Array<{ event: string; data: any; timestamp: Date }>;
  subscriptions: string[];
  reconnectionCount: number;
}

export interface ReconnectionMetrics {
  totalReconnections: number;
  averageReconnectionTime: number;
  successfulReconnections: number;
  failedReconnections: number;
  sessionRecoveries: number;
  dataLossEvents: number;
}

export class WebSocketReconnectionHandler extends EventEmitter {
  private connectionPool: WebSocketConnectionPool;
  private sessions: Map<string, SessionData> = new Map();
  private socketToSession: Map<string, string> = new Map();
  private metrics: ReconnectionMetrics;
  private sessionCleanupTimer: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 300000; // 5 minutes
  private readonly MESSAGE_HISTORY_LIMIT = 50;

  constructor(connectionPool: WebSocketConnectionPool) {
    super();
    this.connectionPool = connectionPool;
    
    this.metrics = {
      totalReconnections: 0,
      averageReconnectionTime: 0,
      successfulReconnections: 0,
      failedReconnections: 0,
      sessionRecoveries: 0,
      dataLossEvents: 0
    };

    this.startSessionCleanup();
    console.log('🔄 WebSocket Reconnection Handler initialized');
  }

  /**
   * Handle new socket connection
   */
  public handleConnection(socket: Socket, tournamentId: string, userId?: string): void {
    const sessionId = this.generateSessionId(userId || null, tournamentId);
    
    // Check for existing session
    const existingSession = this.sessions.get(sessionId);
    if (existingSession) {
      console.log(`🔄 Reconnection detected for session: ${sessionId}`);
      this.handleReconnection(socket, sessionId, existingSession);
    } else {
      console.log(`🆕 New session created: ${sessionId}`);
      this.createNewSession(socket, sessionId, tournamentId, userId);
    }

    this.setupSocketHandlers(socket, sessionId);
  }

  /**
   * Handle socket disconnection
   */
  public handleDisconnection(socket: Socket, reason: string): void {
    const sessionId = this.socketToSession.get(socket.id);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}, session: ${sessionId}`);

    // Update session data
    session.lastActivity = new Date();
    
    // Remove socket mapping but keep session for potential reconnection
    this.socketToSession.delete(socket.id);

    // Emit disconnection event
    this.emit('client-disconnected', {
      sessionId,
      socketId: socket.id,
      userId: session.userId,
      tournamentId: session.tournamentId,
      reason,
      canReconnect: this.isReconnectionEligible(reason)
    });

    // Schedule session cleanup if no reconnection happens
    setTimeout(() => {
      this.cleanupSessionIfStale(sessionId);
    }, this.SESSION_TIMEOUT);
  }

  /**
   * Handle reconnection for existing session
   */
  private handleReconnection(socket: Socket, sessionId: string, session: SessionData): void {
    const reconnectionStart = Date.now();
    
    session.reconnectionCount++;
    session.lastActivity = new Date();
    this.socketToSession.set(socket.id, sessionId);

    // Update metrics
    this.metrics.totalReconnections++;
    
    try {
      // Restore subscriptions
      this.restoreSubscriptions(socket, session);
      
      // Send missed messages (if any)
      this.sendMissedMessages(socket, session);
      
      // Sync current tournament state
      this.syncTournamentState(socket, session.tournamentId);
      
      const reconnectionTime = Date.now() - reconnectionStart;
      this.updateReconnectionMetrics(reconnectionTime, true);
      
      console.log(`✅ Session ${sessionId} reconnected successfully in ${reconnectionTime}ms`);
      
      // Notify client of successful reconnection
      socket.emit('reconnection-success', {
        sessionId,
        reconnectionCount: session.reconnectionCount,
        missedMessages: session.messageHistory.length,
        subscriptions: session.subscriptions
      });

      this.emit('client-reconnected', {
        sessionId,
        socketId: socket.id,
        userId: session.userId,
        tournamentId: session.tournamentId,
        reconnectionTime,
        reconnectionCount: session.reconnectionCount
      });

      this.metrics.successfulReconnections++;
      this.metrics.sessionRecoveries++;

    } catch (error) {
      console.error(`❌ Failed to restore session ${sessionId}:`, error);
      this.updateReconnectionMetrics(Date.now() - reconnectionStart, false);
      this.metrics.failedReconnections++;
      this.metrics.dataLossEvents++;
      
      // Fallback to new session
      this.createNewSession(socket, sessionId, session.tournamentId, session.userId || undefined);
    }
  }

  /**
   * Create new session for first-time connection
   */
  private createNewSession(socket: Socket, sessionId: string, tournamentId: string, userId?: string): void {
    const session: SessionData = {
      userId: userId || null,
      tournamentId,
      lastActivity: new Date(),
      messageHistory: [],
      subscriptions: [],
      reconnectionCount: 0
    };

    this.sessions.set(sessionId, session);
    this.socketToSession.set(socket.id, sessionId);

    // Welcome message
    socket.emit('session-created', {
      sessionId,
      tournamentId,
      serverCapabilities: {
        reconnection: true,
        messageHistory: true,
        sessionPersistence: true
      }
    });

    this.emit('session-created', {
      sessionId,
      socketId: socket.id,
      userId,
      tournamentId
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(socket: Socket, sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Track message activity
    socket.onAny((event, data) => {
      session.lastActivity = new Date();
      this.trackMessage(sessionId, event, data);
    });

    // Handle subscription requests
    socket.on('subscribe', (data) => {
      this.handleSubscription(socket, sessionId, data);
    });

    socket.on('unsubscribe', (data) => {
      this.handleUnsubscription(sessionId, data);
    });

    // Handle ping for health check
    socket.on('ping', (data) => {
      socket.emit('pong', { ...data, serverTime: Date.now() });
    });

    // Handle client-side reconnection status
    socket.on('client-reconnection-status', (data) => {
      console.log(`📱 Client reconnection status for ${sessionId}:`, data);
    });
  }

  /**
   * Restore subscriptions after reconnection
   */
  private restoreSubscriptions(socket: Socket, session: SessionData): void {
    for (const subscription of session.subscriptions) {
      try {
        socket.join(subscription);
        console.log(`🔔 Restored subscription: ${subscription} for session ${this.getSessionId(session)}`);
      } catch (error) {
        console.error(`❌ Failed to restore subscription ${subscription}:`, error);
      }
    }
  }

  /**
   * Send missed messages to reconnected client
   */
  private sendMissedMessages(socket: Socket, session: SessionData): void {
    if (session.messageHistory.length === 0) return;

    console.log(`📨 Sending ${session.messageHistory.length} missed messages`);
    
    socket.emit('missed-messages', {
      messages: session.messageHistory,
      count: session.messageHistory.length
    });

    // Clear message history after sending
    session.messageHistory = [];
  }

  /**
   * Sync current tournament state with reconnected client
   */
  private async syncTournamentState(socket: Socket, tournamentId: string): Promise<void> {
    try {
      // This would fetch current tournament state from database
      // For now, we'll emit a sync request event
      socket.emit('state-sync-required', {
        tournamentId,
        timestamp: Date.now(),
        reason: 'reconnection'
      });

      console.log(`🔄 State sync requested for tournament: ${tournamentId}`);
    } catch (error) {
      console.error(`❌ Failed to sync tournament state:`, error);
    }
  }

  /**
   * Handle subscription to tournament events
   */
  private handleSubscription(socket: Socket, sessionId: string, data: { events: string[] }): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const event of data.events) {
      const room = `${session.tournamentId}:${event}`;
      socket.join(room);
      
      if (!session.subscriptions.includes(room)) {
        session.subscriptions.push(room);
      }
    }

    socket.emit('subscription-confirmed', {
      events: data.events,
      tournamentId: session.tournamentId
    });

    console.log(`🔔 Subscriptions added for session ${sessionId}:`, data.events);
  }

  /**
   * Handle unsubscription from tournament events
   */
  private handleUnsubscription(sessionId: string, data: { events: string[] }): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const event of data.events) {
      const room = `${session.tournamentId}:${event}`;
      const index = session.subscriptions.indexOf(room);
      if (index > -1) {
        session.subscriptions.splice(index, 1);
      }
    }

    console.log(`🔕 Subscriptions removed for session ${sessionId}:`, data.events);
  }

  /**
   * Track message for potential replay
   */
  private trackMessage(sessionId: string, event: string, data: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Only track certain events that might be important for replay
    const trackableEvents = [
      'match-update', 'bracket-update', 'participant-update',
      'tournament-status-change', 'score-update'
    ];

    if (trackableEvents.includes(event)) {
      session.messageHistory.push({
        event,
        data,
        timestamp: new Date()
      });

      // Limit message history size
      if (session.messageHistory.length > this.MESSAGE_HISTORY_LIMIT) {
        session.messageHistory.shift();
      }
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(userId: string | null, tournamentId: string): string {
    const userPart = userId || 'anonymous';
    return `${userPart}:${tournamentId}`;
  }

  /**
   * Get session ID from session data
   */
  private getSessionId(session: SessionData): string {
    return this.generateSessionId(session.userId, session.tournamentId);
  }

  /**
   * Check if reconnection is eligible based on disconnection reason
   */
  private isReconnectionEligible(reason: string): boolean {
    const nonReconnectableReasons = [
      'client namespace disconnect',
      'server shutting down'
    ];
    
    return !nonReconnectableReasons.includes(reason);
  }

  /**
   * Update reconnection metrics
   */
  private updateReconnectionMetrics(reconnectionTime: number, success: boolean): void {
    if (success) {
      // Update average reconnection time
      const totalTime = this.metrics.averageReconnectionTime * this.metrics.successfulReconnections;
      this.metrics.averageReconnectionTime = (totalTime + reconnectionTime) / (this.metrics.successfulReconnections + 1);
    }
  }

  /**
   * Start session cleanup timer
   */
  private startSessionCleanup(): void {
    this.sessionCleanupTimer = setInterval(() => {
      this.cleanupStaleSessions();
    }, 60000); // Every minute
  }

  /**
   * Clean up stale sessions
   */
  private cleanupStaleSessions(): void {
    const now = Date.now();
    const staleSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveTime = now - session.lastActivity.getTime();
      if (inactiveTime > this.SESSION_TIMEOUT) {
        staleSessions.push(sessionId);
      }
    }

    for (const sessionId of staleSessions) {
      this.sessions.delete(sessionId);
      console.log(`🗑️ Cleaned up stale session: ${sessionId}`);
    }

    if (staleSessions.length > 0) {
      console.log(`🧹 Cleaned up ${staleSessions.length} stale sessions`);
    }
  }

  /**
   * Clean up specific session if stale
   */
  private cleanupSessionIfStale(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const inactiveTime = Date.now() - session.lastActivity.getTime();
    if (inactiveTime >= this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      console.log(`🗑️ Cleaned up stale session after timeout: ${sessionId}`);
    }
  }

  /**
   * Broadcast to tournament with session tracking
   */
  public broadcastToTournament(tournamentId: string, event: string, data: any): void {
    // Track this message for all sessions in the tournament
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.tournamentId === tournamentId) {
        this.trackMessage(sessionId, event, data);
      }
    }

    // Use connection pool for actual broadcasting
    this.connectionPool.broadcastToTournament(tournamentId, event, data);
  }

  /**
   * Get reconnection metrics
   */
  public getMetrics(): ReconnectionMetrics & {
    activeSessions: number;
    totalSessions: number;
    averageSessionAge: number;
  } {
    const activeSessions = this.sessions.size;
    const now = Date.now();
    let totalAge = 0;

    for (const session of this.sessions.values()) {
      totalAge += now - session.lastActivity.getTime();
    }

    const averageSessionAge = activeSessions > 0 ? totalAge / activeSessions : 0;

    return {
      ...this.metrics,
      activeSessions,
      totalSessions: this.sessions.size,
      averageSessionAge
    };
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🔽 Shutting down WebSocket Reconnection Handler...');

    if (this.sessionCleanupTimer) {
      clearInterval(this.sessionCleanupTimer);
    }

    // Notify all connected clients about shutdown
    for (const [sessionId, session] of this.sessions.entries()) {
      const socketId = Array.from(this.socketToSession.entries())
        .find(([, sId]) => sId === sessionId)?.[0];
      
      if (socketId) {
        // Emit shutdown notice to client
        this.emit('server-shutdown', { sessionId, gracefulShutdown: true });
      }
    }

    this.sessions.clear();
    this.socketToSession.clear();

    console.log('✅ WebSocket Reconnection Handler shutdown complete');
  }
}

export default WebSocketReconnectionHandler;