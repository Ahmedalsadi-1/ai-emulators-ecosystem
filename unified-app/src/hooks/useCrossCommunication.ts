import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type MessageType =
  | 'workflow:execute'
  | 'workflow:status'
  | 'state:share'
  | 'state:request'
  | 'action:execute'
  | 'action:result'
  | 'screenshot:capture'
  | 'screenshot:share'
  | 'element:detect'
  | 'element:highlight'
  | 'log:add'
  | 'error:report';

export interface AutomationMessage {
  id: string;
  type: MessageType;
  from: 'turix' | 'openinterface' | 'factif' | 'orchestrator';
  to?: 'turix' | 'openinterface' | 'factif' | 'orchestrator' | 'all';
  timestamp: Date;
  payload: Record<string, any>;
  correlationId?: string; // For request-response patterns
}

export interface PendingRequest {
  id: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export interface CrossCommunicationState {
  messages: AutomationMessage[];
  pendingRequests: Record<string, PendingRequest>;
  connectedTools: Set<'turix' | 'openinterface' | 'factif'>;
  messageHandlers: Record<string, (message: AutomationMessage) => void>;

  // Actions
  sendMessage: (message: Omit<AutomationMessage, 'id' | 'timestamp'>) => void;
  broadcastMessage: (type: MessageType, payload: Record<string, any>, from: 'turix' | 'openinterface' | 'factif' | 'orchestrator') => void;
  requestResponse: <T = any>(
    type: MessageType,
    payload: Record<string, any>,
    to: 'turix' | 'openinterface' | 'factif',
    timeout?: number
  ) => Promise<T>;
  addMessageHandler: (type: string, handler: (message: AutomationMessage) => void) => void;
  removeMessageHandler: (type: string) => void;

  // Tool connection management
  connectTool: (tool: 'turix' | 'openinterface' | 'factif') => void;
  disconnectTool: (tool: 'turix' | 'openinterface' | 'factif') => void;
  isToolConnected: (tool: 'turix' | 'openinterface' | 'factif') => boolean;

  // State sharing utilities
  shareState: (key: string, value: any, from: 'turix' | 'openinterface' | 'factif' | 'orchestrator') => void;
  requestState: (key: string, from: 'turix' | 'openinterface' | 'factif' | 'orchestrator') => Promise<any>;
  getSharedState: (key: string) => any;

  // Workflow coordination
  executeWorkflowStep: (stepId: string, tool: 'turix' | 'openinterface' | 'factif', parameters: Record<string, any>) => Promise<any>;
  reportWorkflowStatus: (workflowId: string, status: string, from: 'turix' | 'openinterface' | 'factif' | 'orchestrator') => void;

  // Element and screenshot coordination
  requestScreenshot: (from: 'turix' | 'openinterface' | 'factif' | 'orchestrator') => Promise<string>;
  shareScreenshot: (screenshotData: string, from: 'turix' | 'openinterface' | 'factif') => void;
  detectElements: (screenshotData: string, from: 'turix' | 'openinterface' | 'factif' | 'orchestrator') => Promise<any[]>;
  highlightElement: (elementId: string, from: 'turix' | 'openinterface' | 'factif') => void;

  // iframe communication bridge
  setupIframeBridge: (iframe: HTMLIFrameElement, tool: 'turix' | 'openinterface' | 'factif') => void;
  handleIframeMessage: (event: MessageEvent) => void;

  // Internal helper methods
  routeMessage: (message: AutomationMessage) => void;
  cleanupPendingRequest: (correlationId: string) => void;
}

export const useCrossCommunicationStore = create<CrossCommunicationState>()(
  devtools(
    (set, get) => ({
      messages: [],
      pendingRequests: {},
      connectedTools: new Set(),
      messageHandlers: {},

      sendMessage: (messageData) => {
        const message: AutomationMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          timestamp: new Date(),
          ...messageData,
        };

        set((state) => ({
          messages: [...state.messages.slice(-100), message], // Keep last 100 messages
        }));

        // Handle message based on type and routing
        get().routeMessage(message);

        // Trigger registered handlers
        const handler = get().messageHandlers[message.type];
        if (handler) {
          handler(message);
        }
      },

      broadcastMessage: (type, payload, from) => {
        get().sendMessage({
          type,
          from,
          to: 'all',
          payload,
        });
      },

      requestResponse: async <T = any>(
        type: MessageType,
        payload: Record<string, any>,
        to: 'turix' | 'openinterface' | 'factif',
        timeout = 5000
      ): Promise<T> => {
        const correlationId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Request timeout: ${type}`));
            get().cleanupPendingRequest(correlationId);
          }, timeout);

          const pendingRequest: PendingRequest = {
            id: correlationId,
            resolve,
            reject,
            timeout: timeoutId,
          };

          set((state) => ({
            pendingRequests: {
              ...state.pendingRequests,
              [correlationId]: pendingRequest,
            },
          }));

          get().sendMessage({
            type,
            from: 'orchestrator',
            to,
            payload,
            correlationId,
          });
        });
      },

      addMessageHandler: (type, handler) => {
        set((state) => ({
          messageHandlers: {
            ...state.messageHandlers,
            [type]: handler,
          },
        }));
      },

      removeMessageHandler: (type) => {
        set((state) => {
          const newHandlers = { ...state.messageHandlers };
          delete newHandlers[type];
          return { messageHandlers: newHandlers };
        });
      },

      connectTool: (tool) => {
        set((state) => ({
          connectedTools: new Set([...state.connectedTools, tool]),
        }));

        get().broadcastMessage('log:add', {
          level: 'info',
          message: `Tool connected: ${tool}`,
        }, 'orchestrator');
      },

      disconnectTool: (tool) => {
        set((state) => {
          const newConnected = new Set(state.connectedTools);
          newConnected.delete(tool);
          return { connectedTools: newConnected };
        });

        get().broadcastMessage('log:add', {
          level: 'info',
          message: `Tool disconnected: ${tool}`,
        }, 'orchestrator');
      },

      isToolConnected: (tool) => {
        return get().connectedTools.has(tool);
      },

      shareState: (key, value, from) => {
        get().broadcastMessage('state:share', { key, value }, from);
      },

      requestState: async (key, from) => {
        return get().requestResponse('state:request', { key }, from === 'orchestrator' ? 'turix' : from);
      },

      getSharedState: (key) => {
        // This would typically be stored in a separate state store
        // For now, return from messages
        const stateMessages = get().messages
          .filter(msg => msg.type === 'state:share' && msg.payload.key === key)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return stateMessages[0]?.payload.value;
      },

      executeWorkflowStep: async (stepId, tool, parameters) => {
        return get().requestResponse('workflow:execute', {
          stepId,
          parameters,
        }, tool);
      },

      reportWorkflowStatus: (workflowId, status, from) => {
        get().broadcastMessage('workflow:status', {
          workflowId,
          status,
        }, from);
      },

      requestScreenshot: async (from) => {
        return get().requestResponse<string>('screenshot:capture', {}, from === 'orchestrator' ? 'openinterface' : from);
      },

      shareScreenshot: (screenshotData, from) => {
        get().broadcastMessage('screenshot:share', {
          screenshotData,
        }, from);
      },

      detectElements: async (screenshotData, from) => {
        return get().requestResponse<any[]>('element:detect', {
          screenshotData,
        }, from === 'orchestrator' ? 'factif' : from);
      },

      highlightElement: (elementId, from) => {
        get().broadcastMessage('element:highlight', {
          elementId,
        }, from);
      },

      setupIframeBridge: (iframe, tool) => {
        // Listen for messages from iframe
        const messageHandler = (event: MessageEvent) => {
          if (event.source === iframe.contentWindow) {
            get().handleIframeMessage(event);
          }
        };

        window.addEventListener('message', messageHandler);

        // Send initial connection message
        iframe.contentWindow?.postMessage({
          type: 'connection:established',
          from: 'orchestrator',
          tool,
        }, '*');

        // Store cleanup function (would need to be called on unmount)
        // iframe._messageHandler = messageHandler;
      },

      handleIframeMessage: (event: MessageEvent) => {
        const message = event.data;
        if (!message || !message.type) return;

        // Convert iframe message to internal format
        const automationMessage: AutomationMessage = {
          id: message.id || `iframe-${Date.now()}`,
          type: message.type,
          from: message.from,
          to: message.to || 'orchestrator',
          timestamp: new Date(),
          payload: message.payload || {},
          correlationId: message.correlationId,
        };

        // Handle response to pending requests
        if (message.correlationId && get().pendingRequests[message.correlationId]) {
          const pendingRequest = get().pendingRequests[message.correlationId];
          if (message.type.includes('error')) {
            pendingRequest.reject(new Error(message.payload?.error || 'Unknown error'));
          } else {
            pendingRequest.resolve(message.payload);
          }
          get().cleanupPendingRequest(message.correlationId);
          return;
        }

        // Process message normally
        get().sendMessage(automationMessage);
      },

      // Helper methods
      routeMessage: (message) => {
        // Route message to appropriate iframe
        if (message.to && message.to !== 'all' && message.to !== 'orchestrator') {
          // Find iframe for target tool and post message
          const iframes = document.querySelectorAll(`iframe[data-tool="${message.to}"]`);
          iframes.forEach(iframe => {
            (iframe as HTMLIFrameElement).contentWindow?.postMessage(message, '*');
          });
        }
      },

      cleanupPendingRequest: (correlationId: string) => {
        set((state) => {
          const newPending = { ...state.pendingRequests };
          if (newPending[correlationId]) {
            clearTimeout(newPending[correlationId].timeout);
            delete newPending[correlationId];
          }
          return { pendingRequests: newPending };
        });
      },
    }),
    {
      name: 'cross-communication-store',
    }
  )
);

// Helper hook for components to use cross-communication
export const useCrossCommunication = () => {
  const store = useCrossCommunicationStore();

  return {
    // Direct access to store methods
    ...store,

    // Convenient helper functions
    executeTurixAction: (action: string, parameters: Record<string, any>) =>
      store.executeWorkflowStep(`turix-${action}`, 'turix', parameters),

    executeOpenInterfaceAction: (action: string, parameters: Record<string, any>) =>
      store.executeWorkflowStep(`oi-${action}`, 'openinterface', parameters),

    executeFactifAction: (action: string, parameters: Record<string, any>) =>
      store.executeWorkflowStep(`factif-${action}`, 'factif', parameters),

    // State sharing helpers
    shareWorkflowResult: (workflowId: string, result: any) =>
      store.shareState(`workflow.${workflowId}.result`, result, 'orchestrator'),

    getWorkflowResult: (workflowId: string) =>
      store.getSharedState(`workflow.${workflowId}.result`),
  };
};