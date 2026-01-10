/**
 * KRONOS-OS Background Service Worker
 * 
 * Purpose: 
 * - Task routing and orchestration
 * - Tab lifecycle management for parallel agents
 * - WebSocket connection management
 * - API request/response handling
 * - Message passing between extension components
 */

// ===== CONFIGURATION =====
const CONFIG = {
    API_BASE_URL: 'http://localhost:9991',
    WS_URL: 'ws://localhost:9991/tasks',
    TAB_MANAGEMENT_API: `${CONFIG.API_BASE_URL}/extensions/agent`,
    WORKFLOW_API: `${CONFIG.API_BASE_URL}/extensions/workflow`,
    SKILLS_API: `${CONFIG.API_BASE_URL}/extensions/skills`,
    EXTENSION_URL: 'http://localhost:9992',
    TAB_STATUS: {
        OPEN: 'open',
        CLOSED: 'closed',
        LOADING: 'loading'
    }
};

// ===== STATE MANAGEMENT =====
const state = {
    tabs: new Map(), // Map<tabId, tabData>
    agents: new Map(), // Map<agentId, agentData>
    connectionStatus: CONFIG.TAB_STATUS.LOADING,
    currentWorkspace: null,
    socket: null,
    apiQueue: [],
    isProcessing: false
};

// ===== WORKER EVENT LISTENERS =====
chrome.runtime.onInstalled.addListener(() => {
    console.log('[KRONOS-OS Extension] Installed');
    initializeConnection();
    setupContextMenus();
    initializeTabs();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('[KRONOS-OS Extension] Service Worker Started');
    restoreTabsFromStorage();
});

chrome.action.onClicked.addListener((request, sender, sendResponse) => {
    console.log('[Action Clicked]', request);
    handleAction(request, sender, sendResponse);
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    console.log('[Navigation]', details.url);
    // Track navigation for context
    const tabId = details.tabId;
    if (state.tabs.has(tabId)) {
        const tabData = state.tabs.get(tabId);
        state.tabs.set(tabId, { ...tabData, url: details.url });
    }
});

// ===== CONTEXT MENUS =====
function setupContextMenus() {
    chrome.runtime.onInstalled.addListener(() => {
        chrome.contextMenus.removeAll(() => {
            // AI Agent Actions
            chrome.contextMenus.create({
                id: 'agent-run',
                title: 'Run AI Agent Here',
                contexts: ['selection', 'link', 'image', 'page'],
                documentUrlPatterns: chrome.runtime.getManifest().content_scripts.map(s => s.matches),
                icons: {
                    '16': 'icons/icon16.png'
                }
            });

            chrome.contextMenus.create({
                id: 'workflow-execute',
                title: 'Execute Workflow',
                contexts: ['selection', 'page'],
                documentUrlPatterns: chrome.runtime.getManifest().content_scripts.map(s => s.matches),
                icons: {
                    '16': 'icons/icon16.png'
                }
            });

            // Workspace Actions
            chrome.contextMenus.create({
                id: 'workspace-kron1',
                title: 'Open KRON-1 Desktop',
                contexts: ['page', 'link'],
                documentUrlPatterns: chrome.runtime.getManifest().content_scripts.map(s => s.matches),
                icons: {
                    '16': 'icons/icon16.png'
                }
            });

            chrome.contextMenus.create({
                id: 'workspace-kron2',
                title: 'Open KRON-2 Desktop',
                contexts: ['page', 'link'],
                documentUrlPatterns: chrome.runtime.getManifest().content_scripts.map(s => s.matches),
                icons: {
                    '16': 'icons/icon16.png'
                }
            });

            chrome.contextMenus.create({
                id: 'workspace-kron3',
                title: 'Open KRON-3 Desktop',
                contexts: ['page', 'link'],
                documentUrlPatterns: chrome.runtime.getManifest().content_scripts.map(s => s.matches),
                icons: {
                    '16': 'icons/icon16.png'
                }
            });

            chrome.contextMenus.create({
                id: 'workspace-android',
                title: 'Open Android Workspace',
                contexts: ['page', 'link'],
                documentUrlPatterns: chrome.runtime.getManifest().content_scripts.map(s => s.matches),
                icons: {
                    '16': 'icons/icon16.png'
                }
            });

            chrome.contextMenus.create({
                id: 'workspace-ui-tars',
                title: 'Open UI-TARS Browser',
                contexts: ['page', 'link'],
                documentUrlPatterns: chrome.runtime.getManifest().content_scripts.map(s => s.matches),
                icons: {
                    '16': 'icons/icon16.png'
                }
            });

            chrome.contextMenus.create({
                id: 'skills-search',
                title: 'Smart Search',
                contexts: ['selection'],
                documentUrlPatterns: chrome.runtime.getManifest().content_scripts.map(s => s.matches),
                icons: {
                    '16': 'icons/icon16.png'
                }
            });
        });
    });
}

// ===== CONNECTION MANAGEMENT =====
function initializeConnection() {
    state.connectionStatus = CONFIG.TAB_STATUS.LOADING;
    broadcastConnectionStatus();
    connectWebSocket();
}

function connectWebSocket() {
    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        return;
    }

    const ws = new WebSocket(CONFIG.WS_URL);

    ws.onopen = () => {
        console.log('[KRONOS-OS Extension] WebSocket Connected');
        state.connectionStatus = CONFIG.TAB_STATUS.OPEN;
        state.socket = ws;
        broadcastConnectionStatus();
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket Message]', data);
            handleWebSocketMessage(data);
        } catch (error) {
            console.error('[WebSocket Parse Error]', error);
        }
    };

    ws.onerror = (error) => {
        console.error('[WebSocket Error]', error);
        state.connectionStatus = CONFIG.TAB_STATUS.LOADING;
        broadcastConnectionStatus();
    };

    ws.onclose = () => {
        console.log('[WebSocket Disconnected]');
        state.connectionStatus = CONFIG.TAB_STATUS.LOADING;
        state.socket = null;
        state.connectionStatus = CONFIG.TAB_STATUS.CLOSED;
        broadcastConnectionStatus();
        
        // Attempt reconnection after 3 seconds
        setTimeout(() => {
            if (state.connectionStatus === CONFIG.TAB_STATUS.CLOSED) {
                connectWebSocket();
            }
        }, 3000);
    };
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'task:progress':
            broadcastToAllTabs('task:progress', data.payload);
            break;
        case 'task:complete':
            broadcastToAllTabs('task:complete', data.payload);
            break;
        case 'task:error':
            broadcastToAllTabs('task:error', data.payload);
            break;
        case 'agent:state':
            updateAgentState(data.payload);
            break;
        case 'workspace:state':
            updateWorkspaceState(data.payload);
            break;
        case 'connection:status':
            state.connectionStatus = data.payload.status;
            broadcastConnectionStatus();
            break;
        case 'notification':
            showNotification(data.payload);
            break;
        default:
            console.log('[Unknown Message Type]', data.type);
    }
}

function broadcastConnectionStatus() {
    broadcastToAllTabs('connection:status', { status: state.connectionStatus });
}

function broadcastToAllTabs(type, payload) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.url && tab.url.startsWith('http')) {
                chrome.tabs.sendMessage(tab.id, { type, payload });
            }
        });
    });
}

function updateAgentState(payload) {
    state.agents.set(payload.agentId, payload);
    // Save to storage for persistence
    chrome.storage.local.set({ 
        ['agent_' + payload.agentId]: payload 
    });
}

function updateWorkspaceState(payload) {
    state.currentWorkspace = payload;
    chrome.storage.local.set({ 
        currentWorkspace: payload 
    });
}

function showNotification(payload) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: payload.title || 'KRONOS-OS',
        message: payload.message,
        priority: 2
    });
}

// ===== TAB MANAGEMENT =====
function initializeTabs() {
    chrome.tabs.onActivated.addListener((activeInfo) => {
        console.log('[Tab Activated]', activeInfo.tabId);
        updateActiveTab(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.status === 'complete') {
            console.log('[Tab Updated]', tabId, changeInfo.url);
            updateTab(tabId);
        }
    });

    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
        console.log('[Tab Removed]', tabId);
        state.tabs.delete(tabId);
        saveTabsToStorage();
    });
}

function updateActiveTab(tabId) {
    state.tabs.set(tabId, {
        id: tabId,
        url: '',
        title: '',
        active: true
    });
    saveTabsToStorage();
}

function updateTab(tabId) {
    const tab = state.tabs.get(tabId);
    if (tab && changeInfo.url) {
        state.tabs.set(tabId, { ...tab, url: changeInfo.url });
        saveTabsToStorage();
    }
}

function saveTabsToStorage() {
    const tabsData = {};
    state.tabs.forEach((value, key) => {
        tabsData[key] = value;
    });
    chrome.storage.local.set({ tabs: tabsData });
}

function restoreTabsFromStorage() {
    chrome.storage.local.get(['tabs'], (result) => {
        if (result.tabs) {
            const tabs = new Map(Object.entries(result.tabs));
            state.tabs = tabs;
        }
    });
}

// ===== API COMMUNICATION =====
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
            method: options.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
            ...options.headers
            },
            body: JSON.stringify(options.body)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[API Request Error]', endpoint, error);
        throw error;
    }
}

// ===== ACTION HANDLERS =====
async function handleAction(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'createTask':
                const result = await apiRequest('/tasks', {
                    method: 'POST',
                    body: request.payload
                });
                sendResponse({ success: true, data: result });
                break;

            case 'runAgent':
                broadcastToAllTabs('agent:run', {
                    agentId: request.payload.agentId,
                    url: request.payload.url
                });
                sendResponse({ success: true });
                break;

            case 'closeAgent':
                broadcastToAllTabs('agent:close', {
                    agentId: request.payload.agentId
                });
                sendResponse({ success: true });
                break;

            case 'executeWorkflow':
                broadcastToAllTabs('workflow:execute', {
                    workflowId: request.payload.workflowId
                });
                sendResponse({ success: true });
                break;

            case 'switchWorkspace':
                updateWorkspaceState({
                    currentWorkspace: request.payload.workspace
                });
                broadcastToAllTabs('workspace:state', state.currentWorkspace);
                sendResponse({ success: true });
                break;

            case 'getConnectionStatus':
                sendResponse({ success: true, status: state.connectionStatus, currentWorkspace: state.currentWorkspace });
                break;

            case 'executeSkill':
                broadcastToAllTabs('skills:execute', {
                    skill: request.payload.skill,
                    params: request.payload.params,
                    tabId: request.payload.tabId
                });
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('[Action Handler Error]', request.action, error);
        sendResponse({ success: false, error: error.message });
    }
}

// ===== INITIALIZE =====
console.log('[KRONOS-OS Service Worker] Initializing...');
