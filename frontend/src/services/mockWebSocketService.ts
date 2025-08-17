/**
 * Mock WebSocket Service for development and testing
 * Simulates WebSocket behavior without requiring actual socket.io-client
 */

export interface MockSocket {
  id: string;
  connected: boolean;
  emit: (event: string, data?: any) => boolean;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
  connect: () => void;
  disconnect: () => void;
}

export class MockWebSocketService {
  private static sockets: Map<string, MockSocket> = new Map();
  private static eventListeners: Map<string, Map<string, Function[]>> = new Map();

  static createSocket(url: string, options: any = {}): MockSocket {
    const socketId = `mock-socket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const socket: MockSocket = {
      id: socketId,
      connected: false,
      
      emit: (event: string, data?: any): boolean => {
        console.log(`📡 Mock socket emitting: ${event}`, data);
        
        // Simulate server response for certain events
        setTimeout(() => {
          if (event === 'ping') {
            this.triggerEvent(socketId, 'pong', { ...data, serverTime: Date.now() });
          }
        }, 10);
        
        return true;
      },
      
      on: (event: string, callback: Function): void => {
        if (!this.eventListeners.has(socketId)) {
          this.eventListeners.set(socketId, new Map());
        }
        
        const socketListeners = this.eventListeners.get(socketId)!;
        if (!socketListeners.has(event)) {
          socketListeners.set(event, []);
        }
        
        socketListeners.get(event)!.push(callback);
        console.log(`📝 Mock socket registered listener for: ${event}`);
      },
      
      off: (event: string, callback?: Function): void => {
        const socketListeners = this.eventListeners.get(socketId);
        if (!socketListeners) return;
        
        if (callback) {
          const listeners = socketListeners.get(event);
          if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }
        } else {
          socketListeners.delete(event);
        }
        
        console.log(`📝 Mock socket removed listener for: ${event}`);
      },
      
      connect: (): void => {
        socket.connected = true;
        console.log(`🔌 Mock socket connected: ${socketId}`);
        
        // Simulate connection events
        setTimeout(() => {
          this.triggerEvent(socketId, 'connect');
        }, 100);
      },
      
      disconnect: (): void => {
        socket.connected = false;
        console.log(`🔌 Mock socket disconnected: ${socketId}`);
        
        // Simulate disconnection events
        setTimeout(() => {
          this.triggerEvent(socketId, 'disconnect', 'io client disconnect');
        }, 10);
      }
    };
    
    this.sockets.set(socketId, socket);
    return socket;
  }
  
  private static triggerEvent(socketId: string, event: string, data?: any): void {
    const socketListeners = this.eventListeners.get(socketId);
    if (!socketListeners) return;
    
    const listeners = socketListeners.get(event);
    if (!listeners) return;
    
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in mock socket event handler for ${event}:`, error);
      }
    });
  }
  
  /**
   * Simulate connection errors for testing
   */
  static simulateConnectionError(socketId: string, error: string = 'Connection failed'): void {
    this.triggerEvent(socketId, 'connect_error', new Error(error));
  }
  
  /**
   * Simulate network disconnection
   */
  static simulateNetworkDisconnection(socketId: string): void {
    const socket = this.sockets.get(socketId);
    if (socket) {
      socket.connected = false;
      this.triggerEvent(socketId, 'disconnect', 'transport close');
    }
  }
  
  /**
   * Send test message to all connected sockets
   */
  static broadcastTestMessage(event: string, data: any): void {
    this.sockets.forEach((socket, socketId) => {
      if (socket.connected) {
        this.triggerEvent(socketId, event, data);
      }
    });
  }
  
  /**
   * Clean up socket
   */
  static removeSocket(socketId: string): void {
    this.sockets.delete(socketId);
    this.eventListeners.delete(socketId);
  }
}

// Export a factory function that mimics socket.io-client's io function
export function io(url: string, options: any = {}): MockSocket {
  console.log(`🔧 Creating mock WebSocket connection to: ${url}`);
  return MockWebSocketService.createSocket(url, options);
}

export default MockWebSocketService;