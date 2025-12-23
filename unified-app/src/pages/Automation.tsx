import { useEffect, useRef } from 'react';
import { VerticalSplitView } from '@/components/VerticalSplitView';
import { WorkflowMonitor } from '@/components/WorkflowMonitor';
import { useCrossCommunication } from '@/hooks/useCrossCommunication';
import { useWorkflowChaining } from '@/hooks/useWorkflowChaining';

export function AutomationPage() {
  const { setupIframeBridge, connectTool, disconnectTool } = useCrossCommunication();
  const { getWorkflowTemplates, createWorkflowFromTemplate, executeChainedWorkflow } = useWorkflowChaining();

  const turixIframeRef = useRef<HTMLIFrameElement>(null);
  const openInterfaceIframeRef = useRef<HTMLIFrameElement>(null);
  const factifIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Setup iframe bridges when iframes load
    const setupBridges = () => {
      if (turixIframeRef.current) {
        setupIframeBridge(turixIframeRef.current, 'turix');
        connectTool('turix');
      }
      if (openInterfaceIframeRef.current) {
        setupIframeBridge(openInterfaceIframeRef.current, 'openinterface');
        connectTool('openinterface');
      }
      if (factifIframeRef.current) {
        setupIframeBridge(factifIframeRef.current, 'factif');
        connectTool('factif');
      }
    };

    // Small delay to ensure iframes are mounted
    const timer = setTimeout(setupBridges, 1000);

    return () => {
      clearTimeout(timer);
      // Disconnect tools on unmount
      disconnectTool('turix');
      disconnectTool('openinterface');
      disconnectTool('factif');
    };
  }, [setupIframeBridge, connectTool, disconnectTool]);

  // Create a sample workflow for demonstration
  const createSampleWorkflow = () => {
    const workflowId = createWorkflowFromTemplate('turix-openinterface-factif-chain');
    executeChainedWorkflow(workflowId);
    return workflowId;
  };

  const runTemplateWorkflow = (templateId: string) => {
    const workflowId = createWorkflowFromTemplate(templateId);
    executeChainedWorkflow(workflowId);
  };

  const templates = getWorkflowTemplates();

  const panels = [
    {
      id: 'turix-panel',
      title: 'Turix Automation Cards',
      content: (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Turix Automation Services</h3>
            <p className="text-sm text-text-secondary">
              Modular automation cards for various platforms and services
            </p>
            <button
              onClick={createSampleWorkflow}
              className="mt-3 px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-secondary transition-colors"
            >
              Start Sample Workflow
            </button>
          </div>
          <div className="flex-1">
            <iframe
              ref={turixIframeRef}
              src="http://localhost:4000" // Turix service URL
              className="w-full h-full border-0"
              title="Turix Automation Cards"
              data-tool="turix"
            />
          </div>
        </div>
      ),
      defaultHeight: 300,
      minHeight: 200,
    },
    {
      id: 'openinterface-panel',
      title: 'OpenInterface Computer Control',
      content: (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-2">OpenInterface Control</h3>
            <p className="text-sm text-text-secondary">
              LLM-driven computer control with natural language instructions
            </p>
          </div>
          <div className="flex-1">
            <iframe
              ref={openInterfaceIframeRef}
              src="http://localhost:8000" // OpenInterface service URL
              className="w-full h-full border-0"
              title="OpenInterface Computer Control"
              data-tool="openinterface"
            />
          </div>
        </div>
      ),
      defaultHeight: 400,
      minHeight: 250,
    },
    {
      id: 'factif-panel',
      title: 'Factif Visual Testing',
      content: (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Factif AI Testing</h3>
            <p className="text-sm text-text-secondary">
              Advanced browser automation with visual testing capabilities
            </p>
          </div>
          <div className="flex-1">
            <iframe
              ref={factifIframeRef}
              src="http://localhost:3001" // Factif service URL
              className="w-full h-full border-0"
              title="Factif Visual Testing"
              data-tool="factif"
            />
          </div>
        </div>
      ),
      defaultHeight: 350,
      minHeight: 200,
    },
  ];

  const handlePanelResize = (panelId: string, newHeight: number) => {
    console.log(`Panel ${panelId} resized to ${newHeight}px`);
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-bg-secondary">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Unified Automation Platform</h1>
            <p className="text-text-secondary mt-1">
              Chain operations across Turix automation cards, OpenInterface computer control, and Factif visual testing
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-status-success" />
              <span className="text-sm text-text-muted">All Tools Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Panels */}
      <div className="flex-1 overflow-hidden">
        <VerticalSplitView
          panels={panels}
          onPanelResize={handlePanelResize}
          className="h-full"
        />
      </div>

      {/* Workflow Monitor */}
      <div className="p-4 border-t border-border">
        <WorkflowMonitor className="mb-4" />
      </div>

      {/* Workflow Templates Section */}
      <div className="p-4 border-t border-border bg-bg-secondary">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Workflow Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="p-3 border border-border rounded-md bg-bg-primary hover:bg-bg-tertiary transition-colors">
                <h4 className="font-medium text-text-primary mb-1">{template.name}</h4>
                <p className="text-sm text-text-secondary mb-2">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{template.estimatedDuration}s</span>
                  <button
                    onClick={() => runTemplateWorkflow(template.id)}
                    className="px-3 py-1 bg-accent-primary text-white text-xs rounded hover:bg-accent-secondary transition-colors"
                  >
                    Run
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-secondary transition-colors">
              Create Custom Workflow
            </button>
            <button className="px-4 py-2 border border-border text-text-primary rounded-md hover:bg-bg-tertiary transition-colors">
              View Workflow History
            </button>
          </div>
          <div className="text-sm text-text-muted">
            Cross-tool communication active • Shared state synchronized • Workflow chaining enabled
          </div>
        </div>
      </div>
    </div>
  );
}