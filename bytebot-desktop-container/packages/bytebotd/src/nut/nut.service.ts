// src/nut/nut.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class NutService {
  private readonly logger = new Logger(NutService.name);
  private screenshotDir: string;

  constructor() {
    this.logger.warn('Computer automation features are disabled on ARM64 architecture');

    // Create screenshot directory if it doesn't exist
    this.screenshotDir = path.join('/tmp', 'bytebot-screenshots');
    import('fs').then((fs) => {
      fs.promises
        .mkdir(this.screenshotDir, { recursive: true })
        .catch((err) => {
          this.logger.error(
            `Failed to create screenshot directory: ${(err as Error).message}`,
          );
        });
    });
  }

  /**
   * Sends key events to the computer.
   *
   * @param keys An array of key strings.
   * @param delay Delay between pressing and releasing keys in ms.
   */
  async sendKeys(keys: string[], delay: number = 100): Promise<any> {
    this.logger.log(`Sending keys: ${keys}`);
    return { success: false, message: 'Computer automation not available on ARM64 architecture' };
  }

  /**
   * Holds or releases keys.
   *
   * @param keys An array of key strings.
   * @param down True to press the keys down, false to release them.
   */
  async holdKeys(keys: string[], down: boolean): Promise<any> {
    this.logger.log(`Hold keys: ${keys}, down: ${down}`);
    return { success: false, message: 'Computer automation not available on ARM64 architecture' };
  }

  /**
   * Types text on the keyboard.
   *
   * @param text The text to type.
   * @param delayMs Delay between keypresses in ms.
   */
  async typeText(text: string, delayMs: number = 0): Promise<void> {
    this.logger.log(`Typing text: ${text}`);
    // No-op on ARM64
  }

  async pasteText(text: string): Promise<void> {
    this.logger.log(`Pasting text: ${text}`);
    // No-op on ARM64
  }

  /**
   * Moves the mouse to specified coordinates.
   *
   * @param coordinates The x and y coordinates.
   */
  async mouseMoveEvent({ x, y }: { x: number; y: number }): Promise<any> {
    this.logger.log(`Moving mouse to coordinates: (${x}, ${y})`);
    return { success: false, message: 'Computer automation not available on ARM64 architecture' };
  }

  async mouseClickEvent(button: 'left' | 'right' | 'middle'): Promise<any> {
    this.logger.log(`Clicking mouse button: ${button}`);
    return { success: false, message: 'Computer automation not available on ARM64 architecture' };
  }

  /**
   * Presses or releases a mouse button.
   *
   * @param button The mouse button ('left', 'right', or 'middle').
   * @param pressed True to press, false to release.
   */
  async mouseButtonEvent(
    button: 'left' | 'right' | 'middle',
    pressed: boolean,
  ): Promise<any> {
    this.logger.log(
      `Mouse button event: ${button} ${pressed ? 'pressed' : 'released'}`,
    );
    return { success: false, message: 'Computer automation not available on ARM64 architecture' };
  }

  /**
   * Scrolls the mouse wheel.
   *
   * @param direction The scroll direction ('up', 'down', 'left', or 'right').
   * @param amount The number of scroll steps.
   */
  async mouseWheelEvent(
    direction: 'right' | 'left' | 'up' | 'down',
    amount: number,
  ): Promise<any> {
    this.logger.log(`Mouse wheel event: ${direction} ${amount}`);
    return { success: false, message: 'Computer automation not available on ARM64 architecture' };
  }

  /**
   * Takes a screenshot of the screen.
   *
   * @returns A Promise that resolves with a Buffer containing the image.
   */
  async screendump(): Promise<Buffer> {
    this.logger.log(`Taking screenshot`);
    throw new Error('Screenshot functionality not available on ARM64 architecture');
  }

  async getCursorPosition(): Promise<{ x: number; y: number }> {
    this.logger.log(`Getting cursor position`);
    return { x: 0, y: 0 }; // Return dummy position
  }

  /**
   * Utility method to create a delay.
   *
   * @param ms Milliseconds to wait
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}