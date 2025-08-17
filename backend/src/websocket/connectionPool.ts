import { Socket } from 'socket.io';
import { EventEmitter } from 'events';

/**
 * WebSocket Connection Pool Manager
 * Manages connection pooling, health monitoring, and load balancing for tournament sockets
 */

export interface ConnectionMetrics {
  totalConnections: number;
  activeTournaments: number;
  messagesPerMinute: number;
  averageResponseTime: number;
  connectionErrors: number;
  lastActivity: Date;
}

export interface PooledConnection {
  socket: Socket;
  tournamentId: string;
  userId: string | null;
  joinedAt: Date;
  lastActivity: Date;
  messageCount: number;
  isHealthy: boolean;
  responseTimeHistory: number[];
}

export interface PoolConfig {
  maxConnectionsPerTournament: number;
  maxTotalConnections: number;
  healthCheckInterval: number;
  connectionTimeout: number;
  messageRateLimit: number;
  responsiveTimeThreshold: number;
}

export class WebSocketConnectionPool extends EventEmitter {
  private connections: Map<string, PooledConnection> = new Map();
  private tournamentConnections: Map<string, Set<string>> = new Map();
  private metrics: ConnectionMetrics;
  private config: PoolConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<PoolConfig> = {}) {
    super();
    
    this.config = {
      maxConnectionsPerTournament: 100,
      maxTotalConnections: 1000,
      healthCheckInterval: 30000, // 30 seconds
      connectionTimeout: 300000,  // 5 minutes
      messageRateLimit: 60,       // messages per minute
      responsiveTimeThreshold: 1000, // 1 second
      ...config
    };

    this.metrics = {
      totalConnections: 0,
      activeTournaments: 0,
      messagesPerMinute: 0,
      averageResponseTime: 0,
      connectionErrors: 0,
      lastActivity: new Date()
    };

    this.startHealthMonitoring();
    this.startPeriodicCleanup();
    
    console.log('🏊 WebSocket Connection Pool initialized');
  }

  /**
   * Add a connection to the pool
   */
  public addConnection(socket: Socket, tournamentId: string, userId?: string): boolean {
    // Check pool capacity
    if (this.connections.size >= this.config.maxTotalConnections) {
      console.warn(`⚠️ Pool at capacity (${this.config.maxTotalConnections}), rejecting connection`);
      this.emit('poolCapacityReached', { 
        totalConnections: this.connections.size,
        maxConnections: this.config.maxTotalConnections 
      });
      return false;
    }

    // Check tournament capacity
    const tournamentConnectionCount = this.getTournamentConnectionCount(tournamentId);
    if (tournamentConnectionCount >= this.config.maxConnectionsPerTournament) {
      console.warn(`⚠️ Tournament ${tournamentId} at capacity (${this.config.maxConnectionsPerTournament})`);
      this.emit('tournamentCapacityReached', { 
        tournamentId,
        connections: tournamentConnectionCount,
        maxConnections: this.config.maxConnectionsPerTournament 
      });
      return false;
    }

    // Create pooled connection
    const pooledConnection: PooledConnection = {
      socket,
      tournamentId,
      userId: userId || null,
      joinedAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      isHealthy: true,
      responseTimeHistory: []
    };

    // Add to pools
    this.connections.set(socket.id, pooledConnection);
    
    if (!this.tournamentConnections.has(tournamentId)) {
      this.tournamentConnections.set(tournamentId, new Set());
    }
    this.tournamentConnections.get(tournamentId)!.add(socket.id);

    // Set up socket event tracking
    this.setupConnectionTracking(socket);

    // Update metrics
    this.updateMetrics();

    console.log(`✅ Added connection ${socket.id} to tournament ${tournamentId} (${this.connections.size} total)`);
    
    this.emit('connectionAdded', {
      socketId: socket.id,
      tournamentId,
      userId,
      totalConnections: this.connections.size
    });

    return true;
  }

  /**
   * Remove a connection from the pool
   */
  public removeConnection(socketId: string): boolean {
    const connection = this.connections.get(socketId);
    if (!connection) {
      return false;
    }

    // Remove from tournament pool
    const tournamentSet = this.tournamentConnections.get(connection.tournamentId);
    if (tournamentSet) {
      tournamentSet.delete(socketId);
      if (tournamentSet.size === 0) {
        this.tournamentConnections.delete(connection.tournamentId);
      }
    }

    // Remove from main pool
    this.connections.delete(socketId);

    // Update metrics
    this.updateMetrics();

    console.log(`🗑️ Removed connection ${socketId} from tournament ${connection.tournamentId} (${this.connections.size} total)`);
    
    this.emit('connectionRemoved', {
      socketId,
      tournamentId: connection.tournamentId,
      userId: connection.userId,
      totalConnections: this.connections.size,
      sessionDuration: Date.now() - connection.joinedAt.getTime()
    });

    return true;
  }

  /**
   * Set up connection tracking for socket events
   */
  private setupConnectionTracking(socket: Socket): void {
    const connection = this.connections.get(socket.id);
    if (!connection) return;

    // Track message activity
    const originalEmit = socket.emit.bind(socket);
    socket.emit = (event: any, ...args: any[]) => {
      this.trackMessage(socket.id, 'outbound');
      return originalEmit(event, ...args);
    };

    // Track incoming messages
    socket.onAny(() => {
      this.trackMessage(socket.id, 'inbound');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.removeConnection(socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      this.handleConnectionError(socket.id, error);
    });
  }

  /**
   * Track message activity for a connection
   */
  private trackMessage(socketId: string, direction: 'inbound' | 'outbound'): void {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    connection.lastActivity = new Date();
    connection.messageCount++;

    // Track response time for outbound messages
    if (direction === 'outbound') {
      const responseTime = Date.now() - connection.lastActivity.getTime();
      connection.responseTimeHistory.push(responseTime);
      
      // Keep only last 10 measurements
      if (connection.responseTimeHistory.length > 10) {
        connection.responseTimeHistory.shift();
      }
    }

    this.metrics.lastActivity = new Date();
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(socketId: string, error: Error): void {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    connection.isHealthy = false;
    this.metrics.connectionErrors++;

    console.error(`❌ Connection error for ${socketId}:`, error.message);
    
    this.emit('connectionError', {
      socketId,
      tournamentId: connection.tournamentId,
      error: error.message,
      timestamp: new Date()
    });

    // Consider removing unhealthy connections
    if (this.shouldRemoveUnhealthyConnection(connection)) {
      this.removeConnection(socketId);
    }
  }

  /**
   * Determine if an unhealthy connection should be removed
   */
  private shouldRemoveUnhealthyConnection(connection: PooledConnection): boolean {
    // Remove if inactive for too long
    const inactiveTime = Date.now() - connection.lastActivity.getTime();
    if (inactiveTime > this.config.connectionTimeout) {
      return true;
    }

    // Remove if average response time is too high
    if (connection.responseTimeHistory.length >= 5) {
      const avgResponseTime = connection.responseTimeHistory.reduce((a, b) => a + b, 0) / connection.responseTimeHistory.length;
      if (avgResponseTime > this.config.responsiveTimeThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check on all connections
   */
  private performHealthCheck(): void {
    const now = Date.now();
    const unhealthyConnections: string[] = [];

    for (const [socketId, connection] of this.connections.entries()) {
      // Check for inactive connections
      const inactiveTime = now - connection.lastActivity.getTime();
      if (inactiveTime > this.config.connectionTimeout) {
        unhealthyConnections.push(socketId);
        continue;
      }

      // Check message rate
      const timeSinceJoin = now - connection.joinedAt.getTime();
      const messageRate = (connection.messageCount / (timeSinceJoin / 60000)); // messages per minute
      
      if (messageRate > this.config.messageRateLimit) {
        console.warn(`⚠️ High message rate detected for ${socketId}: ${messageRate.toFixed(2)}/min`);
        this.emit('highMessageRate', {
          socketId,
          tournamentId: connection.tournamentId,
          messageRate
        });
      }

      // Ping connection to verify it's still responsive
      try {
        connection.socket.emit('ping', { timestamp: now });
      } catch (error) {
        unhealthyConnections.push(socketId);
      }
    }

    // Remove unhealthy connections
    for (const socketId of unhealthyConnections) {
      console.log(`🔧 Removing unhealthy connection: ${socketId}`);
      this.removeConnection(socketId);
    }

    // Update metrics
    this.updateMetrics();

    console.log(`🔍 Health check completed: ${this.connections.size} active connections, ${unhealthyConnections.length} removed`);
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 60000); // Every minute
  }

  /**
   * Perform periodic cleanup
   */
  private performCleanup(): void {
    // Clean up empty tournament connection sets
    for (const [tournamentId, connectionSet] of this.tournamentConnections.entries()) {
      if (connectionSet.size === 0) {
        this.tournamentConnections.delete(tournamentId);
      }
    }

    // Reset hourly error count
    this.metrics.connectionErrors = Math.max(0, this.metrics.connectionErrors - 1);
  }

  /**
   * Update pool metrics
   */
  private updateMetrics(): void {
    this.metrics.totalConnections = this.connections.size;
    this.metrics.activeTournaments = this.tournamentConnections.size;

    // Calculate average response time
    const allResponseTimes: number[] = [];
    for (const connection of this.connections.values()) {
      allResponseTimes.push(...connection.responseTimeHistory);
    }
    
    if (allResponseTimes.length > 0) {
      this.metrics.averageResponseTime = allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;
    }

    // Calculate messages per minute
    const totalMessages = Array.from(this.connections.values()).reduce((sum, conn) => sum + conn.messageCount, 0);
    const totalActiveTime = Array.from(this.connections.values()).reduce((sum, conn) => {
      return sum + (Date.now() - conn.joinedAt.getTime());
    }, 0);
    
    if (totalActiveTime > 0) {
      this.metrics.messagesPerMinute = (totalMessages / (totalActiveTime / 60000));
    }
  }

  /**
   * Get tournament connection count
   */
  public getTournamentConnectionCount(tournamentId: string): number {
    return this.tournamentConnections.get(tournamentId)?.size || 0;
  }

  /**
   * Get connections for a tournament
   */
  public getTournamentConnections(tournamentId: string): PooledConnection[] {
    const socketIds = this.tournamentConnections.get(tournamentId);
    if (!socketIds) return [];

    return Array.from(socketIds)
      .map(socketId => this.connections.get(socketId))
      .filter((conn): conn is PooledConnection => conn !== undefined);
  }

  /**
   * Get pool metrics
   */
  public getMetrics(): ConnectionMetrics & {
    poolConfig: PoolConfig;
    detailedStats: {
      tournamentDistribution: { [tournamentId: string]: number };
      connectionsByUser: { [userId: string]: number };
      healthyConnections: number;
    };
  } {
    // Calculate tournament distribution
    const tournamentDistribution: { [tournamentId: string]: number } = {};
    for (const [tournamentId, connectionSet] of this.tournamentConnections.entries()) {
      tournamentDistribution[tournamentId] = connectionSet.size;
    }

    // Calculate connections by user
    const connectionsByUser: { [userId: string]: number } = {};
    for (const connection of this.connections.values()) {
      if (connection.userId) {
        connectionsByUser[connection.userId] = (connectionsByUser[connection.userId] || 0) + 1;
      }
    }

    // Calculate healthy connections
    const healthyConnections = Array.from(this.connections.values()).filter(conn => conn.isHealthy).length;

    return {
      ...this.metrics,
      poolConfig: this.config,
      detailedStats: {
        tournamentDistribution,
        connectionsByUser,
        healthyConnections
      }
    };
  }

  /**
   * Broadcast message to tournament connections
   */
  public broadcastToTournament(tournamentId: string, event: string, data: any): number {
    const connections = this.getTournamentConnections(tournamentId);
    let sentCount = 0;

    for (const connection of connections) {
      if (connection.isHealthy) {
        try {
          connection.socket.emit(event, data);
          sentCount++;
        } catch (error) {
          this.handleConnectionError(connection.socket.id, error as Error);
        }
      }
    }

    console.log(`📡 Broadcast to tournament ${tournamentId}: ${sentCount}/${connections.length} successful`);
    return sentCount;
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🔽 Shutting down WebSocket Connection Pool...');

    // Clear timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Gracefully close all connections
    const disconnectPromises: Promise<void>[] = [];
    
    for (const socketId of this.connections.keys()) {
      disconnectPromises.push(new Promise<void>((resolve) => {
        const connection = this.connections.get(socketId);
        if (connection) {
          connection.socket.disconnect(true);
        }
        resolve();
      }));
    }

    await Promise.all(disconnectPromises);

    // Clear pools
    this.connections.clear();
    this.tournamentConnections.clear();

    console.log('✅ WebSocket Connection Pool shutdown complete');
  }
}

export default WebSocketConnectionPool;