import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { spawn, IPty } from 'node-pty';
import * as os from 'os';

type TerminalInputPayload = {
  data?: string;
};

type TerminalResizePayload = {
  cols?: number;
  rows?: number;
};

@WebSocketGateway({
  path: '/terminal',
  cors: { origin: '*', credentials: true },
  transports: ['websocket'],
})
export class TerminalGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(TerminalGateway.name);
  private readonly sessions = new Map<string, IPty>();

  handleConnection(client: Socket) {
    const shell = process.env.SHELL || '/bin/bash';
    const cols = Number(client.handshake.query.cols) || 120;
    const rows = Number(client.handshake.query.rows) || 32;
    const cwd = process.env.TERMINAL_CWD || os.homedir() || '/home/user';

    try {
      const ptyProcess = spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env: { ...process.env, TERM: 'xterm-256color' },
      });

      this.sessions.set(client.id, ptyProcess);

      ptyProcess.onData((data) => {
        client.emit('terminal:data', data);
      });

      ptyProcess.onExit(({ exitCode }) => {
        client.emit('terminal:exit', { exitCode });
      });

      this.logger.log(`Terminal session started for ${client.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to start terminal session for ${client.id}: ${error}`,
      );
      client.emit('terminal:error', {
        message: 'Failed to start terminal session.',
      });
    }
  }

  handleDisconnect(client: Socket) {
    const session = this.sessions.get(client.id);
    if (session) {
      session.kill();
      this.sessions.delete(client.id);
      this.logger.log(`Terminal session closed for ${client.id}`);
    }
  }

  @SubscribeMessage('terminal:input')
  handleInput(
    @MessageBody() payload: TerminalInputPayload | string,
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    const data = typeof payload === 'string' ? payload : payload.data || '';
    if (data) {
      session.write(data);
    }
  }

  @SubscribeMessage('terminal:resize')
  handleResize(
    @MessageBody() payload: TerminalResizePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    const cols = payload.cols ?? session.cols;
    const rows = payload.rows ?? session.rows;
    session.resize(cols, rows);
  }
}
