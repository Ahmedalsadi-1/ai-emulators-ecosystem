import { ComputerAction } from './computerAction.types';

// Screen Controller Interface
export interface ScreenControllerStatus {
  name: string;
  displayName: string;
  description: string;
  isReady: boolean;
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface ScreenshotResult {
  image: string; // Base64 encoded image
  timestamp: string;
  controller: string;
  metadata?: Record<string, any>;
}

export interface ScreenController {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  getStatus(): Promise<ScreenControllerStatus>;
  executeAction(action: ComputerAction): Promise<any>;
  takeScreenshot(): Promise<ScreenshotResult>;
}