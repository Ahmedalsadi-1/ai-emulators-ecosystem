export type DesktopSessionType = 'bytebot' | 'debian' | 'kali';

export type DesktopSessionStatus = 'running' | 'exited' | 'unknown';

export interface DesktopSession {
  id: string;
  name: string;
  type: DesktopSessionType;
  port: number | null;
  status: DesktopSessionStatus;
  wsUrl?: string;
}
