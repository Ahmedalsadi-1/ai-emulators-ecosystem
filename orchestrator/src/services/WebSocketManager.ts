import { Server as SocketServer, Socket } from 'socket.io';

interface UnifiedMessage {
  id: string;
  type: string;
  source: string;
  target: string;
  channel: string;
  payload: any;
  timestamp: number;
  correlationId?: string;
}

interface ConnectedClient {
  id: string;
  socket: Socket;
  authenticated: boolean;
  userId?: string;
  sessionId?: string;
  permissions: string[];
  connectedAt: number;
  lastActivity: number;
  subscribedRooms: Set<string>;
}

export class WebSocketManager {
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private roomSubscriptions: Map<string, Set<string>> = new Map();

  constructor(
    private io: SocketServer,
    private config: any = {}
  ) {
    this.setupSocketHandlers();
  }

  async start(): Promise<void> {
    console.log('WebSocket server started');
  }

  async stop(): Promise<void> {
    for (const [clientId, client] of this.connectedClients.entries()) {
      client.socket.disconnect(true);
    }
    this.connectedClients.clear();
    this.roomSubscriptions.clear();
    console.log('WebSocket server stopped');
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New WebSocket connection: ${socket.id}`);

      const client: ConnectedClient = {
        id: socket.id,
        socket,
        authenticated: false,
        permissions: [],
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        subscribedRooms: new Set()
      };

      this.connectedClients.set(socket.id, client);

      socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
      socket.on('message', (message) => this.handleMessage(socket, message));
      socket.on('join_room', (data) => this.handleJoinRoom(socket, data));
      socket.on('leave_room', (data) => this.handleLeaveRoom(socket, data));
      socket.on('heartbeat', () => this.handleHeartbeat(socket));
      socket.on('disconnect', () => this.handleDisconnect(socket));
      socket.on('error', (error) => this.handleError(socket, error));

      socket.emit('connected', {
        clientId: socket.id,
        timestamp: Date.now()
      });
    });
  }

  private async handleAuthentication(socket: Socket, data: any): Promise<void> {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    const { token } = data;
    if (token && this.validateToken(token)) {
      client.authenticated = true;
      client.userId = this.extractUserFromToken(token);
      client.permissions = ['read', 'write'];

      socket.emit('authenticated', {
        success: true,
        userId: client.userId,
        permissions: client.permissions
      });
    } else {
      socket.emit('authenticated', {
        success: false,
        error: 'Invalid token'
      });
      socket.disconnect();
    }
  }

  private async handleMessage(socket: Socket, message: UnifiedMessage): Promise<void> {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    client.lastActivity = Date.now();

    if (!message || typeof message !== 'object') {
      socket.emit('error', { type: 'INVALID_MESSAGE', message: 'Invalid format' });
      return;
    }

    await this.routeMessage(message, client);
  }

  private async routeMessage(message: UnifiedMessage, client: ConnectedClient): Promise<void> {
    if (message.target === 'broadcast') {
      this.broadcast(message, client.id);
    } else if (message.target.startsWith('room:')) {
      const room = message.target.slice(5);
      this.broadcastToRoom(room, message);
    } else {
      // Direct message to specific client
      const targetClient = this.connectedClients.get(message.target);
      if (targetClient) {
        targetClient.socket.emit('message', message);
      }
    }
  }

  private handleJoinRoom(socket: Socket, data: { room: string }): void {
    const client = this.connectedClients.get(socket.id);
    if (!client || !client.authenticated) return;

    const { room } = data;
    if (!this.roomSubscriptions.has(room)) {
      this.roomSubscriptions.set(room, new Set());
    }
    this.roomSubscriptions.get(room)!.add(socket.id);
    client.subscribedRooms.add(room);
    socket.join(room);
  }

  private handleLeaveRoom(socket: Socket, data: { room: string }): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    const { room } = data;
    const roomClients = this.roomSubscriptions.get(room);
    if (roomClients) {
      roomClients.delete(socket.id);
      if (roomClients.size === 0) {
        this.roomSubscriptions.delete(room);
      }
    }
    client.subscribedRooms.delete(room);
    socket.leave(room);
  }

  private handleHeartbeat(socket: Socket): void {
    const client = this.connectedClients.get(socket.id);
    if (client) {
      client.lastActivity = Date.now();
      socket.emit('heartbeat_ack');
    }
  }

  handleDisconnect(socket: Socket): void {
    const client = this.connectedClients.get(socket.id);
    if (client) {
      for (const room of client.subscribedRooms) {
        const roomClients = this.roomSubscriptions.get(room);
        if (roomClients) {
          roomClients.delete(socket.id);
        }
      }
      this.connectedClients.delete(socket.id);
    }
  }

  handleError(socket: Socket, error: any): void {
    console.error(`Socket error for ${socket.id}:`, error);
  }

  private broadcastToRoom(room: string, message: UnifiedMessage): void {
    const roomClients = this.roomSubscriptions.get(room);
    if (!roomClients) return;

    for (const clientId of roomClients) {
      const client = this.connectedClients.get(clientId);
      if (client) {
        client.socket.emit('message', message);
      }
    }
  }

  private broadcast(message: UnifiedMessage, excludeClientId?: string): void {
    for (const [clientId, client] of this.connectedClients.entries()) {
      if (client.authenticated && clientId !== excludeClientId) {
        client.socket.emit('message', message);
      }
    }
  }

  private validateToken(token: string): boolean {
    return !!(token && token.length > 10);
  }

  private extractUserFromToken(token: string): string {
    return 'user_' + token.substring(0, 8);
  }

  private getPermissionsForToken(token: string): string[] {
    return ['read', 'write'];
  }

  // Legacy methods for backward compatibility
  subscribeToServiceStatus(socket: Socket, serviceId: string): void {
    const client = this.connectedClients.get(socket.id);
    if (!client || !client.authenticated) return;

    // Subscribe to service status updates
    const roomName = `service:${serviceId}:status`;
    socket.join(roomName);

    // Send current status
    this.sendCurrentServiceStatus(socket, serviceId);
  }

  unsubscribeFromServiceStatus(socket: Socket, serviceId: string): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    const roomName = `service:${serviceId}:status`;
    socket.leave(roomName);
  }

  subscribeToMetrics(socket: Socket): void {
    const client = this.connectedClients.get(socket.id);
    if (!client || !client.authenticated) return;

    // Subscribe to metrics updates
    socket.join('metrics');

    // Send current metrics
    this.sendCurrentMetrics(socket);
  }

  unsubscribeFromMetrics(socket: Socket): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    socket.leave('metrics');
  }

  // Broadcast service status update to subscribers
  broadcastServiceStatus(serviceId: string, status: string, details?: any): void {
    const roomName = `service:${serviceId}:status`;
    const message = {
      type: 'service:status',
      serviceId,
      status,
      details,
      timestamp: Date.now()
    };

    this.io.to(roomName).emit('status_update', message);
  }

  // Broadcast metrics update to subscribers
  broadcastMetrics(metrics: any): void {
    const message = {
      type: 'metrics:update',
      data: metrics,
      timestamp: Date.now()
    };

    this.io.to('metrics').emit('metrics_update', message);
  }

  // Send current service status to a specific socket
  private sendCurrentServiceStatus(socket: Socket, serviceId: string): void {
    // This would typically get the current status from ServiceRegistry
    // For now, send a placeholder
    const message = {
      type: 'service:status',
      serviceId,
      status: 'unknown',
      timestamp: Date.now()
    };

    socket.emit('status_update', message);
  }

  // Send current metrics to a specific socket
  private sendCurrentMetrics(socket: Socket): void {
    // This would typically get current metrics from MetricsCollector
    // For now, send a placeholder
    const message = {
      type: 'metrics:update',
      data: {
        totalRequests: 0,
        activeConnections: this.connectedClients.size,
        uptime: process.uptime()
      },
      timestamp: Date.now()
    };

    socket.emit('metrics_update', message);
  }

  // Get connection statistics
  getConnectionStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    activeRooms: number;
  } {
    const authenticated = Array.from(this.connectedClients.values())
      .filter(client => client.authenticated).length;

    return {
      totalConnections: this.connectedClients.size,
      authenticatedConnections: authenticated,
      activeRooms: this.roomSubscriptions.size
    };
  }
}