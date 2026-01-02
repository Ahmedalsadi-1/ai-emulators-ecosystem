import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { NutService } from '../nut/nut.service';
import { CrossPlatformPythonManager } from '../cross-platform-python-manager.service';
import {
  ComputerAction,
  ScreenshotResult,
  ScreenController,
  ScreenControllerStatus,
} from '@bytebot/shared';

@Injectable()
export class OpenInterfaceScreenController implements ScreenController {
  private readonly logger = new Logger(OpenInterfaceScreenController.name);
  private pythonProcess: any = null;
  private isReady = false;
  private serverPort = 5001; // Different from standalone Open-Interface

  // Python environment configuration
  private pythonPath: string;
  private readonly openInterfaceDir: string;
  private readonly serverScript: string;

  constructor(
    private readonly nutService: NutService,
    private readonly pythonManager: CrossPlatformPythonManager,
  ) {
    // Configure Python environment based on platform
    this.pythonPath = this.getPythonPath();
    this.openInterfaceDir = path.join(__dirname, '../../../../../Open-Interface');
    this.serverScript = path.join(this.openInterfaceDir, 'server_launch.py');

    this.logger.log(`Open-Interface Screen Controller initialized`);
    this.logger.log(`Python path: ${this.pythonPath}`);
    this.logger.log(`Open-Interface directory: ${this.openInterfaceDir}`);
  }

  private getPythonPath(): string {
    // Cross-platform Python path detection
    const platform = process.platform;

    // Check for explicit environment variable
    if (process.env.PYTHON_PATH) {
      return process.env.PYTHON_PATH;
    }

    // Platform-specific defaults
    switch (platform) {
      case 'win32':
        return 'python';
      case 'darwin':
      case 'linux':
      default:
        return 'python3';
    }
  }

  async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing Open-Interface Screen Controller...');

      // Setup Python environment using cross-platform manager
      const pythonEnv = await this.pythonManager.setupPythonEnvironment(this.openInterfaceDir);
      this.pythonPath = pythonEnv.executable; // Update with detected path

      // Start the Open-Interface server
      await this.startServer();

      // Wait for server to be ready
      await this.waitForServerReady();

      this.isReady = true;
      this.logger.log('✅ Open-Interface Screen Controller initialized successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to initialize Open-Interface Screen Controller: ${error.message}`);

      // Provide platform-specific guidance
      const { issues, recommendations } = await this.pythonManager.diagnoseIssues(this.openInterfaceDir);
      if (issues.length > 0) {
        this.logger.error('Issues found:', issues);
        this.logger.error('Recommendations:', recommendations);
      }

      throw error;
    }
  }

  async destroy(): Promise<void> {
    this.logger.log('Destroying Open-Interface Screen Controller...');

    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      setTimeout(() => {
        if (this.pythonProcess) {
          this.pythonProcess.kill('SIGKILL');
        }
      }, 5000);
    }

    this.isReady = false;
    this.logger.log('Open-Interface Screen Controller destroyed');
  }

  async getStatus(): Promise<ScreenControllerStatus> {
    return {
      name: 'open-interface',
      displayName: 'Open-Interface AI Controller',
      description: 'AI-powered computer control using GPT-4V and screenshot analysis',
      isReady: this.isReady,
      capabilities: [
        'screenshot',
        'mouse_control',
        'keyboard_input',
        'text_input',
        'file_operations',
        'application_control',
      ],
      metadata: {
        pythonPath: this.pythonPath,
        serverPort: this.serverPort,
        serverRunning: this.pythonProcess !== null,
      },
    };
  }

  async executeAction(action: ComputerAction): Promise<any> {
    if (!this.isReady) {
      throw new Error('Open-Interface Screen Controller is not ready');
    }

    try {
      // Convert Bytebot action to Open-Interface natural language request
      const request = this.convertActionToRequest(action);

      // Execute via HTTP API
      const result = await this.executeRequest(request);

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute action: ${error.message}`, error.stack);
      throw error;
    }
  }

  async takeScreenshot(): Promise<ScreenshotResult> {
    if (!this.isReady) {
      throw new Error('Open-Interface Screen Controller is not ready');
    }

    try {
      const response = await fetch(`http://localhost:${this.serverPort}/screenshot`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Screenshot failed');
      }

      return {
        image: data.image,
        timestamp: new Date().toISOString(),
        controller: 'open-interface',
      };
    } catch (error) {
      this.logger.error(`Screenshot failed: ${error.message}`);
      throw error;
    }
  }

  private convertActionToRequest(action: ComputerAction): string {
    switch (action.action) {
      case 'move_mouse':
        return `Move mouse to coordinates (${action.coordinates?.x || 0}, ${action.coordinates?.y || 0})`;

      case 'click_mouse':
        const button = action.button === 2 ? 'right' : action.button === 3 ? 'middle' : 'left';
        let request = `Click the ${button} mouse button`;
        if (action.coordinates) {
          request += ` at coordinates (${action.coordinates.x}, ${action.coordinates.y})`;
        }
        if (action.clickCount && action.clickCount > 1) {
          request += ` ${action.clickCount} times`;
        }
        return request;

      case 'press_mouse':
        const pressButton = action.button === 2 ? 'right' : action.button === 3 ? 'middle' : 'left';
        return `${action.press === 'down' ? 'Press down' : 'Release'} the ${pressButton} mouse button`;

      case 'drag_mouse':
        if (!action.path || action.path.length < 2) {
          throw new Error('Drag action requires path with at least 2 coordinates');
        }
        const start = action.path[0];
        const end = action.path[action.path.length - 1];
        return `Drag mouse from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`;

      case 'scroll':
        const direction = action.direction === 'up' ? 'up' : 'down';
        let scrollRequest = `Scroll ${direction} by ${action.scrollCount || 1} units`;
        if (action.coordinates) {
          scrollRequest += ` at coordinates (${action.coordinates.x}, ${action.coordinates.y})`;
        }
        return scrollRequest;

      case 'type_keys':
        const keys = Array.isArray(action.keys) ? action.keys.join(' + ') : action.keys;
        return `Press the following keys: ${keys}`;

      case 'press_keys':
        const pressKeys = Array.isArray(action.keys) ? action.keys.join(' + ') : action.keys;
        return `${action.press === 'down' ? 'Press down' : 'Release'} the following keys: ${pressKeys}`;

      case 'type_text':
        return `Type the following text: "${action.text}"`;

      case 'paste_text':
        return `Paste the following text: "${action.text}"`;

      case 'wait':
        return `Wait for ${action.duration || 1000} milliseconds`;

      case 'screenshot':
        return 'Take a screenshot and describe what you see';

      case 'cursor_position':
        return 'Get the current cursor position';

      case 'application':
        return `${action.application === 'desktop' ? 'Show desktop' : `Open ${action.application} application`}`;

      case 'write_file':
        return `Save the following content to file ${action.path}: ${action.data}`;

      case 'read_file':
        return `Read the content of file ${action.path}`;

      default:
        return `Execute computer action: ${JSON.stringify(action)}`;
    }
  }

  private async executeRequest(request: string): Promise<any> {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      this.logger.error(`Request execution failed: ${error.message}`);
      throw error;
    }
  }



  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log('Starting Open-Interface server...');

      const env = {
        ...process.env,
        OPEN_INTERFACE_PORT: this.serverPort.toString(),
        OPEN_INTERFACE_HOST: '127.0.0.1',
        BYTEBOT_INTEGRATION: 'true',
      };

      this.pythonProcess = spawn(this.pythonPath, [this.serverScript], {
        cwd: this.openInterfaceDir,
        env: env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle process output
      this.pythonProcess.stdout.on('data', (data) => {
        this.logger.debug(`Python stdout: ${data}`);
      });

      this.pythonProcess.stderr.on('data', (data) => {
        this.logger.debug(`Python stderr: ${data}`);
      });

      this.pythonProcess.on('close', (code) => {
        this.logger.log(`Python process exited with code ${code}`);
        this.pythonProcess = null;
        this.isReady = false;
      });

      this.pythonProcess.on('error', (error) => {
        this.logger.error('Failed to start Python process:', error);
        reject(error);
      });

      // Resolve immediately - server startup will be verified separately
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  private async waitForServerReady(maxAttempts = 30): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`http://localhost:${this.serverPort}/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'healthy') {
            this.logger.log('✅ Open-Interface server is ready');
            return;
          }
        }
      } catch (error) {
        // Server not ready yet
      }

      this.logger.debug(`Waiting for server... (attempt ${attempt}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Open-Interface server failed to start within timeout');
  }

  // Additional methods for advanced Open-Interface features
  async getServerStatus(): Promise<any> {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/health`);
      return await response.json();
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async updateSettings(settings: any): Promise<any> {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }

  async getSettings(): Promise<any> {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/settings`);
      return await response.json();
    } catch (error) {
      return {};
    }
  }
}