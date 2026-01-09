import { Injectable, Logger } from '@nestjs/common';
import { PNG } from 'pngjs';
import {
  ClickMouseAction,
  DragMouseAction,
  MoveMouseAction,
  PressKeysAction,
  PressMouseAction,
  ScrollAction,
  TypeKeysAction,
  TypeTextAction,
  PasteTextAction,
  ComputerAction,
} from '@bytebot/shared';
import { normalizeToPixel, clamp, sleep } from './vnc.utils';
import { VncActionResult, VncScreenshotResult, VncSessionConfig, VncSessionId } from './vnc.types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rfb2 = require('rfb2');

type PendingScreenshot = {
  resolve: (value: VncScreenshotResult) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

type VncSessionState = {
  connected: boolean;
  width: number;
  height: number;
  framebuffer: Buffer | null;
  pendingScreenshot: PendingScreenshot | null;
  reconnecting: boolean;
};

const BUTTON_MASK = {
  left: 1,
  middle: 2,
  right: 4,
  wheelUp: 8,
  wheelDown: 16,
  wheelLeft: 32,
  wheelRight: 64,
};

const KEYSYM_MAP: Record<string, number> = {
  enter: 0xff0d,
  escape: 0xff1b,
  esc: 0xff1b,
  backspace: 0xff08,
  tab: 0xff09,
  left: 0xff51,
  up: 0xff52,
  right: 0xff53,
  down: 0xff54,
  home: 0xff50,
  end: 0xff57,
  pageup: 0xff55,
  pagedown: 0xff56,
  insert: 0xff63,
  delete: 0xffff,
  shift: 0xffe1,
  ctrl: 0xffe3,
  control: 0xffe3,
  alt: 0xffe9,
  meta: 0xffe7,
  win: 0xffe7,
  cmd: 0xffe7,
  f1: 0xffbe,
  f2: 0xffbf,
  f3: 0xffc0,
  f4: 0xffc1,
  f5: 0xffc2,
  f6: 0xffc3,
  f7: 0xffc4,
  f8: 0xffc5,
  f9: 0xffc6,
  f10: 0xffc7,
  f11: 0xffc8,
  f12: 0xffc9,
};

class VncSession {
  private rfb: any = null;
  private state: VncSessionState = {
    connected: false,
    width: 0,
    height: 0,
    framebuffer: null,
    pendingScreenshot: null,
    reconnecting: false,
  };

  constructor(
    private readonly config: VncSessionConfig,
    private readonly logger: Logger,
  ) {}

  get isConnected() {
    return this.state.connected;
  }

  get size() {
    return { width: this.state.width, height: this.state.height };
  }

  async connect(): Promise<void> {
    if (this.state.connected || this.state.reconnecting) return;

    this.state.reconnecting = true;

    await new Promise<void>((resolve, reject) => {
      this.rfb = rfb2.createConnection({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        encodings: [rfb2.encodings.raw],
      });

      const onConnect = () => {
        this.state.connected = true;
        this.state.reconnecting = false;
        this.state.width = this.rfb.width;
        this.state.height = this.rfb.height;
        this.state.framebuffer = Buffer.alloc(this.state.width * this.state.height * 4);
        this.logger.log(
          `VNC connected (${this.config.id}) ${this.config.host}:${this.config.port} (${this.state.width}x${this.state.height})`,
        );
        this.requestFullUpdate();
        resolve();
      };

      const onError = (error: Error) => {
        this.logger.warn(`VNC error (${this.config.id}): ${error.message}`);
      };

      const onClose = () => {
        this.state.connected = false;
        this.state.reconnecting = false;
        this.logger.warn(`VNC disconnected (${this.config.id})`);
        if (this.state.pendingScreenshot) {
          this.state.pendingScreenshot.reject(
            new Error('VNC disconnected during screenshot'),
          );
          clearTimeout(this.state.pendingScreenshot.timer);
          this.state.pendingScreenshot = null;
        }
      };

      this.rfb.on('connect', onConnect);
      this.rfb.on('error', onError);
      this.rfb.on('close', onClose);

      this.rfb.on('rect', (rect: any) => {
        if (!this.state.framebuffer) return;
        if (rect.encoding !== rfb2.encodings.raw || !rect.data) return;

        const bytesPerPixel = 4;
        const { x, y, width, height } = rect;
        const data: Buffer = rect.data;

        for (let row = 0; row < height; row++) {
          const srcOffset = row * width * bytesPerPixel;
          const destOffset = ((y + row) * this.state.width + x) * bytesPerPixel;
          for (let col = 0; col < width; col++) {
            const srcIndex = srcOffset + col * bytesPerPixel;
            const destIndex = destOffset + col * bytesPerPixel;
            const b = data[srcIndex];
            const g = data[srcIndex + 1];
            const r = data[srcIndex + 2];
            this.state.framebuffer[destIndex] = r;
            this.state.framebuffer[destIndex + 1] = g;
            this.state.framebuffer[destIndex + 2] = b;
            this.state.framebuffer[destIndex + 3] = 255;
          }
        }

        if (this.state.pendingScreenshot) {
          const capture = this.buildScreenshot();
          this.state.pendingScreenshot.resolve(capture);
          clearTimeout(this.state.pendingScreenshot.timer);
          this.state.pendingScreenshot = null;
        }
      });

      setTimeout(() => {
        if (!this.state.connected) {
          reject(new Error('VNC connection timeout'));
        }
      }, 5000);
    });
  }

  requestFullUpdate() {
    if (!this.rfb || !this.state.connected) return;
    if (typeof this.rfb.requestUpdate === 'function') {
      this.rfb.requestUpdate(0, 0, this.state.width, this.state.height, false);
      return;
    }
    if (typeof this.rfb.requestUpdate === 'function') {
      this.rfb.requestUpdate(0, 0, this.state.width, this.state.height, false);
    }
  }

  private buildScreenshot(): VncScreenshotResult {
    const png = new PNG({ width: this.state.width, height: this.state.height });
    if (this.state.framebuffer) {
      png.data = Buffer.from(this.state.framebuffer);
    }
    const buffer = PNG.sync.write(png);
    return {
      data: buffer.toString('base64'),
      width: this.state.width,
      height: this.state.height,
    };
  }

  async screenshot(timeoutMs = 5000): Promise<VncScreenshotResult> {
    await this.connect();
    this.requestFullUpdate();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.state.pendingScreenshot) {
          this.state.pendingScreenshot = null;
        }
        reject(new Error('VNC screenshot timeout'));
      }, timeoutMs);
      this.state.pendingScreenshot = { resolve, reject, timer };
    });
  }

  private sendPointerEvent(x: number, y: number, mask: number) {
    if (!this.rfb || !this.state.connected) return;
    if (typeof this.rfb.pointerEvent === 'function') {
      this.rfb.pointerEvent(x, y, mask);
    } else if (typeof this.rfb.sendPointerEvent === 'function') {
      this.rfb.sendPointerEvent(x, y, mask);
    }
  }

  private sendKeyEvent(keysym: number, down: boolean) {
    if (!this.rfb || !this.state.connected) return;
    if (typeof this.rfb.keyEvent === 'function') {
      this.rfb.keyEvent(keysym, down);
    } else if (typeof this.rfb.sendKeyEvent === 'function') {
      this.rfb.sendKeyEvent(keysym, down);
    }
  }

  private normalizeCoords(x: number, y: number) {
    const px = normalizeToPixel(x, this.state.width - 1);
    const py = normalizeToPixel(y, this.state.height - 1);
    return {
      x: clamp(px, 0, this.state.width - 1),
      y: clamp(py, 0, this.state.height - 1),
    };
  }

  async moveMouse(action: MoveMouseAction) {
    await this.connect();
    const { x, y } = this.normalizeCoords(action.coordinates.x, action.coordinates.y);
    this.sendPointerEvent(x, y, 0);
  }

  async clickMouse(action: ClickMouseAction) {
    await this.connect();
    const { x, y } = action.coordinates
      ? this.normalizeCoords(action.coordinates.x, action.coordinates.y)
      : { x: 0, y: 0 };
    const buttonMask = BUTTON_MASK[action.button];
    const count = Math.max(action.clickCount ?? 1, 1);

    for (let i = 0; i < count; i++) {
      this.sendPointerEvent(x, y, buttonMask);
      this.sendPointerEvent(x, y, 0);
      await sleep(50);
    }
  }

  async pressMouse(action: PressMouseAction) {
    await this.connect();
    const { x, y } = action.coordinates
      ? this.normalizeCoords(action.coordinates.x, action.coordinates.y)
      : { x: 0, y: 0 };
    const buttonMask = BUTTON_MASK[action.button];
    this.sendPointerEvent(x, y, action.press === 'down' ? buttonMask : 0);
  }

  async dragMouse(action: DragMouseAction) {
    await this.connect();
    if (!action.path?.length) return;

    const start = this.normalizeCoords(action.path[0].x, action.path[0].y);
    const buttonMask = BUTTON_MASK[action.button];

    this.sendPointerEvent(start.x, start.y, buttonMask);
    for (const point of action.path) {
      const coords = this.normalizeCoords(point.x, point.y);
      this.sendPointerEvent(coords.x, coords.y, buttonMask);
      await sleep(16);
    }
    const end = this.normalizeCoords(
      action.path[action.path.length - 1].x,
      action.path[action.path.length - 1].y,
    );
    this.sendPointerEvent(end.x, end.y, 0);
  }

  async scroll(action: ScrollAction) {
    await this.connect();
    const { x, y } = action.coordinates
      ? this.normalizeCoords(action.coordinates.x, action.coordinates.y)
      : { x: 0, y: 0 };

    const mask = action.direction === 'up'
      ? BUTTON_MASK.wheelUp
      : action.direction === 'down'
        ? BUTTON_MASK.wheelDown
        : action.direction === 'left'
          ? BUTTON_MASK.wheelLeft
          : BUTTON_MASK.wheelRight;

    for (let i = 0; i < action.scrollCount; i++) {
      this.sendPointerEvent(x, y, mask);
      this.sendPointerEvent(x, y, 0);
      await sleep(40);
    }
  }

  async typeKeys(action: TypeKeysAction) {
    await this.connect();
    for (const key of action.keys) {
      await this.pressKey(key);
      if (action.delay) {
        await sleep(action.delay);
      }
    }
  }

  async pressKeys(action: PressKeysAction) {
    await this.connect();
    const down = action.press === 'down';
    for (const key of action.keys) {
      const keysym = this.resolveKeysym(key);
      if (keysym) {
        this.sendKeyEvent(keysym, down);
      }
    }
  }

  async typeText(action: TypeTextAction) {
    await this.connect();
    for (const char of action.text) {
      const keysym = char.codePointAt(0);
      if (keysym) {
        this.sendKeyEvent(keysym, true);
        this.sendKeyEvent(keysym, false);
      }
      if (action.delay) {
        await sleep(action.delay);
      }
    }
  }

  async pasteText(action: PasteTextAction) {
    await this.connect();
    if (typeof this.rfb?.clientCutText === 'function') {
      this.rfb.clientCutText(action.text);
    } else if (typeof this.rfb?.updateClipboard === 'function') {
      this.rfb.updateClipboard(action.text);
    } else {
      await this.typeText({ action: 'type_text', text: action.text });
    }
  }

  private async pressKey(key: string) {
    const keysym = this.resolveKeysym(key);
    if (!keysym) return;
    this.sendKeyEvent(keysym, true);
    this.sendKeyEvent(keysym, false);
  }

  private resolveKeysym(key: string): number | null {
    const normalized = key.toLowerCase();
    if (KEYSYM_MAP[normalized]) return KEYSYM_MAP[normalized];
    if (normalized.length === 1) {
      return normalized.codePointAt(0) || null;
    }
    return null;
  }

  async handleAction(action: ComputerAction): Promise<VncActionResult> {
    switch (action.action) {
      case 'move_mouse':
        await this.moveMouse(action as MoveMouseAction);
        return { success: true };
      case 'click_mouse':
        await this.clickMouse(action as ClickMouseAction);
        return { success: true };
      case 'press_mouse':
        await this.pressMouse(action as PressMouseAction);
        return { success: true };
      case 'drag_mouse':
        await this.dragMouse(action as DragMouseAction);
        return { success: true };
      case 'scroll':
        await this.scroll(action as ScrollAction);
        return { success: true };
      case 'type_keys':
        await this.typeKeys(action as TypeKeysAction);
        return { success: true };
      case 'press_keys':
        await this.pressKeys(action as PressKeysAction);
        return { success: true };
      case 'type_text':
        await this.typeText(action as TypeTextAction);
        return { success: true };
      case 'paste_text':
        await this.pasteText(action as PasteTextAction);
        return { success: true };
      case 'screenshot': {
        const screenshot = await this.screenshot();
        return { success: true, screenshot };
      }
      default:
        return { success: false, error: `Unsupported VNC action: ${action.action}` };
    }
  }
}

@Injectable()
export class VncBridgeService {
  private readonly logger = new Logger(VncBridgeService.name);
  private readonly enabled = process.env.VNC_BRIDGE_ENABLED === 'true';
  private readonly sessions = new Map<VncSessionId, VncSession>();
  private readonly defaultSession =
    (process.env.VNC_DEFAULT_SESSION_ID as VncSessionId) || 'desktop-1';

  private buildConfig(id: VncSessionId): VncSessionConfig {
    const host = process.env.VNC_DEFAULT_HOST || 'localhost';
    const defaultPassword = process.env.VNC_PASSWORD || 'bytebot';

    const portMap: Record<VncSessionId, number> = {
      'desktop-1': Number(process.env.VNC_DESKTOP1_PORT) || 5901,
      'desktop-2': Number(process.env.VNC_DESKTOP2_PORT) || 5902,
      'desktop-3': Number(process.env.VNC_DESKTOP3_PORT) || 5903,
      kali: Number(process.env.VNC_KALI_PORT) || 5903,
      browseros: Number(process.env.VNC_BROWSEROS_PORT) || 5904,
    };

    const passwordMap: Record<VncSessionId, string | undefined> = {
      'desktop-1': process.env.VNC_DESKTOP1_PASSWORD || defaultPassword,
      'desktop-2': process.env.VNC_DESKTOP2_PASSWORD || defaultPassword,
      'desktop-3': process.env.VNC_DESKTOP3_PASSWORD || 'kali',
      kali: process.env.VNC_KALI_PASSWORD || 'kali',
      browseros: process.env.VNC_BROWSEROS_PASSWORD || undefined,
    };

    return {
      id,
      host,
      port: portMap[id],
      password: passwordMap[id],
    };
  }

  private getSession(id: VncSessionId): VncSession {
    if (this.sessions.has(id)) {
      return this.sessions.get(id)!;
    }

    const session = new VncSession(this.buildConfig(id), this.logger);
    this.sessions.set(id, session);
    return session;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  resolveSessionId(sessionId?: string): VncSessionId {
    const normalized = (sessionId || this.defaultSession) as VncSessionId;
    if (['desktop-1', 'desktop-2', 'desktop-3', 'kali', 'browseros'].includes(normalized)) {
      return normalized;
    }
    return this.defaultSession;
  }

  async handleAction(
    sessionId: string | undefined,
    action: ComputerAction,
  ): Promise<VncActionResult> {
    if (!this.enabled) {
      return { success: false, error: 'VNC bridge is disabled' };
    }

    const resolvedId = this.resolveSessionId(sessionId);
    const session = this.getSession(resolvedId);
    return session.handleAction(action);
  }
}
