import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as net from 'net';
import {
  DesktopSession,
  DesktopSessionStatus,
  DesktopSessionType,
} from './desktop-sessions.types';

const execFileAsync = promisify(execFile);

@Injectable()
export class DesktopSessionsService {
  private readonly logger = new Logger(DesktopSessionsService.name);

  constructor(private readonly configService: ConfigService) {}

  async listSessions(): Promise<DesktopSession[]> {
    const output = await this.runDocker([
      'ps',
      '--filter',
      'label=bytebot.session=true',
      '--format',
      '{{.ID}}\t{{.Names}}\t{{.Ports}}\t{{.Status}}\t{{.Labels}}',
    ]);

    if (!output.trim()) {
      return [];
    }

    return output
      .trim()
      .split('\n')
      .map((line) => {
        const [id, name, ports, statusRaw, labelsRaw] = line.split('\t');
        const labels = this.parseLabels(labelsRaw || '');
        const port = this.parseHostPort(ports);
        const type = this.parseType(labels, name);
        const status = this.parseStatus(statusRaw);
        const session: DesktopSession = {
          id,
          name,
          type,
          port,
          status,
        };
        if (port) {
          session.wsUrl = `ws://localhost:${port}/websockify`;
        }
        return session;
      });
  }

  async createSession(type: DesktopSessionType, name?: string): Promise<DesktopSession> {
    const image = this.getImageForType(type);
    if (!image) {
      throw new BadRequestException(`Unsupported desktop type: ${type}`);
    }

    const port = await this.allocatePort();
    const safeName = name?.trim() || `bytebot-desktop-session-${type}-${Date.now()}`;
    const hostname = `computer-${type}-${port}`;

    const args = [
      'run',
      '-d',
      '--name',
      safeName,
      '--label',
      'bytebot.session=true',
      '--label',
      `bytebot.session.type=${type}`,
      '--label',
      `bytebot.session.port=${port}`,
      '--hostname',
      hostname,
      '--restart',
      'unless-stopped',
      '--privileged',
      '--shm-size',
      '2g',
      '-p',
      `${port}:9990`,
      '-e',
      'DISPLAY=:0',
      '-e',
      'NODE_ENV=development',
      image,
    ];

    const containerId = (await this.runDocker(args)).trim();
    if (!containerId) {
      throw new Error('Failed to create desktop session');
    }

    return {
      id: containerId,
      name: safeName,
      type,
      port,
      status: 'running',
      wsUrl: `ws://localhost:${port}/websockify`,
    };
  }

  async stopSession(idOrName: string): Promise<void> {
    await this.runDocker(['stop', idOrName]);
  }

  async removeSession(idOrName: string): Promise<void> {
    await this.runDocker(['rm', '-f', idOrName]);
  }

  private parseLabels(raw: string): Record<string, string> {
    const entries = raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    return entries.reduce<Record<string, string>>((acc, entry) => {
      const [key, ...rest] = entry.split('=');
      if (!key || rest.length === 0) return acc;
      acc[key] = rest.join('=');
      return acc;
    }, {});
  }

  private parseStatus(statusRaw: string): DesktopSessionStatus {
    if (!statusRaw) return 'unknown';
    const normalized = statusRaw.toLowerCase();
    if (normalized.startsWith('up')) return 'running';
    if (normalized.startsWith('exited')) return 'exited';
    return 'unknown';
  }

  private parseType(labels: Record<string, string>, name: string): DesktopSessionType {
    const labelType = labels['bytebot.session.type'];
    if (labelType === 'bytebot' || labelType === 'debian' || labelType === 'kali') {
      return labelType;
    }
    if (name.includes('debian')) return 'debian';
    if (name.includes('kali')) return 'kali';
    return 'bytebot';
  }

  private parseHostPort(portsRaw: string): number | null {
    if (!portsRaw) return null;
    const match = portsRaw.match(/:(\d+)->9990/);
    if (!match) return null;
    return Number(match[1]);
  }

  private getImageForType(type: DesktopSessionType): string | undefined {
    const fallback = 'ghcr.io/bytebot-ai/bytebot-desktop:edge';
    const imageMap: Record<DesktopSessionType, string> = {
      bytebot: this.configService.get<string>('BYTEBOT_DESKTOP_IMAGE') || fallback,
      debian:
        this.configService.get<string>('BYTEBOT_DESKTOP_DEBIAN_IMAGE') || fallback,
      kali: this.configService.get<string>('BYTEBOT_DESKTOP_KALI_IMAGE') || fallback,
    };
    return imageMap[type];
  }

  private async allocatePort(): Promise<number> {
    const start =
      Number(this.configService.get('BYTEBOT_DESKTOP_PORT_RANGE_START')) || 10010;
    const end =
      Number(this.configService.get('BYTEBOT_DESKTOP_PORT_RANGE_END')) || 10100;
    const usedPorts = new Set<number>();
    const sessions = await this.listSessions();
    sessions.forEach((session) => {
      if (session.port) usedPorts.add(session.port);
    });

    for (let port = start; port <= end; port += 1) {
      if (usedPorts.has(port)) continue;
      if (await this.isPortFree(port)) return port;
    }

    throw new BadRequestException('No free desktop session ports available');
  }

  private async isPortFree(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '0.0.0.0');
    });
  }

  private async runDocker(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync('docker', args, {
        maxBuffer: 1024 * 1024,
      });
      return stdout;
    } catch (error: any) {
      const stderr = error?.stderr || error?.message || 'unknown error';
      this.logger.error(`Docker command failed: docker ${args.join(' ')} (${stderr})`);
      throw new BadRequestException('Docker command failed');
    }
  }
}
