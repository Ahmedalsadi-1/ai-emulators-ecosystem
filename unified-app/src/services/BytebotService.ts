import axios, { AxiosInstance } from 'axios';
import { BytebotServiceCard } from '../components/BytebotServiceCard';

// Define types locally to avoid dependency issues
export type Coordinates = { x: number; y: number };
export type Button = "left" | "right" | "middle";
export type Press = "up" | "down";
export type Application =
  | "firefox"
  | "1password"
  | "thunderbird"
  | "vscode"
  | "terminal"
  | "desktop"
  | "directory";

// Define individual computer action types
export type MoveMouseAction = {
  action: "move_mouse";
  coordinates: Coordinates;
};

export type ClickMouseAction = {
  action: "click_mouse";
  coordinates?: Coordinates;
  button: Button;
  holdKeys?: string[];
  clickCount: number;
};

export type PressMouseAction = {
  action: "press_mouse";
  coordinates?: Coordinates;
  button: Button;
  press: Press;
};

export type DragMouseAction = {
  action: "drag_mouse";
  path: Coordinates[];
  button: Button;
  holdKeys?: string[];
};

export type ScrollAction = {
  action: "scroll";
  coordinates?: Coordinates;
  direction: "up" | "down" | "left" | "right";
  scrollCount: number;
  holdKeys?: string[];
};

export type TypeKeysAction = {
  action: "type_keys";
  keys: string[];
  delay?: number;
};

export type PressKeysAction = {
  action: "press_keys";
  keys: string[];
  press: Press;
};

export type TypeTextAction = {
  action: "type_text";
  text: string;
  delay?: number;
  sensitive?: boolean;
};

export type PasteTextAction = {
  action: "paste_text";
  text: string;
};

export type WaitAction = {
  action: "wait";
  duration: number;
};

export type ScreenshotAction = {
  action: "screenshot";
};

export type CursorPositionAction = {
  action: "cursor_position";
};

export type ApplicationAction = {
  action: "application";
  application: Application;
};

export type WriteFileAction = {
  action: "write_file";
  path: string;
  data: string; // Base64 encoded data
};

export type ReadFileAction = {
  action: "read_file";
  path: string;
};

// Union type for all computer actions
export type ComputerAction =
  | MoveMouseAction
  | ClickMouseAction
  | PressMouseAction
  | DragMouseAction
  | ScrollAction
  | TypeKeysAction
  | PressKeysAction
  | TypeTextAction
  | PasteTextAction
  | WaitAction
  | ScreenshotAction
  | CursorPositionAction
  | ApplicationAction
  | WriteFileAction
  | ReadFileAction;

// Custom error class for Bytebot service-specific errors
class BytebotServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BytebotServiceError';
  }
}

// API Response interfaces
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ScreenshotResponse {
  image: string; // Base64 encoded image
}

interface CursorPositionResponse {
  x: number;
  y: number;
}

interface FileOperationResponse {
  success: boolean;
  message: string;
  name?: string;
  size?: number;
  mediaType?: string;
  data?: string; // Base64 encoded for read operations
}

// Natural language command processing interfaces
interface CommandParseResult {
  action: string;
  params: any;
  confidence: number;
}

/**
 * BytebotService provides a standardized API wrapper for the Bytebot computer control service.
 * Handles mouse control, keyboard input, screenshots, application management, and file operations.
 * Integrates with the running Bytebot container to provide clean REST endpoints.
 */
export class BytebotService {
  private baseUrl: string;
  private client: AxiosInstance;


  constructor(baseUrl: string = 'http://localhost:9990') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000, // 10 second timeout for computer operations
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          const errorData = error.response.data;
          throw new BytebotServiceError(
            errorData.message || errorData.error || `Bytebot API Error: ${error.response.status}`
          );
        }
        throw new BytebotServiceError(`Bytebot Service Error: ${error.message}`);
      }
    );
  }

  /**
   * Initialize the Bytebot service connection
   */
  public async initialize(): Promise<void> {
    try {
      await this.getServiceStatus();
      console.info('BytebotService: Successfully initialized');
    } catch (error) {
      console.error('BytebotService: Failed to initialize', error);
      throw new BytebotServiceError(`Failed to initialize Bytebot service: ${(error as Error).message}`);
    }
  }

  /**
   * Returns the service registration object for TuriX.
   * Call TuriX.registerService(this.getServiceRegistration()) to register.
   */
  public static getServiceRegistration() {
    return {
      name: 'bytebot',
      capabilities: ['computer-control', 'mouse-control', 'keyboard-control', 'screen-capture', 'application-management', 'file-operations'],
      ui: BytebotServiceCard,
      commands: [
        'take screenshot',
        'move mouse to',
        'click mouse',
        'right click',
        'double click',
        'type text',
        'press key',
        'hold key',
        'release key',
        'open application',
        'close application',
        'scroll',
        'drag mouse',
        'get cursor position',
        'wait',
        'write file',
        'read file',
        'paste text'
      ]
    };
  }

  /**
   * Processes natural language commands for the Bytebot service.
   * @param command - The natural language command to process.
   * @returns Promise resolving to the command result.
   */
  public async processCommand(command: string): Promise<any> {
    try {
      const normalizedCommand = command.toLowerCase().trim();
      const parsedCommand = this.parseNaturalLanguageCommand(normalizedCommand);

      if (parsedCommand.confidence < 0.5) {
        throw new BytebotServiceError(`Unrecognized command: ${command}`);
      }

      switch (parsedCommand.action) {
        case 'screenshot':
          return await this.takeScreenshot();

        case 'move_mouse':
          return await this.moveMouse(parsedCommand.params.coordinates);

        case 'click_mouse':
          return await this.clickMouse(parsedCommand.params);

        case 'right_click':
          return await this.clickMouse({
            coordinates: parsedCommand.params.coordinates,
            button: 'right',
            clickCount: 1
          });

        case 'double_click':
          return await this.clickMouse({
            coordinates: parsedCommand.params.coordinates,
            button: 'left',
            clickCount: 2
          });

        case 'type_text':
          return await this.typeText(parsedCommand.params.text, parsedCommand.params.delay);

        case 'press_key':
          return await this.pressKeys(parsedCommand.params.keys, 'down');

        case 'hold_key':
          return await this.pressKeys(parsedCommand.params.keys, 'down');

        case 'release_key':
          return await this.pressKeys(parsedCommand.params.keys, 'up');

        case 'open_application':
          return await this.openApplication(parsedCommand.params.application);

        case 'close_application':
          return await this.openApplication('desktop'); // Close current app by showing desktop

        case 'scroll':
          return await this.scroll(parsedCommand.params);

        case 'drag_mouse':
          return await this.dragMouse(parsedCommand.params);

        case 'cursor_position':
          return await this.getCursorPosition();

        case 'wait':
          return await this.wait(parsedCommand.params.duration);

        case 'write_file':
          return await this.writeFile(parsedCommand.params.path, parsedCommand.params.data);

        case 'read_file':
          return await this.readFile(parsedCommand.params.path);

        case 'paste_text':
          return await this.pasteText(parsedCommand.params.text);

        default:
          throw new BytebotServiceError(`Unsupported action: ${parsedCommand.action}`);
      }
    } catch (error) {
      console.error('BytebotService: Command processing failed', error);
      throw new BytebotServiceError(`Failed to process command: ${(error as Error).message}`);
    }
  }

  // ===============================
  // MOUSE CONTROL ENDPOINTS
  // ===============================

  /**
   * Move mouse cursor to specified coordinates
   * @param coordinates - Target coordinates {x, y}
   * @returns Promise resolving to operation result
   */
  public async moveMouse(coordinates: Coordinates): Promise<ApiResponse> {
    try {
      const action: MoveMouseAction = {
        action: 'move_mouse',
        coordinates
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Mouse moved successfully');
      return { success: true, message: 'Mouse moved successfully' };
    } catch (error) {
      console.error('BytebotService: Failed to move mouse', error);
      throw new BytebotServiceError(`Failed to move mouse: ${(error as Error).message}`);
    }
  }

  /**
   * Perform mouse click operation
   * @param params - Click parameters including coordinates, button, and click count
   * @returns Promise resolving to operation result
   */
  public async clickMouse(params: {
    coordinates?: Coordinates;
    button: 'left' | 'right' | 'middle';
    clickCount?: number;
    holdKeys?: string[];
  }): Promise<ApiResponse> {
    try {
      const action: ClickMouseAction = {
        action: 'click_mouse',
        coordinates: params.coordinates,
        button: params.button,
        clickCount: params.clickCount || 1,
        holdKeys: params.holdKeys
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Mouse click performed successfully');
      return { success: true, message: `${params.button} mouse click performed successfully` };
    } catch (error) {
      console.error('BytebotService: Failed to click mouse', error);
      throw new BytebotServiceError(`Failed to click mouse: ${(error as Error).message}`);
    }
  }

  /**
   * Perform mouse press/release operation
   * @param params - Press parameters including coordinates, button, and press state
   * @returns Promise resolving to operation result
   */
  public async pressMouse(params: {
    coordinates?: Coordinates;
    button: 'left' | 'right' | 'middle';
    press: 'up' | 'down';
  }): Promise<ApiResponse> {
    try {
      const action: PressMouseAction = {
        action: 'press_mouse',
        coordinates: params.coordinates,
        button: params.button,
        press: params.press
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Mouse press performed successfully');
      return { success: true, message: `Mouse ${params.button} button ${params.press} performed successfully` };
    } catch (error) {
      console.error('BytebotService: Failed to press mouse', error);
      throw new BytebotServiceError(`Failed to press mouse: ${(error as Error).message}`);
    }
  }

  /**
   * Perform mouse drag operation
   * @param params - Drag parameters including path, button, and optional hold keys
   * @returns Promise resolving to operation result
   */
  public async dragMouse(params: {
    path: Coordinates[];
    button: 'left' | 'right' | 'middle';
    holdKeys?: string[];
  }): Promise<ApiResponse> {
    try {
      const action: DragMouseAction = {
        action: 'drag_mouse',
        path: params.path,
        button: params.button,
        holdKeys: params.holdKeys
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Mouse drag performed successfully');
      return { success: true, message: 'Mouse drag performed successfully' };
    } catch (error) {
      console.error('BytebotService: Failed to drag mouse', error);
      throw new BytebotServiceError(`Failed to drag mouse: ${(error as Error).message}`);
    }
  }

  /**
   * Perform scroll operation
   * @param params - Scroll parameters including coordinates, direction, and scroll count
   * @returns Promise resolving to operation result
   */
  public async scroll(params: {
    coordinates?: Coordinates;
    direction: 'up' | 'down' | 'left' | 'right';
    scrollCount: number;
    holdKeys?: string[];
  }): Promise<ApiResponse> {
    try {
      const action: ScrollAction = {
        action: 'scroll',
        coordinates: params.coordinates,
        direction: params.direction,
        scrollCount: params.scrollCount,
        holdKeys: params.holdKeys
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Scroll performed successfully');
      return { success: true, message: `Scrolled ${params.direction} ${params.scrollCount} times` };
    } catch (error) {
      console.error('BytebotService: Failed to scroll', error);
      throw new BytebotServiceError(`Failed to scroll: ${(error as Error).message}`);
    }
  }

  // ===============================
  // KEYBOARD CONTROL ENDPOINTS
  // ===============================

  /**
   * Type keys with optional delay between keystrokes
   * @param keys - Array of key names to type
   * @param delay - Optional delay between keystrokes in milliseconds
   * @returns Promise resolving to operation result
   */
  public async typeKeys(keys: string[], delay?: number): Promise<ApiResponse> {
    try {
      const action: TypeKeysAction = {
        action: 'type_keys',
        keys,
        delay
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Keys typed successfully');
      return { success: true, message: `Typed keys: ${keys.join(', ')}` };
    } catch (error) {
      console.error('BytebotService: Failed to type keys', error);
      throw new BytebotServiceError(`Failed to type keys: ${(error as Error).message}`);
    }
  }

  /**
   * Press or release keys
   * @param keys - Array of key names
   * @param press - Press state ('up' or 'down')
   * @returns Promise resolving to operation result
   */
  public async pressKeys(keys: string[], press: 'up' | 'down'): Promise<ApiResponse> {
    try {
      const action: PressKeysAction = {
        action: 'press_keys',
        keys,
        press
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Keys pressed successfully');
      return { success: true, message: `Keys ${press}: ${keys.join(', ')}` };
    } catch (error) {
      console.error('BytebotService: Failed to press keys', error);
      throw new BytebotServiceError(`Failed to press keys: ${(error as Error).message}`);
    }
  }

  /**
   * Type text with optional delay between characters
   * @param text - Text to type
   * @param delay - Optional delay between characters in milliseconds
   * @returns Promise resolving to operation result
   */
  public async typeText(text: string, delay?: number): Promise<ApiResponse> {
    try {
      const action: TypeTextAction = {
        action: 'type_text',
        text,
        delay
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Text typed successfully');
      return { success: true, message: `Typed text: "${text}"` };
    } catch (error) {
      console.error('BytebotService: Failed to type text', error);
      throw new BytebotServiceError(`Failed to type text: ${(error as Error).message}`);
    }
  }

  /**
   * Paste text using system clipboard
   * @param text - Text to paste
   * @returns Promise resolving to operation result
   */
  public async pasteText(text: string): Promise<ApiResponse> {
    try {
      const action: PasteTextAction = {
        action: 'paste_text',
        text
      };

      await this.client.post('/computer-use', action);
      console.info('BytebotService: Text pasted successfully');
      return { success: true, message: `Pasted text: "${text}"` };
    } catch (error) {
      console.error('BytebotService: Failed to paste text', error);
      throw new BytebotServiceError(`Failed to paste text: ${(error as Error).message}`);
    }
  }

  // ===============================
  // SCREENSHOT ENDPOINTS
  // ===============================

  /**
   * Take a screenshot of the current screen
   * @returns Promise resolving to screenshot data (base64 encoded image)
   */
  public async takeScreenshot(): Promise<ScreenshotResponse> {
    try {
      const action: ScreenshotAction = {
        action: 'screenshot'
      };

      const response = await this.client.post('/computer-use', action);
      const result: ScreenshotResponse = response.data;

      console.info('BytebotService: Screenshot captured successfully');
      return result;
    } catch (error) {
      console.error('BytebotService: Failed to take screenshot', error);
      throw new BytebotServiceError(`Failed to take screenshot: ${(error as Error).message}`);
    }
  }

  /**
   * Get current cursor position
   * @returns Promise resolving to cursor coordinates
   */
  public async getCursorPosition(): Promise<CursorPositionResponse> {
    try {
      const action: CursorPositionAction = {
        action: 'cursor_position'
      };

      const response = await this.client.post('/computer-use', action);
      console.info('BytebotService: Cursor position retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('BytebotService: Failed to get cursor position', error);
      throw new BytebotServiceError(`Failed to get cursor position: ${(error as Error).message}`);
    }
  }

  // ===============================
  // APPLICATION MANAGEMENT ENDPOINTS
  // ===============================

  /**
   * Open or switch to an application
   * @param application - Application name to open
   * @returns Promise resolving to operation result
   */
  public async openApplication(application: Application): Promise<ApiResponse> {
    try {
      const action: ApplicationAction = {
        action: 'application',
        application
      };

      await this.client.post('/computer-use', action);
      console.info(`BytebotService: Application ${application} opened successfully`);
      return { success: true, message: `Application ${application} opened successfully` };
    } catch (error) {
      console.error('BytebotService: Failed to open application', error);
      throw new BytebotServiceError(`Failed to open application: ${(error as Error).message}`);
    }
  }

  // ===============================
  // FILE OPERATIONS ENDPOINTS
  // ===============================

  /**
   * Write data to a file
   * @param path - File path to write to
   * @param data - Base64 encoded data to write
   * @returns Promise resolving to file operation result
   */
  public async writeFile(path: string, data: string): Promise<FileOperationResponse> {
    try {
      const action: WriteFileAction = {
        action: 'write_file',
        path,
        data
      };

      const response = await this.client.post('/computer-use', action);
      console.info(`BytebotService: File written successfully to ${path}`);
      return response.data;
    } catch (error) {
      console.error('BytebotService: Failed to write file', error);
      throw new BytebotServiceError(`Failed to write file: ${(error as Error).message}`);
    }
  }

  /**
   * Read data from a file
   * @param path - File path to read from
   * @returns Promise resolving to file data (base64 encoded)
   */
  public async readFile(path: string): Promise<FileOperationResponse> {
    try {
      const action: ReadFileAction = {
        action: 'read_file',
        path
      };

      const response = await this.client.post('/computer-use', action);
      console.info(`BytebotService: File read successfully from ${path}`);
      return response.data;
    } catch (error) {
      console.error('BytebotService: Failed to read file', error);
      throw new BytebotServiceError(`Failed to read file: ${(error as Error).message}`);
    }
  }

  // ===============================
  // UTILITY ENDPOINTS
  // ===============================

  /**
   * Wait for a specified duration
   * @param duration - Duration to wait in milliseconds
   * @returns Promise resolving after the wait period
   */
  public async wait(duration: number): Promise<ApiResponse> {
    try {
      const action: WaitAction = {
        action: 'wait',
        duration
      };

      await this.client.post('/computer-use', action);
      console.info(`BytebotService: Waited ${duration}ms successfully`);
      return { success: true, message: `Waited ${duration}ms` };
    } catch (error) {
      console.error('BytebotService: Failed to wait', error);
      throw new BytebotServiceError(`Failed to wait: ${(error as Error).message}`);
    }
  }

  /**
   * Get the current status of the Bytebot service
   * @returns Promise resolving to service status
   */
  public async getServiceStatus(): Promise<any> {
    try {
      const response = await this.client.get('/status');
      return response.data;
    } catch (error) {
      console.error('BytebotService: Failed to get service status', error);
      throw new BytebotServiceError(`Failed to get service status: ${(error as Error).message}`);
    }
  }

  /**
   * Get the health status of the Bytebot service
   * @returns Promise resolving to health status
   */
  public async getHealthStatus(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('BytebotService: Health check failed', error);
      throw new BytebotServiceError(`Health check failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get VNC URL for direct browser access
   * @returns VNC URL string
   */
  public getVncUrl(): string {
    return `${this.baseUrl}/vnc`;
  }

  // ===============================
  // NATURAL LANGUAGE PROCESSING
  // ===============================

  /**
   * Parse natural language commands into structured actions
   * @param command - Natural language command string
   * @returns Parsed command with action and parameters
   */
  private parseNaturalLanguageCommand(command: string): CommandParseResult {
    // Screenshot commands
    if (command.includes('screenshot') || command.includes('screen shot') || command.includes('capture screen')) {
      return { action: 'screenshot', params: {}, confidence: 0.9 };
    }

    // Mouse movement commands
    if (command.includes('move mouse') || command.includes('mouse to')) {
      const coords = this.extractCoordinates(command);
      if (coords) {
        return { action: 'move_mouse', params: { coordinates: coords }, confidence: 0.8 };
      }
    }

    // Mouse click commands
    if (command.includes('click') || command.includes('left click')) {
      const coords = this.extractCoordinates(command);
      const isDoubleClick = command.includes('double click') || command.includes('double-click');
      return {
        action: isDoubleClick ? 'double_click' : 'click_mouse',
        params: {
          coordinates: coords,
          button: 'left',
          clickCount: isDoubleClick ? 2 : 1
        },
        confidence: 0.85
      };
    }

    if (command.includes('right click') || command.includes('right-click')) {
      const coords = this.extractCoordinates(command);
      return {
        action: 'right_click',
        params: { coordinates: coords, button: 'right', clickCount: 1 },
        confidence: 0.85
      };
    }

    // Typing commands
    if (command.includes('type') || command.includes('enter text') || command.includes('input text')) {
      const text = this.extractQuotedText(command) || command.replace(/^(type|enter|input)/i, '').trim();
      return { action: 'type_text', params: { text }, confidence: 0.8 };
    }

    // Key press commands
    if (command.includes('press key') || command.includes('press')) {
      const keys = this.extractKeys(command);
      return { action: 'press_key', params: { keys }, confidence: 0.75 };
    }

    if (command.includes('hold key') || command.includes('hold')) {
      const keys = this.extractKeys(command);
      return { action: 'hold_key', params: { keys }, confidence: 0.75 };
    }

    if (command.includes('release key') || command.includes('release')) {
      const keys = this.extractKeys(command);
      return { action: 'release_key', params: { keys }, confidence: 0.75 };
    }

    // Application commands
    if (command.includes('open') || command.includes('launch') || command.includes('start')) {
      const app = this.extractApplication(command);
      if (app) {
        return { action: 'open_application', params: { application: app }, confidence: 0.8 };
      }
    }

    if (command.includes('close') || command.includes('exit')) {
      return { action: 'close_application', params: {}, confidence: 0.7 };
    }

    // Scroll commands
    if (command.includes('scroll')) {
      const direction = command.includes('up') ? 'up' :
                       command.includes('down') ? 'down' :
                       command.includes('left') ? 'left' : 'right';
      const coords = this.extractCoordinates(command);
      return {
        action: 'scroll',
        params: { coordinates: coords, direction, scrollCount: 3 },
        confidence: 0.8
      };
    }

    // Cursor position command
    if (command.includes('cursor position') || command.includes('mouse position')) {
      return { action: 'cursor_position', params: {}, confidence: 0.9 };
    }

    // Wait command
    if (command.includes('wait') || command.includes('pause')) {
      const duration = this.extractDuration(command);
      return { action: 'wait', params: { duration }, confidence: 0.8 };
    }

    return { action: 'unknown', params: {}, confidence: 0.0 };
  }

  // Helper methods for command parsing
  private extractCoordinates(command: string): Coordinates | null {
    const coordRegex = /(?:at\s*)?(\d+)[,\s]+(\d+)/;
    const match = command.match(coordRegex);
    if (match) {
      return { x: parseInt(match[1]), y: parseInt(match[2]) };
    }
    return null;
  }

  private extractQuotedText(command: string): string | null {
    const quoteRegex = /["']([^"']+)["']/;
    const match = command.match(quoteRegex);
    return match ? match[1] : null;
  }

  private extractKeys(command: string): string[] {
    // Simple key extraction - could be enhanced with more sophisticated parsing
    const keyWords = command.split(/\s+/).slice(-3); // Take last few words as potential keys
    return keyWords.filter(word => word.length > 0);
  }

  private extractApplication(command: string): Application | null {
    const apps: Application[] = ['firefox', 'vscode', 'terminal', 'directory', 'desktop'];
    for (const app of apps) {
      if (command.includes(app)) {
        return app;
      }
    }
    return null;
  }

  private extractDuration(command: string): number {
    const durationRegex = /(\d+)\s*(ms|millisecond|second|minute)/i;
    const match = command.match(durationRegex);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case 'second': return value * 1000;
        case 'minute': return value * 60000;
        default: return value; // Assume milliseconds
      }
    }
    return 1000; // Default 1 second
  }
}

// Export default instance
export default new BytebotService();