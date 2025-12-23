// frontend/src/components/WorkflowCanvas.tsx
import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  EdgeChange,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { AutomationWorkflow, WorkflowNode, WorkflowConnection } from '../../shared/types/automation.types';
import { ActionNode } from './nodes/ActionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ScreenshotNode } from './nodes/ScreenshotNode';

const nodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
  screenshot: ScreenshotNode,
};

interface WorkflowCanvasProps {
  workflow: AutomationWorkflow | null;
  onWorkflowChange: (workflow: AutomationWorkflow) => void;
  onNodeSelect: (node: WorkflowNode | null) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onWorkflowChange,
  onNodeSelect,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Convert workflow to React Flow format
  React.useEffect(() => {
    if (!workflow) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const flowNodes: Node[] = workflow.nodes.map(node => ({
      id: node.id,
      type: node.type === 'start' || node.type === 'end' ? 'default' : node.type,
      position: node.position,
      data: {
        ...node,
        onUpdate: (updatedNode: Partial<WorkflowNode>) => {
          handleNodeUpdate(node.id, updatedNode);
        },
      },
      style: getNodeStyle(node),
    }));

    const flowEdges: Edge[] = workflow.connections.map(conn => ({
      id: conn.id,
      source: conn.sourceNodeId,
      target: conn.targetNodeId,
      type: 'smoothstep',
      animated: conn.type === 'flow',
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [workflow]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    if (!workflow) return;

    const updatedNodes = workflow.nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    );

    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes,
      updatedAt: new Date(),
    };

    onWorkflowChange(updatedWorkflow);
  }, [workflow, onWorkflowChange]);

  const onConnect = useCallback((params: Connection) => {
    if (!workflow) return;

    const newConnection: WorkflowConnection = {
      id: `conn_${Date.now()}`,
      sourceNodeId: params.source!,
      targetNodeId: params.target!,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: 'flow',
    };

    const updatedWorkflow = {
      ...workflow,
      connections: [...workflow.connections, newConnection],
      updatedAt: new Date(),
    };

    onWorkflowChange(updatedWorkflow);
    setEdges((eds) => addEdge(params, eds));
  }, [workflow, onWorkflowChange, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    const workflowNode = workflow?.nodes.find(n => n.id === node.id);
    onNodeSelect(workflowNode || null);
  }, [workflow, onNodeSelect]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    onNodeSelect(null);
  }, [onNodeSelect]);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    if (!workflow) return;

    const newNode: WorkflowNode = {
      id: `${type}_${Date.now()}`,
      type: type as any,
      position,
      config: {},
      platform: workflow.metadata.platforms[0] || 'desktop',
    };

    const updatedWorkflow = {
      ...workflow,
      nodes: [...workflow.nodes, newNode],
      updatedAt: new Date(),
    };

    onWorkflowChange(updatedWorkflow);
  }, [workflow, onWorkflowChange]);

  const deleteNode = useCallback((nodeId: string) => {
    if (!workflow) return;

    const updatedNodes = workflow.nodes.filter(node => node.id !== nodeId);
    const updatedConnections = workflow.connections.filter(
      conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    );

    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes,
      connections: updatedConnections,
      updatedAt: new Date(),
    };

    onWorkflowChange(updatedWorkflow);
  }, [workflow, onWorkflowChange]);

  const getNodeStyle = (node: WorkflowNode) => {
    const baseStyle = {
      border: '2px solid',
      borderRadius: '8px',
      padding: '10px',
    };

    switch (node.status) {
      case 'running':
        return { ...baseStyle, borderColor: '#3b82f6', background: '#eff6ff' };
      case 'completed':
        return { ...baseStyle, borderColor: '#10b981', background: '#f0fdf4' };
      case 'failed':
        return { ...baseStyle, borderColor: '#ef4444', background: '#fef2f2' };
      default:
        return { ...baseStyle, borderColor: '#e5e7eb', background: '#ffffff' };
    }
  };

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'action': return '#3b82f6';
              case 'condition': return '#f59e0b';
              case 'screenshot': return '#10b981';
              default: return '#6b7280';
            }
          }}
        />
        <Background variant="dots" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
};