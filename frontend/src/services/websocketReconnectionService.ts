/**
 * WebSocket Reconnection Service
 * Provides automatic reconnection with exponential backoff, connection state management,
 * and seamless recovery for tournament real-time features
 */

// import { io, Socket } from 'socket.io-client';
import { io, MockSocket as Socket } from './mockWebSocketService';

export interface ReconnectionConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  connectionTimeout: number;
  heartbeatInterval: number;
  autoReconnect: boolean;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  retryCount: number;
  lastError?: string;
  lastConnected?: Date;
  lastDisconnected?: Date;
  totalReconnections: number;
  isHealthy: boolean;
}

export interface WebSocketEvents {
  'connection-status': (state: ConnectionState) => void;
  'reconnection-attempt': (attempt: number, delay: number) => void;
  'reconnection-success': () => void;
  'reconnection-failed': (error: string) => void;
  'heartbeat-timeout': () => void;
  'data-sync-required': () => void;
}

export class WebSocketReconnectionService {
  private socket: Socket | null = null;
  private config: ReconnectionConfig;
  private state: ConnectionState;
  private reconnectionTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<keyof WebSocketEvents, Function[]> = new Map();
  private serverUrl: string;
  private tournamentId: string;
  private authToken: string | null = null;
  private isManualDisconnect = false;
  private messageQueue: Array<{ event: string; data: any }> = [];
  private lastHeartbeat: Date | null = null;

  constructor(
    serverUrl: string, 
    tournamentId: string,
    config: Partial<ReconnectionConfig> = {}
  ) {
    this.serverUrl = serverUrl;
    this.tournamentId = tournamentId;
    
    this.config = {
      maxRetries: 10,
      initialDelay: 1000,        // 1 second
      maxDelay: 30000,           // 30 seconds
      backoffMultiplier: 1.5,
      connectionTimeout: 10000,   // 10 seconds
      heartbeatInterval: 25000,   // 25 seconds
      autoReconnect: true,
      ...config
    };

    this.state = {
      status: 'disconnected',
      retryCount: 0,
      totalReconnections: 0,
      isHealthy: false
    };

    this.setupEventListeners();
    console.log('🔄 WebSocket Reconnection Service initialized');
  }

  /**
   * Connect to the WebSocket server
   */
  public async connect(authToken?: string): Promise<boolean> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      console.warn('🔌 Already connected or connecting');
      return true;
    }

    this.authToken = authToken || this.authToken;
    this.isManualDisconnect = false;
    
    return this.attemptConnection();
  }

  /**
   * Manually disconnect from the server
   */
  public disconnect(): void {
    console.log('🔌 Manual disconnect requested');
    this.isManualDisconnect = true;
    this.clearTimers();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.updateState({
      status: 'disconnected',
      retryCount: 0
    });
  }

  /**
   * Send message with automatic queuing if disconnected
   */
  public emit(event: string, data: any): boolean {
    if (this.state.status === 'connected' && this.socket) {
      try {
        this.socket.emit(event, data);
        return true;
      } catch (error) {
        console.error('❌ Error sending message:', error);
        this.handleConnectionError(error as Error);
        return false;
      }
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push({ event, data });
      console.log(`📦 Queued message: ${event} (${this.messageQueue.length} in queue)`);
      
      // Trigger reconnection if not already attempting
      if (this.config.autoReconnect && this.state.status === 'disconnected') {
        this.attemptReconnection();
      }
      
      return false;
    }
  }

  /**
   * Subscribe to socket events
   */
  public on(event: string, callback: Function): void {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // Store callback for when connection is established
      console.log(`📝 Storing event listener for: ${event}`);
    }
  }

  /**
   * Unsubscribe from socket events
   */
  public off(event: string, callback?: Function): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Subscribe to reconnection service events
   */
  public addEventListener<K extends keyof WebSocketEvents>(
    event: K, 
    callback: WebSocketEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from reconnection service events
   */
  public removeEventListener<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Get connection health status
   */
  public isHealthy(): boolean {
    return this.state.isHealthy && this.state.status === 'connected';
  }

  /**
   * Force reconnection attempt
   */
  public forceReconnect(): void {
    console.log('🔄 Force reconnect requested');
    if (this.socket) {
      this.socket.disconnect();
    }
    this.attemptReconnection();
  }

  /**
   * Attempt initial connection
   */
  private async attemptConnection(): Promise<boolean> {
    this.updateState({ status: 'connecting' });

    return new Promise((resolve) => {
      try {
        console.log(`🔌 Connecting to ${this.serverUrl}...`);

        this.socket = io(this.serverUrl, {
          timeout: this.config.connectionTimeout,
          autoConnect: false,
          auth: this.authToken ? { token: this.authToken } : undefined,
          query: {
            tournamentId: this.tournamentId
          }
        });

        this.setupSocketListeners();

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          console.error('⏰ Connection timeout');
          this.handleConnectionError(new Error('Connection timeout'));
          resolve(false);
        }, this.config.connectionTimeout);

        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout);
          this.handleConnectionSuccess();
          resolve(true);
        });

        this.socket.on('connect_error', (error: any) => {
          clearTimeout(connectionTimeout);
          this.handleConnectionError(error);
          resolve(false);
        });

        this.socket.connect();

      } catch (error) {
        this.handleConnectionError(error as Error);
        resolve(false);
      }
    });
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason: any) => {
      console.log(`🔌 Disconnected: ${reason}`);
      this.handleDisconnection(reason);
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      this.handleConnectionError(error);
    });

    this.socket.on('pong', () => {
      this.lastHeartbeat = new Date();
      this.updateState({ isHealthy: true });
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Socket.io reconnected');
      this.handleConnectionSuccess();
    });

    this.socket.on('reconnect_error', (error: any) => {
      console.error('🔄 Socket.io reconnection error:', error);
      this.handleConnectionError(error);
    });
  }

  /**
   * Handle successful connection
   */
  private handleConnectionSuccess(): void {
    console.log('✅ WebSocket connected successfully');
    
    this.updateState({
      status: 'connected',
      retryCount: 0,
      lastConnected: new Date(),
      isHealthy: true
    });

    this.clearTimers();
    this.startHeartbeat();
    this.flushMessageQueue();
    this.emitEvent('reconnection-success');
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    console.error('❌ Connection error:', error.message);
    
    this.updateState({
      status: 'failed',
      lastError: error.message,
      isHealthy: false
    });

    if (this.config.autoReconnect && !this.isManualDisconnect) {
      this.attemptReconnection();
    }

    this.emitEvent('reconnection-failed', error.message);
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(reason: string): void {
    this.updateState({
      status: 'disconnected',
      lastDisconnected: new Date(),
      lastError: reason,
      isHealthy: false
    });

    this.clearTimers();

    if (this.config.autoReconnect && !this.isManualDisconnect && reason !== 'io client disconnect') {
      console.log(`🔄 Auto-reconnecting due to: ${reason}`);
      this.attemptReconnection();
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnection(): void {
    if (this.state.retryCount >= this.config.maxRetries) {
      console.error(`❌ Max reconnection attempts reached (${this.config.maxRetries})`);
      this.updateState({ 
        status: 'failed',
        lastError: 'Max reconnection attempts exceeded'
      });
      this.emitEvent('reconnection-failed', 'Max attempts exceeded');
      return;
    }

    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
    }

    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, this.state.retryCount),
      this.config.maxDelay
    );

    this.updateState({
      status: 'reconnecting',
      retryCount: this.state.retryCount + 1
    });

    console.log(`🔄 Reconnection attempt ${this.state.retryCount}/${this.config.maxRetries} in ${delay}ms`);
    this.emitEvent('reconnection-attempt', this.state.retryCount, delay);

    this.reconnectionTimer = setTimeout(() => {
      this.attemptConnection().then((success) => {
        if (success) {
          this.updateState({ totalReconnections: this.state.totalReconnections + 1 });
        }
      });
    }, delay);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.state.status === 'connected') {
        this.socket.emit('ping', { timestamp: Date.now() });
        
        // Check if last heartbeat was too long ago
        if (this.lastHeartbeat) {
          const timeSinceHeartbeat = Date.now() - this.lastHeartbeat.getTime();
          if (timeSinceHeartbeat > this.config.heartbeatInterval * 2) {
            console.warn('💔 Heartbeat timeout detected');
            this.updateState({ isHealthy: false });
            this.emitEvent('heartbeat-timeout');
            
            // Force reconnection if heartbeat fails
            if (this.config.autoReconnect) {
              this.forceReconnect();
            }
          }
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Flush queued messages after reconnection
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`📤 Flushing ${this.messageQueue.length} queued messages`);
    
    const queueCopy = [...this.messageQueue];
    this.messageQueue = [];

    for (const { event, data } of queueCopy) {
      this.emit(event, data);
    }

    // Emit data sync required event for the frontend to refresh
    this.emitEvent('data-sync-required');
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Update connection state and emit event
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.emitEvent('connection-status', this.state);
  }

  /**
   * Emit reconnection service event
   */
  private emitEvent<K extends keyof WebSocketEvents>(
    event: K,
    ...args: Parameters<WebSocketEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Setup default event listeners for debugging
   */
  private setupEventListeners(): void {
    this.addEventListener('connection-status', (state) => {
      console.log(`🔄 Connection status: ${state.status}${state.retryCount > 0 ? ` (attempt ${state.retryCount})` : ''}`);
    });

    this.addEventListener('reconnection-attempt', (attempt, delay) => {
      console.log(`🔄 Reconnection attempt ${attempt} scheduled in ${delay}ms`);
    });

    this.addEventListener('reconnection-success', () => {
      console.log('✅ Successfully reconnected to WebSocket');
    });

    this.addEventListener('reconnection-failed', (error) => {
      console.error(`❌ Reconnection failed: ${error}`);
    });

    this.addEventListener('heartbeat-timeout', () => {
      console.warn('💔 Heartbeat timeout - connection may be unstable');
    });

    this.addEventListener('data-sync-required', () => {
      console.log('🔄 Data sync required after reconnection');
    });
  }

  /**
   * Get reconnection statistics
   */
  public getStatistics(): {
    totalReconnections: number;
    currentRetryCount: number;
    uptime: number;
    isHealthy: boolean;
    queuedMessages: number;
    lastError?: string;
  } {
    const uptime = this.state.lastConnected 
      ? Date.now() - this.state.lastConnected.getTime() 
      : 0;

    return {
      totalReconnections: this.state.totalReconnections,
      currentRetryCount: this.state.retryCount,
      uptime,
      isHealthy: this.state.isHealthy,
      queuedMessages: this.messageQueue.length,
      lastError: this.state.lastError
    };
  }

  /**
   * Cleanup and destroy the service
   */
  public destroy(): void {
    console.log('🗑️ Destroying WebSocket Reconnection Service');
    
    this.isManualDisconnect = true;
    this.clearTimers();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.messageQueue = [];
    this.eventListeners.clear();
    
    this.updateState({
      status: 'disconnected',
      isHealthy: false
    });
  }
}

export default WebSocketReconnectionService;