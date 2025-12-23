// frontend/src/App.tsx
import React, { useState } from 'react';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { ScreenCapturePanel } from './components/ScreenCapturePanel';
import { AutomationWorkflow, WorkflowNode, DetectedElement, Platform } from '../../shared/types/automation.types';

const App: React.FC = () => {
  const [currentWorkflow, setCurrentWorkflow] = useState<AutomationWorkflow | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [selectedElement, setSelectedElement] = useState<DetectedElement | null>(null);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleWorkflowChange = (workflow: AutomationWorkflow) => {
    setCurrentWorkflow(workflow);
  };

  const handleNodeSelect = (node: WorkflowNode | null) => {
    setSelectedNode(node);
  };

  const handleElementSelect = (element: DetectedElement) => {
    setSelectedElement(element);
  };

  const handleScreenshot = (screenshot: string) => {
    // TODO: Store screenshot for visual testing
    console.log('Screenshot captured:', screenshot.substring(0, 50) + '...');
  };

  const createNewWorkflow = () => {
    const newWorkflow: AutomationWorkflow = {
      id: `wf_${Date.now()}`,
      name: 'New Automation Workflow',
      description: 'A new visual automation workflow',
      nodes: [
        {
          id: 'start_1',
          type: 'start',
          position: { x: 100, y: 100 },
          config: {},
          platform,
        },
      ],
      connections: [],
      metadata: {
        author: 'User',
        version: '1.0.0',
        tags: [],
        platforms: [platform],
        estimatedDuration: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentWorkflow(newWorkflow);
  };

  const executeWorkflow = async () => {
    if (!currentWorkflow) return;

    setIsExecuting(true);
    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.id}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Workflow execution failed');
      }

      const result = await response.json();
      console.log('Workflow executed:', result);
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const generateWorkflowFromText = async (description: string) => {
    try {
      const response = await fetch('/api/llm/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, platform }),
      });

      const result = await response.json();
      if (result.workflow) {
        setCurrentWorkflow(result.workflow);
      }
    } catch (error) {
      console.error('LLM workflow generation failed:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">
              Unified Visual Automation
            </h1>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="desktop">Desktop</option>
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={createNewWorkflow}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Workflow
            </button>
            <button
              onClick={executeWorkflow}
              disabled={!currentWorkflow || isExecuting}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isExecuting ? 'Executing...' : 'Execute'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Screen Capture */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <ScreenCapturePanel
            platform={platform}
            onScreenshot={handleScreenshot}
            onElementSelect={handleElementSelect}
            selectedElement={selectedElement}
          />

          {/* LLM Workflow Generation */}
          <div className="mt-6">
            <h3 className="font-medium mb-2">Generate Workflow from Text</h3>
            <textarea
              placeholder="Describe what you want to automate..."
              className="w-full p-2 border border-gray-300 rounded resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  const description = (e.target as HTMLTextAreaElement).value;
                  if (description.trim()) {
                    generateWorkflowFromText(description);
                    (e.target as HTMLTextAreaElement).value = '';
                  }
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Ctrl+Enter to generate workflow
            </p>
          </div>
        </div>

        {/* Center - Workflow Canvas */}
        <div className="flex-1">
          <WorkflowCanvas
            workflow={currentWorkflow}
            onWorkflowChange={handleWorkflowChange}
            onNodeSelect={handleNodeSelect}
          />
        </div>

        {/* Right Sidebar - Node Properties */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          {selectedNode ? (
            <div>
              <h3 className="font-medium mb-4">Node Properties</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <span className="text-sm text-gray-500 capitalize">
                    {selectedNode.type}
                  </span>
                </div>

                {selectedNode.config.actionId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <span className="text-sm text-gray-500">
                      {selectedNode.config.actionId}
                    </span>
                  </div>
                )}

                {selectedElement && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <h4 className="font-medium text-blue-900 mb-2">Selected Element</h4>
                    <div className="text-sm text-blue-800">
                      <div>Type: {selectedElement.type}</div>
                      <div>Confidence: {Math.round(selectedElement.confidence * 100)}%</div>
                      {selectedElement.properties.text && (
                        <div>Text: {selectedElement.properties.text}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              Select a node to view properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;