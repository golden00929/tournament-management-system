/**
 * React Hook for WebSocket Reconnection
 * Provides easy integration of WebSocket reconnection service with React components
 * Manages connection state, automatic cleanup, and provides tournament-specific events
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import WebSocketReconnectionService, { 
  ConnectionState, 
  ReconnectionConfig 
} from '../services/websocketReconnectionService';

export interface WebSocketHookConfig extends Partial<ReconnectionConfig> {
  autoConnect?: boolean;
  serverUrl?: string;
}

export interface WebSocketHookState {
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  statistics: {
    totalReconnections: number;
    currentRetryCount: number;
    uptime: number;
    isHealthy: boolean;
    queuedMessages: number;
    lastError?: string;
  };
}

export interface WebSocketHookActions {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  forceReconnect: () => void;
  emit: (event: string, data: any) => boolean;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
  isHealthy: () => boolean;
}

const DEFAULT_CONFIG: WebSocketHookConfig = {
  autoConnect: true,
  serverUrl: process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000',
  maxRetries: 10,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 1.5,
  connectionTimeout: 10000,
  heartbeatInterval: 25000,
  autoReconnect: true
};

/**
 * Hook for WebSocket connection with automatic reconnection
 */
export function useWebSocketReconnection(
  tournamentId: string,
  config: WebSocketHookConfig = {}
): [WebSocketHookState, WebSocketHookActions] {
  const auth = useSelector((state: RootState) => state.auth);
  const serviceRef = useRef<WebSocketReconnectionService | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    retryCount: 0,
    totalReconnections: 0,
    isHealthy: false
  });
  const [statistics, setStatistics] = useState({
    totalReconnections: 0,
    currentRetryCount: 0,
    uptime: 0,
    isHealthy: false,
    queuedMessages: 0
  });

  // Initialize WebSocket service
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!tournamentId) return;

    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    console.log(`🔌 Initializing WebSocket for tournament: ${tournamentId}`);
    
    serviceRef.current = new WebSocketReconnectionService(
      mergedConfig.serverUrl!,
      tournamentId,
      mergedConfig
    );

    // Set up event listeners
    const service = serviceRef.current;

    service.addEventListener('connection-status', (state) => {
      setConnectionState(state);
      setStatistics(service.getStatistics());
    });

    service.addEventListener('reconnection-attempt', (attempt, delay) => {
      console.log(`🔄 Reconnection attempt ${attempt} in ${delay}ms`);
      setStatistics(service.getStatistics());
    });

    service.addEventListener('reconnection-success', () => {
      console.log('✅ WebSocket reconnected successfully');
      setStatistics(service.getStatistics());
      
      // Refresh any cached data after reconnection
      // This would trigger data refetch in the parent component
    });

    service.addEventListener('reconnection-failed', (error) => {
      console.error(`❌ WebSocket reconnection failed: ${error}`);
      setStatistics(service.getStatistics());
    });

    service.addEventListener('heartbeat-timeout', () => {
      console.warn('💔 WebSocket heartbeat timeout');
      setStatistics(service.getStatistics());
    });

    service.addEventListener('data-sync-required', () => {
      console.log('🔄 Data sync required - refreshing tournament data');
      // This could trigger a global event for components to refresh their data
      window.dispatchEvent(new CustomEvent('websocket-data-sync', {
        detail: { tournamentId }
      }));
    });

    // Auto-connect if enabled
    if (mergedConfig.autoConnect) {
      service.connect(auth.token || undefined);
    }

    return () => {
      if (service) {
        console.log('🗑️ Cleaning up WebSocket service');
        service.destroy();
      }
    };
  }, [tournamentId, auth.token]); // Re-initialize if tournament or auth changes

  // Update statistics periodically
  useEffect(() => {
    if (!serviceRef.current) return;

    const interval = setInterval(() => {
      if (serviceRef.current) {
        setStatistics(serviceRef.current.getStatistics());
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Hook actions
  const connect = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current) return false;
    return await serviceRef.current.connect(auth.token || undefined);
  }, [auth.token]);

  const disconnect = useCallback((): void => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }
  }, []);

  const forceReconnect = useCallback((): void => {
    if (serviceRef.current) {
      serviceRef.current.forceReconnect();
    }
  }, []);

  const emit = useCallback((event: string, data: any): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: Function): void => {
    if (serviceRef.current) {
      serviceRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: Function): void => {
    if (serviceRef.current) {
      serviceRef.current.off(event, callback);
    }
  }, []);

  const isHealthy = useCallback((): boolean => {
    return serviceRef.current?.isHealthy() || false;
  }, []);

  // Hook state
  const state: WebSocketHookState = {
    connectionState,
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    isReconnecting: connectionState.status === 'reconnecting',
    statistics
  };

  const actions: WebSocketHookActions = {
    connect,
    disconnect,
    forceReconnect,
    emit,
    on,
    off,
    isHealthy
  };

  return [state, actions];
}

/**
 * Hook for tournament-specific WebSocket events
 */
export function useTournamentWebSocket(tournamentId: string) {
  const [state, actions] = useWebSocketReconnection(tournamentId);
  
  // Tournament-specific event helpers
  const subscribeToMatches = useCallback((callback: (match: any) => void) => {
    actions.on('match-update', callback);
    actions.on('match-result', callback);
    actions.on('bracket-update', callback);
    
    return () => {
      actions.off('match-update', callback);
      actions.off('match-result', callback);
      actions.off('bracket-update', callback);
    };
  }, [actions]);

  const subscribeToParticipants = useCallback((callback: (participant: any) => void) => {
    actions.on('participant-joined', callback);
    actions.on('participant-approved', callback);
    actions.on('participant-removed', callback);
    
    return () => {
      actions.off('participant-joined', callback);
      actions.off('participant-approved', callback);
      actions.off('participant-removed', callback);
    };
  }, [actions]);

  const subscribeToTournamentStatus = useCallback((callback: (status: any) => void) => {
    actions.on('tournament-status-change', callback);
    actions.on('tournament-schedule-update', callback);
    
    return () => {
      actions.off('tournament-status-change', callback);
      actions.off('tournament-schedule-update', callback);
    };
  }, [actions]);

  // Tournament-specific actions
  const joinTournament = useCallback(() => {
    return actions.emit('join-tournament', { tournamentId });
  }, [actions, tournamentId]);

  const leaveTournament = useCallback(() => {
    return actions.emit('leave-tournament', { tournamentId });
  }, [actions, tournamentId]);

  const submitMatchResult = useCallback((matchId: string, result: any) => {
    return actions.emit('match-result-submit', { 
      tournamentId, 
      matchId, 
      result 
    });
  }, [actions, tournamentId]);

  return {
    ...state,
    ...actions,
    // Tournament-specific subscriptions
    subscribeToMatches,
    subscribeToParticipants,
    subscribeToTournamentStatus,
    // Tournament-specific actions
    joinTournament,
    leaveTournament,
    submitMatchResult
  };
}

/**
 * Hook for WebSocket connection status display
 */
export function useWebSocketStatus(tournamentId: string) {
  const [state] = useWebSocketReconnection(tournamentId, { autoConnect: false });
  
  const getStatusColor = useCallback((): 'success' | 'warning' | 'error' | 'info' => {
    switch (state.connectionState.status) {
      case 'connected':
        return state.statistics.isHealthy ? 'success' : 'warning';
      case 'connecting':
      case 'reconnecting':
        return 'info';
      case 'failed':
      case 'disconnected':
        return 'error';
      default:
        return 'info';
    }
  }, [state]);

  const getStatusText = useCallback((): string => {
    switch (state.connectionState.status) {
      case 'connected':
        return state.statistics.isHealthy ? '연결됨' : '연결됨 (불안정)';
      case 'connecting':
        return '연결 중...';
      case 'reconnecting':
        return `재연결 중... (${state.connectionState.retryCount}/${10})`;
      case 'failed':
        return '연결 실패';
      case 'disconnected':
        return '연결 끊김';
      default:
        return '알 수 없음';
    }
  }, [state]);

  const getStatusIcon = useCallback((): string => {
    switch (state.connectionState.status) {
      case 'connected':
        return state.statistics.isHealthy ? '🟢' : '🟡';
      case 'connecting':
      case 'reconnecting':
        return '🔄';
      case 'failed':
      case 'disconnected':
        return '🔴';
      default:
        return '⚪';
    }
  }, [state]);

  return {
    status: state.connectionState.status,
    isHealthy: state.statistics.isHealthy,
    statusColor: getStatusColor(),
    statusText: getStatusText(),
    statusIcon: getStatusIcon(),
    statistics: state.statistics,
    lastError: state.connectionState.lastError
  };
}

export default useWebSocketReconnection;