export interface ControllerOption {
  id: string;
  label: string;
}

export interface ControllerStatus {
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
  message?: string;
  lastChecked?: Date;
}

export interface ControllerState {
  id: string;
  isActive: boolean;
  priority: number; // 0 = highest priority
  lastActivated?: Date;
  config?: Record<string, any>;
}

export interface ControllerPreset {
  id: string;
  name: string;
  description?: string;
  controllers: ControllerState[];
  createdAt: Date;
  updatedAt: Date;
  isShared?: boolean;
}

export interface MultiControllerState {
  controllers: ControllerState[];
  activeControllerIds: string[];
  primaryControllerId?: string;
  presets: ControllerPreset[];
}

export interface WorkflowStep {
  id: string;
  controllerId: string;
  action: string;
  params?: Record<string, any>;
  conditions?: WorkflowCondition[];
  delay?: number; // milliseconds
}

export interface WorkflowCondition {
  type: 'status' | 'response' | 'timeout' | 'error';
  value: any;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists' | 'not_exists';
}

export interface ControllerWorkflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyboardShortcutHelp {
  key: string;
  description: string;
  category: 'navigation' | 'selection' | 'actions';
}