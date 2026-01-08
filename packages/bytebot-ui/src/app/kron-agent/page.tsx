"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  Copy,
  GitBranch,
  Layers,
  Zap,
  Database,
  Globe,
  Mail,
  MessageSquare,
  FileText,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  MoreHorizontal,
  Save,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit3,
  X,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Minimize2,
  Maximize2,
  Search,
  Filter,
  User,
  Bot,
  Cpu,
  Network,
  Search as SearchIcon,
  Database as DatabaseIcon,
  Globe as GlobeIcon,
  Mail as MailIcon,
  MessageSquare as MessageIcon,
  FileText as FileIcon,
  Terminal as TerminalIcon,
} from "lucide-react";

// ============================================
// WORKFLOW TYPES & INTERFACES
// ============================================

type NodeType = 
  | 'trigger' 
  | 'agent' 
  | 'condition' 
  | 'action' 
  | 'loop' 
  | 'parallel' 
  | 'human_approval'
  | 'data_extraction'
  | 'web_scraping'
  | 'api_call'
  | 'notification'
  | 'storage';

type AgentProvider = 'openai' | 'anthropic' | 'groq' | 'routeway' | 'ollama' | 'custom';

interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  status: 'idle' | 'running' | 'completed' | 'error' | 'waiting';
  output?: string;
  error?: string;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'running' | 'paused' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  executionHistory: ExecutionLog[];
}

interface ExecutionLog {
  id: string;
  nodeId: string;
  status: 'started' | 'completed' | 'error';
  timestamp: string;
  duration: number;
  output?: string;
  error?: string;
}

// ============================================
// NODE CONFIGURATIONS
// ============================================

const NODE_TEMPLATES: Record<NodeType, { icon: React.ElementType; color: string; category: string; description: string }> = {
  trigger: { icon: Zap, color: 'text-yellow-400', category: 'Trigger', description: 'Start workflow on event' },
  agent: { icon: Bot, color: 'text-purple-400', category: 'AI', description: 'AI agent with LLM' },
  condition: { icon: GitBranch, color: 'text-blue-400', category: 'Logic', description: 'Conditional branching' },
  action: { icon: Cpu, color: 'text-green-400', category: 'Action', description: 'Execute action' },
  loop: { icon: RefreshCw, color: 'text-orange-400', category: 'Logic', description: 'Loop over items' },
  parallel: { icon: Layers, color: 'text-cyan-400', category: 'Logic', description: 'Parallel execution' },
  human_approval: { icon: User, color: 'text-pink-400', category: 'Human', description: 'Require approval' },
  data_extraction: { icon: Database, color: 'text-indigo-400', category: 'Data', description: 'Extract structured data' },
  web_scraping: { icon: Globe, color: 'text-teal-400', category: 'Data', description: 'Scrape web content' },
  api_call: { icon: Network, color: 'text-violet-400', category: 'Integration', description: 'HTTP API call' },
  notification: { icon: MessageSquare, color: 'text-amber-400', category: 'Integration', description: 'Send notification' },
  storage: { icon: FileText, color: 'text-gray-400', category: 'Data', description: 'Store data' },
};

const AGENT_PROVIDERS: { id: AgentProvider; name: string; models: string[] }[] = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-haiku-3-20250514'] },
  { id: 'groq', name: 'Groq', models: ['qwen-qwq-32b', 'llama-3.1-70b', 'mixtral-8x7b'] },
  { id: 'routeway', name: 'Routeway', models: ['routeway-reasoner', 'routeway-fast'] },
  { id: 'ollama', name: 'Ollama', models: ['llama3.2', 'qwen2.5', 'deepseek-r1'] },
];

// ============================================
// VISUAL LOGIC MAP (MARKDOWN FLOWCHART)
// ============================================

const WORKFLOW_FLOWCHART = `
# KRON-AGENT Workflow Architecture

## Visual Logic Map

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        KRON-AGENT WORKFLOW ENGINE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   TRIGGER   │────▶│    AGENT    │────▶│   BRANCH    │────▶│   ACTION    │   │
│  │   (Start)   │     │  (Reason)  │     │  (If/Else) │     │  (Execute)  │   │
│  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘   │
│        │                   │                   │                   │            │
│        ▼                   ▼                   ▼                   ▼            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   TIMER     │     │  MANAGER    │     │   LOOP      │     │   PARALLEL  │   │
│  │   EVENT     │     │   AGENT     │     │  (Iterate)  │     │  (Concurrent│   │
│  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘   │
│        │                   │                   │                   │            │
│        └───────────────────┴───────────────────┴───────────────────┘            │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    HUMAN-IN-THE-LOOP GATE                               │  │
│  │              (Approval Required for Sensitive Actions)                   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                       OUTPUT & MONITORING                                │  │
│  │   • Real-time execution status    • Error handling & recovery            │  │
│  │   • Data extraction & storage     • Notifications & reporting            │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

## Node Categories

1. **TRIGGER NODES** (Start the workflow)
   - Timer/Schedule
   - Webhook/API
   - Event listener
   - Manual trigger

2. **AGENT NODES** (AI Reasoning)
   - Manager Agent (orchestrates sub-agents)
   - Worker Agent (specialized tasks)
   - Scraper Agent (web data extraction)
   - Analyst Agent (data processing)

3. **LOGIC NODES** (Flow Control)
   - Condition (if/else branching)
   - Loop (for each/while)
   - Parallel (concurrent execution)
   - Parallel-Branch (multiple paths)

4. **ACTION NODES** (Execution)
   - API Call
   - Database Operation
   - File Operation
   - Notification Send

5. **HUMAN NODES** (Approval Gates)
   - Approval Required
   - Review Step
   - Manual Intervention
\`\`\`

## Workflow Structure

\`\`\`
Workflow Definition:
{
  "id": "unique-workflow-id",
  "name": "Research & Report Generator",
  "nodes": [
    { "id": "trigger-1", "type": "trigger", "config": { "event": "schedule" }},
    { "id": "agent-1", "type": "agent", "config": { "provider": "openai", "model": "gpt-4o" }},
    { "id": "condition-1", "type": "condition", "config": { "condition": "data_present" }}
  ],
  "edges": [
    { "source": "trigger-1", "target": "agent-1" },
    { "source": "agent-1", "target": "condition-1", "label": "success" }
  ]
}
\`\`\`
`;

// ============================================
// COMPONENT: NODE CARD
// ============================================

function NodeCard({ 
  node, 
  isSelected, 
  onSelect, 
  onDelete,
  onEdit 
}: { 
  node: WorkflowNode; 
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const template = NODE_TEMPLATES[node.type];
  const Icon = template.icon;

  const statusColors = {
    idle: 'border-gray-500/50',
    running: 'border-yellow-500/50 animate-pulse',
    completed: 'border-green-500/50',
    error: 'border-red-500/50',
    waiting: 'border-blue-500/50',
  };

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all
        ${isSelected 
          ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-400/20' 
          : `${statusColors[node.status]} bg-kronos-glass hover:bg-white/10`
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Status Indicator */}
      <div className="absolute top-2 right-2">
        <StatusIndicator status={node.status} />
      </div>

      {/* Node Icon */}
      <div className={`w-12 h-12 rounded-xl ${template.color} bg-white/5 flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Node Info */}
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {template.category}
        </div>
        <div className="font-semibold text-white">
          {node.name}
        </div>
        <div className="text-xs text-gray-400">
          {node.description}
        </div>
      </div>

      {/* Node Actions */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 rounded bg-white/10 hover:bg-white/20">
          <Edit3 className="w-3 h-3 text-gray-400" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded bg-white/10 hover:bg-red-500/20">
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// COMPONENT: STATUS INDICATOR
// ============================================

function StatusIndicator({ status }: { status: WorkflowNode['status'] }) {
  const config = {
    idle: { color: 'bg-gray-500', label: 'Idle' },
    running: { color: 'bg-yellow-500 animate-pulse', label: 'Running' },
    completed: { color: 'bg-green-500', label: 'Done' },
    error: { color: 'bg-red-500', label: 'Error' },
    waiting: { color: 'bg-blue-500', label: 'Waiting' },
  };

  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[9px] font-medium text-gray-400">{label}</span>
    </div>
  );
}

// ============================================
// COMPONENT: WORKFLOW CANVAS
// ============================================

function WorkflowCanvas({ 
  workflow, 
  selectedNodeId, 
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  onAddNode 
}: {
  workflow: Workflow;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onUpdateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  onDeleteNode: (id: string) => void;
  onAddNode: (type: NodeType) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Calculate node positions in a grid
  const gridPositions = useMemo(() => {
    const cols = 3;
    return workflow.nodes.map((node, i) => ({
      ...node,
      position: {
        x: 20 + (i % cols) * 280,
        y: 20 + Math.floor(i / cols) * 180,
      },
    }));
  }, [workflow.nodes]);

  return (
    <div 
      ref={canvasRef}
      className="flex-1 bg-kronos-obsidian relative overflow-hidden"
      onClick={() => onSelectNode(null)}
    >
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Nodes */}
      <div className="absolute inset-0 p-6">
        {gridPositions.map((node) => (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: node.position.x,
              top: node.position.y,
            }}
          >
            <NodeCard
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={() => onSelectNode(node.id)}
              onDelete={() => onDeleteNode(node.id)}
              onEdit={() => {
                // Open node editor modal
              }}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {workflow.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Workflow className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No nodes yet</h3>
            <p className="text-sm text-gray-400 mb-4">Add nodes to start building your workflow</p>
            <button 
              onClick={() => onAddNode('trigger')}
              className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-all"
            >
              Add First Node
            </button>
          </div>
        </div>
      )}

      {/* Workflow Info */}
      <div className="absolute bottom-4 left-4 px-4 py-2 rounded-lg bg-kronos-glass backdrop-blur-glass border border-glass">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">Nodes: <span className="text-white font-medium">{workflow.nodes.length}</span></span>
          <span className="text-gray-400">Edges: <span className="text-white font-medium">{workflow.edges.length}</span></span>
          <span className="text-gray-400">Status: <span className={`font-medium ${
            workflow.status === 'running' ? 'text-yellow-400' :
            workflow.status === 'completed' ? 'text-green-400' :
            workflow.status === 'error' ? 'text-red-400' : 'text-gray-400'
          }`}>{workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}</span></span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: NODE PALETTE
// ============================================

function NodePalette({ onAddNode }: { onAddNode: (type: NodeType) => void }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats: Record<string, NodeType[]> = {};
    Object.entries(NODE_TEMPLATES).forEach(([type, config]) => {
      if (!cats[config.category]) cats[config.category] = [];
      cats[config.category].push(type as NodeType);
    });
    return cats;
  }, []);

  return (
    <div className="w-64 bg-kronos-glass backdrop-blur-glass border-r border-glass flex flex-col">
      <div className="p-4 border-b border-glass">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-purple-400" />
          Add Nodes
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.entries(categories).map(([category, types]) => (
          <div key={category}>
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            >
              <span className="text-sm font-medium text-gray-300">{category}</span>
              {expandedCategory === category ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {expandedCategory === category && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-2 overflow-hidden"
                >
                  {types.map((type) => {
                    const template = NODE_TEMPLATES[type];
                    const Icon = template.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => onAddNode(type)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                      >
                        <div className={`w-8 h-8 rounded-lg ${template.color} bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-white capitalize">
                            {type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {template.description}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: PROPERTIES PANEL
// ============================================

function PropertiesPanel({ 
  node, 
  onUpdateNode,
  onClose 
}: { 
  node: WorkflowNode | null;
  onUpdateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  onClose: () => void;
}) {
  if (!node) return null;

  return (
    <div className="w-80 bg-kronos-glass backdrop-blur-glass border-l border-glass flex flex-col">
      <div className="p-4 border-b border-glass flex items-center justify-between">
        <h3 className="font-semibold text-white">Properties</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
            <input
              type="text"
              value={node.name}
              onChange={(e) => onUpdateNode(node.id, { name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea
              value={node.description}
              onChange={(e) => onUpdateNode(node.id, { description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>
        </div>

        {/* Type-Specific Config */}
        {node.type === 'agent' && (
          <div className="space-y-4">
            <div className="pt-4 border-t border-white/10">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">AI Provider</label>
              <select
                value={(node.config.provider as string) || 'openai'}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, provider: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              >
                {AGENT_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-kronos-obsidian">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Model</label>
              <select
                value={(node.config.model as string) || 'gpt-4o'}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, model: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              >
                {AGENT_PROVIDERS
                  .find(p => p.id === (node.config.provider as string))?.models
                  .map((m) => (
                    <option key={m} value={m} className="bg-kronos-obsidian">
                      {m}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">System Prompt</label>
              <textarea
                value={(node.config.systemPrompt as string) || ''}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, systemPrompt: e.target.value } })}
                rows={4}
                placeholder="Define the agent's behavior..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>
          </div>
        )}

        {node.type === 'condition' && (
          <div className="space-y-4">
            <div className="pt-4 border-t border-white/10">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Condition</label>
              <input
                type="text"
                value={(node.config.condition as string) || ''}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, condition: e.target.value } })}
                placeholder="e.g., data.status === 'success'"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">True Path Label</label>
              <input
                type="text"
                value={(node.config.trueLabel as string) || 'Yes'}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, trueLabel: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">False Path Label</label>
              <input
                type="text"
                value={(node.config.falseLabel as string) || 'No'}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, falseLabel: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
        )}

        {node.type === 'api_call' && (
          <div className="space-y-4">
            <div className="pt-4 border-t border-white/10">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Endpoint URL</label>
              <input
                type="url"
                value={(node.config.url as string) || ''}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, url: e.target.value } })}
                placeholder="https://api.example.com/endpoint"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Method</label>
              <select
                value={(node.config.method as string) || 'GET'}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, method: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              >
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                  <option key={m} value={m} className="bg-kronos-obsidian">{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Headers (JSON)</label>
              <textarea
                value={(node.config.headers as string) || '{}'}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, headers: e.target.value } })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>
          </div>
        )}

        {node.type === 'human_approval' && (
          <div className="space-y-4">
            <div className="pt-4 border-t border-white/10">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Approval Type</label>
              <select
                value={(node.config.approvalType as string) || 'any'}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, approvalType: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              >
                <option value="any" className="bg-kronos-obsidian">Any Approver</option>
                <option value="specific" className="bg-kronos-obsidian">Specific User</option>
                <option value="role" className="bg-kronos-obsidian">By Role</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Timeout (seconds)</label>
              <input
                type="number"
                value={(node.config.timeout as number) || 3600}
                onChange={(e) => onUpdateNode(node.id, { config: { ...node.config, timeout: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
        )}

        {/* Output Display */}
        {node.output && (
          <div className="pt-4 border-t border-white/10">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Last Output</label>
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300 font-mono max-h-32 overflow-auto">
              {node.output}
            </div>
          </div>
        )}

        {node.error && (
          <div className="pt-4 border-t border-white/10">
            <label className="block text-xs font-medium text-red-400 mb-1.5">Error</label>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-mono max-h-32 overflow-auto">
              {node.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: EXECUTION MONITOR
// ============================================

function ExecutionMonitor({ workflow }: { workflow: Workflow }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const recentLogs = useMemo(() => 
    workflow.executionHistory.slice(-20).reverse(), 
  [workflow.executionHistory]);

  return (
    <div className="border-t border-glass">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">Execution Log</span>
          <span className="text-xs text-gray-500">({workflow.executionHistory.length} events)</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-white/5"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    log.status === 'completed' ? 'bg-green-500/20' :
                    log.status === 'error' ? 'bg-red-500/20' :
                    'bg-yellow-500/20'
                  }`}>
                    {log.status === 'completed' ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : log.status === 'error' ? (
                      <XCircle className="w-3 h-3 text-red-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                      <span className="mx-2">•</span>
                      <span className="text-gray-500">{log.duration}ms</span>
                    </div>
                    {log.output && (
                      <div className="text-xs text-gray-300 mt-1 truncate">
                        {log.output}
                      </div>
                    )}
                    {log.error && (
                      <div className="text-xs text-red-400 mt-1 truncate">
                        {log.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {recentLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No execution history yet
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT: KRON-AGENT PAGE
// ============================================

export default function KronAgentPage() {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: `wf-${Date.now()}`,
    name: 'New Workflow',
    description: 'Describe your workflow...',
    nodes: [],
    edges: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    executionHistory: [],
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const generateId = useCallback(() => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

  const handleAddNode = useCallback((type: NodeType) => {
    const template = NODE_TEMPLATES[type];
    const newNode: WorkflowNode = {
      id: generateId(),
      type,
      name: `New ${type.replace('_', ' ')}`,
      description: template.description,
      position: { x: 100, y: 100 },
      config: type === 'agent' ? { provider: 'openai', model: 'gpt-4o' } : {},
      status: 'idle',
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      updatedAt: new Date().toISOString(),
    }));
  }, [generateId]);

  const handleUpdateNode = useCallback((id: string, updates: Partial<WorkflowNode>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== id),
      edges: prev.edges.filter(e => e.source !== id && e.target !== id),
      updatedAt: new Date().toISOString(),
    }));
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [selectedNodeId]);

  const handleRunWorkflow = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    // Simulate workflow execution
    const runId = `run-${Date.now()}`;
    
    for (const node of workflow.nodes) {
      // Update node status to running
      handleUpdateNode(node.id, { status: 'running' });

      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate success/error
      const success = Math.random() > 0.1;
      handleUpdateNode(node.id, {
        status: success ? 'completed' : 'error',
        output: success ? `Node ${node.name} executed successfully` : undefined,
        error: success ? undefined : 'Execution failed: timeout',
      });

      // Add to execution history
      setWorkflow(prev => ({
        ...prev,
        executionHistory: [
          ...prev.executionHistory,
          {
            id: `${runId}-${node.id}`,
            nodeId: node.id,
            status: success ? 'completed' : 'error',
            timestamp: new Date().toISOString(),
            duration: Math.floor(1000 + Math.random() * 2000),
            output: success ? `Node ${node.name} completed` : undefined,
            error: success ? undefined : 'Execution timeout',
          },
        ],
      }));

      if (!success) break;
    }

    setIsRunning(false);
    setWorkflow(prev => ({
      ...prev,
      status: workflow.nodes.every(n => n.status === 'completed') ? 'completed' : 'error',
    }));
  }, [workflow.nodes, isRunning, handleUpdateNode]);

  const handlePauseWorkflow = useCallback(() => {
    setIsRunning(false);
    setWorkflow(prev => ({ ...prev, status: 'paused' }));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-kronos-obsidian">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-glass bg-kronos-glass backdrop-blur-glass">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
              <Network className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-semibold text-white bg-transparent border-none focus:outline-none"
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="capitalize">{workflow.status}</span>
                <span>•</span>
                <span>{workflow.nodes.length} nodes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workflow Actions */}
          <button
            onClick={() => setShowFlowchart(!showFlowchart)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Flowchart
          </button>

          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Templates
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Play/Pause */}
          {isRunning ? (
            <button
              onClick={handlePauseWorkflow}
              className="px-6 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-medium hover:bg-yellow-500/30 transition-all flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          ) : (
            <button
              onClick={handleRunWorkflow}
              disabled={workflow.nodes.length === 0}
              className="px-6 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Run Workflow
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Node Palette */}
        <NodePalette onAddNode={handleAddNode} />

        {/* Center: Workflow Canvas */}
        <WorkflowCanvas
          workflow={workflow}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onAddNode={handleAddNode}
        />

        {/* Right: Properties Panel */}
        {selectedNodeId && (
          <PropertiesPanel
            node={workflow.nodes.find(n => n.id === selectedNodeId) || null}
            onUpdateNode={handleUpdateNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Bottom: Execution Monitor */}
      <ExecutionMonitor workflow={workflow} />

      {/* Flowchart Modal */}
      <AnimatePresence>
        {showFlowchart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowFlowchart(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl max-h-[80vh] bg-kronos-glass backdrop-blur-xl rounded-2xl border border-glass overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-glass flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Workflow Architecture</h2>
                <button onClick={() => setShowFlowchart(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                  {WORKFLOW_FLOWCHART}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
