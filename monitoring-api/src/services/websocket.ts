import WebSocket from 'ws';

export interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
}

export class WebSocketManager {
  private wss: WebSocket.Server;
  private clients: Set<WebSocket> = new Set();

  constructor(wss: WebSocket.Server) {
    this.wss = wss;
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(type: string, data: any): void {
    const message: WSMessage = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    const messageStr = JSON.stringify(message);

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  sendToClient(client: WebSocket, type: string, data: any): void {
    if (client.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      client.send(JSON.stringify(message));
    }
  }

  private handleMessage(ws: WebSocket, message: any): void {
    // Handle client messages if needed
    switch (message.type) {
      case 'subscribe':
        // Handle subscription requests
        break;
      case 'unsubscribe':
        // Handle unsubscription requests
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}