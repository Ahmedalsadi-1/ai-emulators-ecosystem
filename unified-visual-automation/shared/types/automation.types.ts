// shared/types/automation.types.ts
export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  metadata: WorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: Position;
  config: NodeConfig;
  platform: Platform;
  status?: NodeStatus;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: ConnectionType;
}

export interface WorkflowMetadata {
  author: string;
  version: string;
  tags: string[];
  platforms: Platform[];
  estimatedDuration: number;
}

export interface DetectedElement {
  id: string;
  type: ElementType;
  platform: Platform;
  coordinates: BoundingBox;
  properties: Record<string, any>;
  confidence: number;
  screenshot?: string;
  timestamp: Date;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AutomationAction {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  platforms: Platform[];
  parameters: ActionParameter[];
  executor: AutomationBackend;
  timeout?: number;
}

export interface ActionParameter {
  name: string;
  type: ParameterType;
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: ParameterValidation;
}

export interface VisualTest {
  id: string;
  name: string;
  workflowId: string;
  baselineScreenshot: string;
  currentScreenshot: string;
  differences: PixelDifference[];
  threshold: number;
  status: TestStatus;
  createdAt: Date;
  executedAt?: Date;
}

export interface PixelDifference {
  x: number;
  y: number;
  expectedColor: string;
  actualColor: string;
  difference: number;
}

export interface ScreenshotData {
  id: string;
  workflowId: string;
  nodeId?: string;
  imageData: string; // base64
  metadata: ScreenshotMetadata;
  timestamp: Date;
}

export interface ScreenshotMetadata {
  platform: Platform;
  dimensions: { width: number; height: number };
  elements?: DetectedElement[];
  annotations?: Annotation[];
}

export interface Annotation {
  type: 'arrow' | 'box' | 'text' | 'highlight';
  coordinates: BoundingBox;
  content?: string;
  color?: string;
}

// Enums and type aliases
export type NodeType = 'action' | 'condition' | 'loop' | 'screenshot' | 'assertion' | 'start' | 'end';
export type Platform = 'desktop' | 'web' | 'mobile';
export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type ConnectionType = 'flow' | 'data' | 'condition';
export type ElementType = 'button' | 'input' | 'text' | 'image' | 'container' | 'link' | 'dropdown';
export type ActionCategory = 'interaction' | 'navigation' | 'input' | 'assertion' | 'control' | 'data';
export type ParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'element' | 'screenshot';
export type AutomationBackend = 'openinterface' | 'factif' | 'turix' | 'unified';
export type TestStatus = 'pass' | 'fail' | 'pending' | 'error';

export interface Position {
  x: number;
  y: number;
}

export interface NodeConfig {
  actionId?: string;
  parameters?: Record<string, any>;
  condition?: string;
  assertion?: AssertionConfig;
  loop?: LoopConfig;
}

export interface AssertionConfig {
  type: 'element_exists' | 'text_matches' | 'visual_diff' | 'custom';
  target: string;
  expectedValue?: any;
  tolerance?: number;
}

export interface LoopConfig {
  type: 'count' | 'condition' | 'elements';
  count?: number;
  condition?: string;
  elements?: string; // selector for elements to loop over
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  custom?: (value: any) => boolean;
}