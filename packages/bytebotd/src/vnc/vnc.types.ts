export type VncSessionId = 'desktop-1' | 'desktop-2' | 'desktop-3' | 'kali' | 'browseros';

export type VncSessionConfig = {
  id: VncSessionId;
  host: string;
  port: number;
  password?: string;
};

export type VncScreenshotResult = {
  data: string;
  width: number;
  height: number;
};

export type VncActionResult = {
  success: boolean;
  screenshot?: VncScreenshotResult;
  error?: string;
};
