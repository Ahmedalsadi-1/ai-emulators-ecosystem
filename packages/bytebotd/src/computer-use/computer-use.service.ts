import { Injectable, Logger } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { NutService } from '../nut/nut.service';
import { VncBridgeService } from '../vnc/vnc-bridge.service';
import {
  ComputerAction,
  MoveMouseAction,
  TraceMouseAction,
  ClickMouseAction,
  PressMouseAction,
  DragMouseAction,
  ScrollAction,
  TypeKeysAction,
  PressKeysAction,
  TypeTextAction,
  ApplicationAction,
  Application,
  PasteTextAction,
  WriteFileAction,
  ReadFileAction,
} from '@bytebot/shared';

@Injectable()
export class ComputerUseService {
  private readonly logger = new Logger(ComputerUseService.name);

  constructor(
    private readonly nutService: NutService,
    private readonly vncBridge: VncBridgeService,
  ) {}

  async action(params: ComputerAction & { session_id?: string }): Promise<any> {
    this.logger.log(`Executing computer action: ${params.action}`);
    const vncEligibleActions = new Set([
      'move_mouse',
      'trace_mouse',
      'click_mouse',
      'press_mouse',
      'drag_mouse',
      'scroll',
      'type_keys',
      'press_keys',
      'type_text',
      'paste_text',
      'screenshot',
    ]);
    const shouldUseVnc =
      this.vncBridge.isEnabled() &&
      vncEligibleActions.has(params.action) &&
      (Boolean(params.session_id) ||
        process.env.VNC_BRIDGE_FORCE === 'true');

    if (shouldUseVnc) {
      const result = await this.vncBridge.handleAction(
        params.session_id,
        params,
      );
      if (!result.success) {
        throw new Error(result.error || 'VNC action failed');
      }
      if (params.action === 'screenshot' && result.screenshot) {
        return { image: result.screenshot.data, width: result.screenshot.width, height: result.screenshot.height };
      }
      return { success: true };
    }

    switch (params.action) {
      case 'move_mouse': {
        await this.moveMouse(params);
        break;
      }
      case 'trace_mouse': {
        await this.traceMouse(params);
        break;
      }
      case 'click_mouse': {
        await this.clickMouse(params);
        break;
      }
      case 'press_mouse': {
        await this.pressMouse(params);
        break;
      }
      case 'drag_mouse': {
        await this.dragMouse(params);
        break;
      }

      case 'scroll': {
        await this.scroll(params);
        break;
      }
      case 'type_keys': {
        await this.typeKeys(params);
        break;
      }
      case 'press_keys': {
        await this.pressKeys(params);
        break;
      }
      case 'type_text': {
        await this.typeText(params);
        break;
      }
      case 'paste_text': {
        await this.pasteText(params);
        break;
      }
      case 'wait': {
        const waitParams = params;
        await this.delay(waitParams.duration);
        break;
      }
      case 'screenshot':
        return this.screenshot();

      case 'cursor_position':
        return this.cursor_position();

      case 'application': {
        await this.application(params);
        break;
      }

      case 'write_file': {
        return this.writeFile(params);
      }

      case 'read_file': {
        return this.readFile(params);
      }

      default:
        throw new Error(
          `Unsupported computer action: ${(params as any).action}`,
        );
    }
  }

  private async moveMouse(action: MoveMouseAction): Promise<void> {
    await this.nutService.mouseMoveEvent(action.coordinates);
  }

  private async traceMouse(action: TraceMouseAction): Promise<void> {
    const { path, holdKeys } = action;

    // Move to the first coordinate
    await this.nutService.mouseMoveEvent(path[0]);

    // Hold keys if provided
    if (holdKeys) {
      await this.nutService.holdKeys(holdKeys, true);
    }

    // Move to each coordinate in the path
    for (const coordinates of path) {
      await this.nutService.mouseMoveEvent(coordinates);
    }

    // Release hold keys
    if (holdKeys) {
      await this.nutService.holdKeys(holdKeys, false);
    }
  }

  private async clickMouse(action: ClickMouseAction): Promise<void> {
    const { coordinates, button, holdKeys, clickCount } = action;

    // Move to coordinates if provided
    if (coordinates) {
      await this.nutService.mouseMoveEvent(coordinates);
    }

    // Hold keys if provided
    if (holdKeys) {
      await this.nutService.holdKeys(holdKeys, true);
    }

    // Perform clicks
    if (clickCount > 1) {
      // Perform multiple clicks
      for (let i = 0; i < clickCount; i++) {
        await this.nutService.mouseClickEvent(button);
        await this.delay(150);
      }
    } else {
      // Perform a single click
      await this.nutService.mouseClickEvent(button);
    }

    // Release hold keys
    if (holdKeys) {
      await this.nutService.holdKeys(holdKeys, false);
    }
  }

  private async pressMouse(action: PressMouseAction): Promise<void> {
    const { coordinates, button, press } = action;

    // Move to coordinates if provided
    if (coordinates) {
      await this.nutService.mouseMoveEvent(coordinates);
    }

    // Perform press
    if (press === 'down') {
      await this.nutService.mouseButtonEvent(button, true);
    } else {
      await this.nutService.mouseButtonEvent(button, false);
    }
  }

  private async dragMouse(action: DragMouseAction): Promise<void> {
    const { path, button, holdKeys } = action;

    // Move to the first coordinate
    await this.nutService.mouseMoveEvent(path[0]);

    // Hold keys if provided
    if (holdKeys) {
      await this.nutService.holdKeys(holdKeys, true);
    }

    // Perform drag
    await this.nutService.mouseButtonEvent(button, true);
    for (const coordinates of path) {
      await this.nutService.mouseMoveEvent(coordinates);
    }
    await this.nutService.mouseButtonEvent(button, false);

    // Release hold keys
    if (holdKeys) {
      await this.nutService.holdKeys(holdKeys, false);
    }
  }

  private async scroll(action: ScrollAction): Promise<void> {
    const { coordinates, direction, scrollCount, holdKeys } = action;

    // Move to coordinates if provided
    if (coordinates) {
      await this.nutService.mouseMoveEvent(coordinates);
    }

    // Hold keys if provided
    if (holdKeys) {
      await this.nutService.holdKeys(holdKeys, true);
    }

    // Perform scroll
    for (let i = 0; i < scrollCount; i++) {
      await this.nutService.mouseWheelEvent(direction, 1);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // Release hold keys
    if (holdKeys) {
      await this.nutService.holdKeys(holdKeys, false);
    }
  }

  private async typeKeys(action: TypeKeysAction): Promise<void> {
    const { keys, delay } = action;
    await this.nutService.sendKeys(keys, delay);
  }

  private async pressKeys(action: PressKeysAction): Promise<void> {
    const { keys, press } = action;
    await this.nutService.holdKeys(keys, press === 'down');
  }

  private async typeText(action: TypeTextAction): Promise<void> {
    const { text, delay } = action;
    await this.nutService.typeText(text, delay);
  }

  private async pasteText(action: PasteTextAction): Promise<void> {
    const { text } = action;
    await this.nutService.pasteText(text);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async screenshot(): Promise<{ image: string }> {
    this.logger.log(`Taking screenshot`);
    const buffer = await this.nutService.screendump();
    return { image: `${buffer.toString('base64')}` };
  }

  private async cursor_position(): Promise<{ x: number; y: number }> {
    this.logger.log(`Getting cursor position`);
    return await this.nutService.getCursorPosition();
  }

  private async application(action: ApplicationAction): Promise<void> {
    const execAsync = promisify(exec);

    // Helper to parse command string into executable and arguments
    const parseCommand = (
      commandString: string,
    ): { command: string; args: string[] } => {
      const tokens: string[] = [];
      let currentToken = '';
      let inQuotes = false;
      let quoteChar = '';

      for (let i = 0; i < commandString.length; i++) {
        const char = commandString[i];
        const prevChar = i > 0 ? commandString[i - 1] : '';

        if (inQuotes) {
          if (char === quoteChar && prevChar !== '\\') {
            inQuotes = false;
            quoteChar = '';
          } else {
            currentToken += char;
          }
        } else if (char === '"' || char === "'") {
          inQuotes = true;
          quoteChar = char;
        } else if (char === ' ') {
          if (currentToken.length > 0) {
            tokens.push(currentToken);
            currentToken = '';
          }
        } else {
          currentToken += char;
        }
      }

      if (currentToken.length > 0) {
        tokens.push(currentToken);
      }

      if (tokens.length === 0) {
        throw new Error(`Invalid command string: ${commandString}`);
      }

      return { command: tokens[0], args: tokens.slice(1) };
    };

    // Helper to spawn a command and forget about it
    const spawnAndForget = (
      command: string,
      args: string[],
      options: Record<string, any> = {},
    ): void => {
      const child = spawn(command, args, {
        env: { ...process.env, DISPLAY: ':0.0' }, // ensure DISPLAY is set for GUI tools
        stdio: 'ignore',
        detached: true,
        ...options,
      });
      child.unref(); // Allow the parent process to exit independently
    };

    // Helper to spawn a command string (which may include arguments)
    const spawnCommandString = (
      commandString: string,
      sudo: boolean = true,
      options: Record<string, any> = {},
    ): void => {
      try {
        const { command, args } = parseCommand(commandString);
        this.logger.debug(
          `Parsed command: ${command}, args: [${args.join(', ')}]`,
        );

        if (sudo) {
          // Run via sudo for GUI applications
          spawnAndForget('sudo', ['-u', 'user', command, ...args], options);
        } else {
          // Run directly
          spawnAndForget(command, args, options);
        }
      } catch (error) {
        this.logger.error(
          `Failed to spawn command string: ${commandString}`,
          error,
        );
        throw error;
      }
    };

    // Platform detection
    const isMacOS = process.platform === 'darwin';
    const isLinux = process.platform === 'linux';

    this.logger.debug(
      `Platform: ${process.platform} (macOS: ${isMacOS}, Linux: ${isLinux})`,
    );

    if (action.application === 'desktop') {
      if (isLinux) {
        spawnAndForget('sudo', ['-u', 'user', 'wmctrl', '-k', 'on']);
      } else if (isMacOS) {
        spawnAndForget('osascript', [
          '-e',
          'tell application "Finder" to set collapsed of every window of desktop to true',
        ]);
      }
      return;
    }

    const browserosCommand = process.env.BROWSEROS_APP_COMMAND || 'browseros';
    const browserosWmClass =
      process.env.BROWSEROS_APP_WMCLASS || 'browseros.BrowserOS';

    const turixCommand = process.env.TURIX_APP_COMMAND || 'open -a "Turix"';
    const turixWmClass = process.env.TURIX_APP_WMCLASS || 'Turix';

    const aiosCommand = process.env.AIOS_APP_COMMAND || 'python -m uvicorn runtime.launch:app --host 0.0.0.0 --port 8000';
    const aiosWmClass = process.env.AIOS_APP_WMCLASS || 'aios.AIOS';

    const openInterfaceCommand =
      process.env.OPEN_INTERFACE_APP_COMMAND || 'open -a "Open Interface"';
    const openInterfaceWmClass =
      process.env.OPEN_INTERFACE_APP_WMCLASS || 'Open-Interface';

    this.logger.debug(
      `Turix command: ${turixCommand}, wmclass: ${turixWmClass}`,
    );
    this.logger.debug(
      `BrowserOS command: ${browserosCommand}, wmclass: ${browserosWmClass}`,
    );
    this.logger.debug(
      `AIOS command: ${aiosCommand}, wmclass: ${aiosWmClass}`,
    );
    this.logger.debug(
      `Open-Interface command: ${openInterfaceCommand}, wmclass: ${openInterfaceWmClass}`,
    );

    const commandMap: Record<string, string> = {
      firefox: 'firefox-esr',
      '1password': '1password',
      thunderbird: 'thunderbird',
      vscode: 'code',
      browseros: browserosCommand,
      terminal: 'xfce4-terminal',
      directory: 'thunar',
      turix: turixCommand,
      aios: aiosCommand,
      'open-interface': openInterfaceCommand,
    };

    const processMap: Record<Application, string> = {
      firefox: 'Navigator.firefox-esr',
      '1password': '1password.1Password',
      thunderbird: 'Mail.thunderbird',
      vscode: 'code.Code',
      browseros: browserosWmClass,
      terminal: 'xfce4-terminal.Xfce4-Terminal',
      directory: 'Thunar',
      desktop: 'xfdesktop.Xfdesktop',
      turix: turixWmClass,
      aios: aiosWmClass,
      'open-interface': openInterfaceWmClass,
    };

    // Check if the application is already open
    let appOpen = false;
    const appIdentifier = processMap[action.application];

    this.logger.debug(
      `Checking if ${action.application} is open (identifier: ${appIdentifier})`,
    );

    try {
      if (isLinux) {
        // On Linux, use wmctrl -lx
        const { stdout } = await execAsync(
          `sudo -u user wmctrl -lx | grep "${appIdentifier}"`,
          { timeout: 5000 }, // 5 second timeout
        );
        appOpen = stdout.trim().length > 0;
        this.logger.debug(
          `Linux check result: appOpen=${appOpen}, stdout length=${stdout.trim().length}`,
        );
       } else if (isMacOS) {
        // On macOS, use osascript to check if app is running
        const appName =
          action.application === 'browseros'
            ? 'BrowserOS'
            : action.application === 'turix'
              ? 'Turix'
              : action.application === 'aios'
                ? 'AIOS'
                : action.application === 'open-interface'
                  ? 'Open Interface'
                : action.application.charAt(0).toUpperCase() +
                  action.application.slice(1);

        const { stdout } = await execAsync(
          `osascript -e 'tell application "System Events" to return name of every process whose name is "${appName}"'`,
          { timeout: 5000 },
        );
        appOpen = stdout.trim().length > 0;
        this.logger.debug(
          `macOS check result: appOpen=${appOpen}, appName=${appName}, stdout=${stdout.trim()}`,
        );
      }
    } catch (error) {
      // grep returns exit code 1 when no match is found – treat as "not open"
      // osascript returns error if app not found – treat as "not open"
      // Also handle timeout errors
      const err = error as {
        code?: number;
        message?: string;
        killed?: boolean;
        stack?: string;
      };
      if (err.code !== 1 && !err.message?.includes('timeout') && !err.killed) {
        this.logger.error(
          `Error checking if app is open: ${err.message}`,
          err.stack,
        );
        // Don't throw, treat as not open
      }
    }

    if (appOpen) {
      this.logger.log(`Application ${action.application} is already open`);

      if (isLinux) {
        // Fire and forget - activate window on Linux
        spawnAndForget('sudo', [
          '-u',
          'user',
          'wmctrl',
          '-x',
          '-a',
          appIdentifier,
        ]);

        // Fire and forget - maximize window on Linux
        spawnAndForget('sudo', [
          '-u',
          'user',
          'wmctrl',
          '-x',
          '-r',
          appIdentifier,
          '-b',
          'add,maximized_vert,maximized_horz',
        ]);
      } else if (isMacOS) {
        // On macOS, use osascript to activate and maximize
        const appName =
          action.application === 'browseros'
            ? 'BrowserOS'
            : action.application === 'turix'
              ? 'Turix'
              : action.application === 'aios'
                ? 'AIOS'
                : action.application.charAt(0).toUpperCase() +
                  action.application.slice(1);

        spawnAndForget('osascript', [
          '-e',
          `tell application "${appName}" to activate`,
          '-e',
          `tell application "${appName}" to set bounds of front window to {0, 0, 2000, 1200}`,
        ]);

        this.logger.log(`Activated and maximized ${appName} on macOS`);
      }

      return;
    }

    // Application is not open, open it - use proper command execution
    const commandString = commandMap[action.application];
    this.logger.log(
      `Launching ${action.application} with command: ${commandString}`,
    );

    try {
      if (isLinux) {
        // On Linux, use nohup with proper command parsing
        const { command, args } = parseCommand(commandString);
        spawnAndForget('sudo', ['-u', 'user', 'nohup', command, ...args]);
      } else if (isMacOS) {
        // On macOS, execute the command string directly (e.g., "open -a Turix")
        spawnCommandString(commandString, false); // No sudo needed on macOS for open command
      } else {
        // Fallback: try to spawn the command directly
        spawnCommandString(commandString, isLinux); // Use sudo only on Linux
      }

      this.logger.log(
        `Application ${action.application} launched successfully`,
      );
    } catch (error) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to launch application ${action.application}: ${err.message}`,
        err.stack,
      );
      throw error;
    }

    // Wait a brief moment for the application to start
    await this.delay(1000);

    return;
  }

  private async writeFile(
    action: WriteFileAction,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const execAsync = promisify(exec);

      // Decode base64 data
      const buffer = Buffer.from(action.data, 'base64');

      // Resolve path - if relative, make it relative to user's home directory
      let targetPath = action.path;
      if (!path.isAbsolute(targetPath)) {
        targetPath = path.join('/home/user/Desktop', targetPath);
      }

      // Ensure directory exists using sudo
      const dir = path.dirname(targetPath);
      try {
        await execAsync(`sudo mkdir -p "${dir}"`);
      } catch (error) {
        // Directory might already exist, which is fine
        this.logger.debug(`Directory creation: ${error.message}`);
      }

      // Write to a temporary file first
      const tempFile = `/tmp/bytebot_temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await fs.writeFile(tempFile, buffer);

      // Move the file to the target location using sudo
      try {
        await execAsync(`sudo cp "${tempFile}" "${targetPath}"`);
        await execAsync(`sudo chown user:user "${targetPath}"`);
        await execAsync(`sudo chmod 644 "${targetPath}"`);
        // Clean up temp file
        await fs.unlink(tempFile).catch(() => {});
      } catch (error) {
        // Clean up temp file on error
        await fs.unlink(tempFile).catch(() => {});
        throw error;
      }

      this.logger.log(`File written successfully to: ${targetPath}`);
      return {
        success: true,
        message: `File written successfully to: ${targetPath}`,
      };
    } catch (error) {
      this.logger.error(`Error writing file: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error writing file: ${error.message}`,
      };
    }
  }

  private async readFile(action: ReadFileAction): Promise<{
    success: boolean;
    data?: string;
    name?: string;
    size?: number;
    mediaType?: string;
    message?: string;
  }> {
    try {
      const execAsync = promisify(exec);

      // Resolve path - if relative, make it relative to user's home directory
      let targetPath = action.path;
      if (!path.isAbsolute(targetPath)) {
        targetPath = path.join('/home/user/Desktop', targetPath);
      }

      // Copy file to temp location using sudo to read it
      const tempFile = `/tmp/bytebot_read_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      try {
        // Copy the file to a temporary location we can read
        await execAsync(`sudo cp "${targetPath}" "${tempFile}"`);
        await execAsync(`sudo chmod 644 "${tempFile}"`);

        // Read file as buffer from temp location
        const buffer = await fs.readFile(tempFile);

        // Get file stats for size using sudo
        const { stdout: statOutput } = await execAsync(
          `sudo stat -c "%s" "${targetPath}"`,
        );
        const fileSize = parseInt(statOutput.trim(), 10);

        // Clean up temp file
        await fs.unlink(tempFile).catch(() => {});

        // Convert to base64
        const base64Data = buffer.toString('base64');

        // Extract filename from path
        const fileName = path.basename(targetPath);

        // Determine media type based on file extension
        const ext = path.extname(targetPath).toLowerCase().slice(1);
        const mimeTypes: Record<string, string> = {
          pdf: 'application/pdf',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          doc: 'application/msword',
          txt: 'text/plain',
          html: 'text/html',
          json: 'application/json',
          xml: 'text/xml',
          csv: 'text/csv',
          rtf: 'application/rtf',
          odt: 'application/vnd.oasis.opendocument.text',
          epub: 'application/epub+zip',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
          gif: 'image/gif',
          svg: 'image/svg+xml',
        };

        const mediaType = mimeTypes[ext] || 'application/octet-stream';

        this.logger.log(`File read successfully from: ${targetPath}`);
        return {
          success: true,
          data: base64Data,
          name: fileName,
          size: fileSize,
          mediaType: mediaType,
        };
      } catch (error) {
        // Clean up temp file on error
        await fs.unlink(tempFile).catch(() => {});
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error reading file: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error reading file: ${error.message}`,
      };
    }
  }
}
