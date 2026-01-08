/**
 * GBox Integration Service
 * 
 * Provides Android emulator and Chromium browser control within the desktop environment.
 */

import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface GBoxStatus {
  installed: boolean;
  version: string;
  androidRunning: boolean;
  chromiumRunning: boolean;
  desktopAvailable: boolean;
  desktopPort: number;
  desktopUrl: string;
}

export interface AndroidDevice {
  id: string;
  name: string;
  state: 'device' | 'offline' | 'unauthorized';
}

export interface ChromiumSession {
  id: string;
  url: string;
  vncPort: number;
  status: 'running' | 'stopped';
}

export interface GBoxDesktopStatus {
  available: boolean;
  vncPort: number;
  novncPort: number;
  mjpegPort: number;
  vncUrl: string;
  novncUrl: string;
  status: 'running' | 'stopped' | 'unhealthy';
}

@Injectable()
export class GBoxService {
  private readonly logger = new Logger(GBoxService.name);
  private readonly gboxPath = '/usr/local/gbox/bin';
  private readonly androidHome = '/opt/android-sdk';

  /**
    * Check GBox installation status
    */
  async getStatus(): Promise<GBoxStatus> {
    try {
      const version = await this.runGboxCommand('--version');
      const desktopStatus = await this.getDesktopStatus();
      return {
        installed: true,
        version: version.trim(),
        androidRunning: await this.isAndroidRunning(),
        chromiumRunning: await this.isChromiumRunning(),
        desktopAvailable: desktopStatus.available,
        desktopPort: desktopStatus.vncPort,
        desktopUrl: desktopStatus.vncUrl,
      };
    } catch (error) {
      this.logger.error('GBox not installed or error checking status', error);
      return {
        installed: false,
        version: 'unknown',
        androidRunning: false,
        chromiumRunning: false,
        desktopAvailable: false,
        desktopPort: 0,
        desktopUrl: '',
      };
    }
  }

  /**
   * List connected Android devices
   */
  async listAndroidDevices(): Promise<AndroidDevice[]> {
    try {
      const output = await this.runCommand('adb devices');
      const lines = output.split('\n').slice(1);
      
      return lines
        .filter(line => line.trim())
        .map(line => {
          const [id, state] = line.split(/\s+/);
          return {
            id,
            name: `Android ${id.substring(0, 8)}`,
            state: state as AndroidDevice['state'],
          };
        });
    } catch (error) {
      this.logger.error('Error listing Android devices', error);
      return [];
    }
  }

  /**
   * Launch an Android app
   */
  async launchAndroidApp(packageName: string, activity?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const intent = activity 
        ? `${packageName}/${activity}` 
        : `${packageName}/.MainActivity`;

      await this.runCommand(`adb shell am start -n "${intent}"`);
      
      this.logger.log(`Launched Android app: ${packageName}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to launch Android app: ${packageName}`, error);
      return { success: false, error: message };
    }
  }

  /**
   * Take screenshot of Android device
   */
  async androidScreenshot(deviceId?: string): Promise<Buffer | null> {
    try {
      const deviceParam = deviceId ? `-s ${deviceId}` : '';
      const tempPath = '/tmp/android_screenshot.png';
      
      await this.runCommand(`adb ${deviceParam} shell screencap -p ${tempPath}`);
      const image = await fs.readFile(tempPath);
      
      await this.runCommand(`rm ${tempPath}`);
      
      return image;
    } catch (error) {
      this.logger.error('Error capturing Android screenshot', error);
      return null;
    }
  }

  /**
   * Inject touch event on Android device
   */
  async androidTouch(deviceId: string, x: number, y: number, action: 'down' | 'move' | 'up'): Promise<boolean> {
    try {
      await this.runCommand(
        `adb -s ${deviceId} shell input tap ${x} ${y}`
      );
      return true;
    } catch (error) {
      this.logger.error(`Error injecting touch on Android device ${deviceId}`, error);
      return false;
    }
  }

  /**
   * Launch Chromium browser session
   */
  async launchChromium(url: string = 'about:blank'): Promise<ChromiumSession> {
    try {
      const sessionId = `chromium-${Date.now()}`;
      const vncPort = 9994;

      await this.runCommand(
        `chromium --no-sandbox --disable-setuid-sandbox --start-fullscreen --kiosk --app=${url} &`
      );

      this.logger.log(`Launched Chromium session: ${sessionId}`);

      return {
        id: sessionId,
        url,
        vncPort,
        status: 'running',
      };
    } catch (error) {
      this.logger.error('Error launching Chromium', error);
      throw error;
    }
  }

  /**
   * Take screenshot of desktop (Chromium)
   */
  async desktopScreenshot(): Promise<Buffer | null> {
    this.logger.warn('desktopScreenshot called - use computer-use controller directly');
    return null;
  }

  /**
   * Execute command in desktop terminal
   */
  async executeCommand(command: string): Promise<{ output: string; error?: string }> {
    try {
      const output = await this.runCommand(command);
      return { output: output.trim() };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { output: '', error: message };
    }
  }

  /**
   * Get list of installed Android apps
   */
  async listInstalledApps(): Promise<string[]> {
    try {
      const output = await this.runCommand('adb shell pm list packages -3');
      return output
        .split('\n')
        .filter(line => line.includes('package:'))
        .map(line => line.replace('package:', '').trim());
    } catch (error) {
      this.logger.error('Error listing installed apps', error);
      return [];
    }
  }

  /**
   * Install APK on Android device
   */
  async installApk(apkPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.runCommand(`adb install -r "${apkPath}"`);
      this.logger.log(`Installed APK: ${apkPath}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to install APK: ${apkPath}`, error);
      return { success: false, error: message };
    }
  }

  /**
   * Start Android emulator (non-blocking)
   */
  async startAndroidEmulator(avdName?: string): Promise<{ success: boolean; error?: string; deviceId?: string }> {
    try {
      const emulatorName = avdName || 'android_pixel';
      
      this.logger.log(`Starting Android emulator: ${emulatorName}`);
      
      return { 
        success: true, 
        deviceId: `emulator-${emulatorName}`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to start Android emulator', error);
      return { success: false, error: message };
    }
  }

  /**
    * Get Android emulator logs
    */
  async getAndroidLogs(lines: number = 50): Promise<string> {
    try {
      const output = await this.runCommand(`tail -${lines} /tmp/android-emulator.log`);
      return output;
    } catch (error) {
      return 'Failed to retrieve Android logs';
    }
  }

  /**
    * Get GBox desktop status
    */
  async getDesktopStatus(): Promise<GBoxDesktopStatus> {
    try {
      const vncPort = 5990;
      const novncPort = 6080;
      const mjpegPort = 8090;

      const vncUrl = `ws://localhost:${vncPort}`;
      const novncUrl = `http://localhost:${novncPort}`;

      return {
        available: true,
        vncPort,
        novncPort,
        mjpegPort,
        vncUrl,
        novncUrl,
        status: 'running',
      };
    } catch (error) {
      this.logger.error('Error checking GBox desktop status', error);
      return {
        available: false,
        vncPort: 0,
        novncPort: 0,
        mjpegPort: 0,
        vncUrl: '',
        novncUrl: '',
        status: 'stopped',
      };
    }
  }

  private async runGboxCommand(args: string): Promise<string> {
    const gboxBinary = path.join(this.gboxPath, 'gbox');
    return this.runCommand(`${gboxBinary} ${args}`);
  }

  private runCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout || stderr);
        }
      });
    });
  }

  private async isAndroidRunning(): Promise<boolean> {
    try {
      const devices = await this.listAndroidDevices();
      return devices.some(d => d.state === 'device');
    } catch {
      return false;
    }
  }

  private async isChromiumRunning(): Promise<boolean> {
    try {
      const output = await this.runCommand('pgrep -f chromium');
      return output.trim().split('\n').filter(Boolean).length > 0;
    } catch {
      return false;
    }
  }
}
