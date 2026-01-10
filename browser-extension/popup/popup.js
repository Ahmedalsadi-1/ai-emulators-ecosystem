// KRONOS-OS Browser Extension Popup Script
// Handles UI interactions and communication with background service worker

class KronosPopup {
    constructor() {
        this.connectionStatus = 'disconnected';
        this.currentWorkspace = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkConnection();
        this.setupWorkspaceButtons();
        this.setupQuickActions();
    }

    setupEventListeners() {
        // Workspace buttons
        document.querySelectorAll('.workspace-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workspace = e.currentTarget.dataset.workspace;
                this.switchWorkspace(workspace);
            });
        });

        // Quick action buttons
        document.getElementById('newTaskBtn').addEventListener('click', () => {
            this.createNewTask();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSidePanel();
        });

        // Footer buttons
        document.getElementById('openSidePanel').addEventListener('click', () => {
            this.openSidePanel();
        });

        document.getElementById('openAgents').addEventListener('click', () => {
            this.openAgentsPanel();
        });
    }

    setupWorkspaceButtons() {
        // Update active workspace indicator
        if (this.currentWorkspace) {
            const activeBtn = document.querySelector(`[data-workspace="${this.currentWorkspace}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
    }

    setupQuickActions() {
        // Initialize quick action buttons
        console.log('[KRONOS-Popup] Quick actions initialized');
    }

    async checkConnection() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getConnectionStatus'
            });

            this.updateConnectionStatus(response.status, response.currentWorkspace);
        } catch (error) {
            console.error('[KRONOS-Popup] Connection check failed:', error);
            this.updateConnectionStatus('error');
        }
    }

    updateConnectionStatus(status, workspace = null) {
        this.connectionStatus = status;
        this.currentWorkspace = workspace;

        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        if (statusDot && statusText) {
            statusDot.className = 'status-dot';
            statusText.textContent = this.getStatusText(status);

            switch (status) {
                case 'connected':
                    statusDot.classList.add('connected');
                    break;
                case 'connecting':
                    statusDot.classList.add('loading');
                    break;
                case 'disconnected':
                    statusDot.classList.add('disconnected');
                    break;
                case 'error':
                    statusDot.classList.add('error');
                    break;
            }
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'connected':
                return 'Connected to KRONOS-OS';
            case 'connecting':
                return 'Connecting...';
            case 'disconnected':
                return 'Disconnected';
            case 'error':
                return 'Connection Error';
            default:
                return 'Unknown Status';
        }
    }

    async switchWorkspace(workspaceId) {
        try {
            // Remove active class from all buttons
            document.querySelectorAll('.workspace-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to selected button
            const selectedBtn = document.querySelector(`[data-workspace="${workspaceId}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('active');
            }

            // Send switch workspace command
            const response = await chrome.runtime.sendMessage({
                action: 'switchWorkspace',
                payload: { workspace: workspaceId }
            });

            if (response.success) {
                console.log(`[KRONOS-Popup] Switched to workspace: ${workspaceId}`);
                this.showNotification(`Switched to ${workspaceId.toUpperCase()} workspace`);
            } else {
                console.error('[KRONOS-Popup] Failed to switch workspace:', response.error);
                this.showNotification('Failed to switch workspace', 'error');
            }
        } catch (error) {
            console.error('[KRONOS-Popup] Workspace switch failed:', error);
            this.showNotification('Failed to switch workspace', 'error');
        }
    }

    async createNewTask() {
        try {
            const taskDescription = prompt('Enter task description:');
            if (!taskDescription) return;

            const response = await chrome.runtime.sendMessage({
                action: 'createTask',
                payload: {
                    description: taskDescription,
                    workspace: this.currentWorkspace
                }
            });

            if (response.success) {
                console.log('[KRONOS-Popup] Task created:', response.data);
                this.showNotification('Task created successfully');
            } else {
                console.error('[KRONOS-Popup] Task creation failed:', response.error);
                this.showNotification('Failed to create task', 'error');
            }
        } catch (error) {
            console.error('[KRONOS-Popup] Task creation failed:', error);
            this.showNotification('Failed to create task', 'error');
        }
    }

    async openSidePanel() {
        try {
            await chrome.sidePanel.open();
            console.log('[KRONOS-Popup] Side panel opened');
        } catch (error) {
            console.error('[KRONOS-Popup] Failed to open side panel:', error);
            this.showNotification('Failed to open settings', 'error');
        }
    }

    async openAgentsPanel() {
        // Open agents management (could be a new tab or panel)
        console.log('[KRONOS-Popup] Opening agents panel');
        this.showNotification('Agents panel not yet implemented');
    }

    showNotification(message, type = 'success') {
        // Simple notification using Chrome notifications API
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'KRONOS-OS',
            message: message,
            priority: type === 'error' ? 2 : 1
        });
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[KRONOS-Popup] Initializing...');
    new KronosPopup();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[KRONOS-Popup] Received message:', message);

    // Handle connection status updates
    if (message.type === 'connection:status') {
        // Update connection status in popup if it's open
        const popup = document.querySelector('.container');
        if (popup) {
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');

            if (statusDot && statusText) {
                statusDot.className = 'status-dot';
                statusText.textContent = message.payload.status === 'connected'
                    ? 'Connected to KRONOS-OS'
                    : 'Connection Error';

                if (message.payload.status === 'connected') {
                    statusDot.classList.add('connected');
                }
            }
        }
    }

    return true;
});

console.log('[KRONOS-Popup] Script loaded');