// KRONOS-OS Side Panel Script
// Handles settings and configuration interface

class KronosSidePanel {
    constructor() {
        this.agents = [];
        this.workflows = [];
        this.llmConfig = {
            ollamaUrl: 'http://localhost:11434',
            lmStudioUrl: 'http://localhost:1234/v1',
            customModelUrl: 'http://localhost:8080/v1'
        };
        this.init();
    }

    async init() {
        console.log('[KRONOS-SidePanel] Initializing...');

        this.setupEventListeners();
        await this.loadConfig();
        this.updateConnectionStatus();
        this.renderAgents();
        this.renderWorkflows();
        this.populateLLMConfig();
    }

    setupEventListeners() {
        // Agent control buttons
        document.getElementById('runAgent1')?.addEventListener('click', () => this.controlAgent('agent1', 'run'));
        document.getElementById('stopAgent1')?.addEventListener('click', () => this.controlAgent('agent1', 'stop'));
        document.getElementById('runAgent2')?.addEventListener('click', () => this.controlAgent('agent2', 'run'));
        document.getElementById('stopAgent2')?.addEventListener('click', () => this.controlAgent('agent2', 'stop'));
        document.getElementById('runAgent3')?.addEventListener('click', () => this.controlAgent('agent3', 'run'));
        document.getElementById('stopAgent3')?.addEventListener('click', () => this.controlAgent('agent3', 'stop'));

        // Workflow buttons
        document.getElementById('runWorkflow1')?.addEventListener('click', () => this.runWorkflow('workflow1'));
        document.getElementById('editWorkflow1')?.addEventListener('click', () => this.editWorkflow('workflow1'));

        // LLM config inputs
        document.getElementById('ollamaUrl')?.addEventListener('change', (e) => this.updateLLMConfig('ollamaUrl', e.target.value));
        document.getElementById('lmStudioUrl')?.addEventListener('change', (e) => this.updateLLMConfig('lmStudioUrl', e.target.value));
        document.getElementById('customModelUrl')?.addEventListener('change', (e) => this.updateLLMConfig('customModelUrl', e.target.value));
    }

    async loadConfig() {
        try {
            // Load from Chrome storage
            const result = await chrome.storage.local.get(['agents', 'workflows', 'llmConfig']);

            if (result.agents) this.agents = result.agents;
            if (result.workflows) this.workflows = result.workflows;
            if (result.llmConfig) this.llmConfig = { ...this.llmConfig, ...result.llmConfig };
        } catch (error) {
            console.error('[KRONOS-SidePanel] Failed to load config:', error);
        }
    }

    async updateConnectionStatus() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getConnectionStatus'
            });

            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');

            if (statusDot && statusText) {
                statusDot.className = 'status-dot';

                switch (response.status) {
                    case 'connected':
                        statusDot.classList.add('connected');
                        statusText.textContent = 'Connected to KRONOS-OS';
                        break;
                    case 'connecting':
                        statusDot.classList.add('loading');
                        statusText.textContent = 'Connecting...';
                        break;
                    case 'disconnected':
                        statusText.textContent = 'Disconnected';
                        break;
                    case 'error':
                        statusText.textContent = 'Connection Error';
                        break;
                    default:
                        statusText.textContent = 'Unknown Status';
                }
            }

            // Update backend URL display
            const backendUrlEl = document.getElementById('backendUrl');
            const wsUrlEl = document.getElementById('wsUrl');
            if (backendUrlEl) backendUrlEl.textContent = 'http://localhost:9991';
            if (wsUrlEl) wsUrlEl.textContent = 'ws://localhost:9991/tasks';

        } catch (error) {
            console.error('[KRONOS-SidePanel] Connection check failed:', error);
            const statusText = document.querySelector('.status-text');
            if (statusText) statusText.textContent = 'Connection Error';
        }
    }

    renderAgents() {
        // For now, just update the status indicators
        // In a full implementation, this would dynamically render agents
        console.log('[KRONOS-SidePanel] Rendering agents:', this.agents);
    }

    renderWorkflows() {
        // For now, just log workflows
        // In a full implementation, this would dynamically render workflows
        console.log('[KRONOS-SidePanel] Rendering workflows:', this.workflows);
    }

    populateLLMConfig() {
        const ollamaInput = document.getElementById('ollamaUrl');
        const lmStudioInput = document.getElementById('lmStudioUrl');
        const customInput = document.getElementById('customModelUrl');

        if (ollamaInput) ollamaInput.value = this.llmConfig.ollamaUrl;
        if (lmStudioInput) lmStudioInput.value = this.llmConfig.lmStudioUrl;
        if (customInput) customInput.value = this.llmConfig.customModelUrl;
    }

    async controlAgent(agentId, action) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: action === 'run' ? 'runAgent' : 'closeAgent',
                payload: { agentId: agentId }
            });

            if (response.success) {
                console.log(`[KRONOS-SidePanel] Agent ${agentId} ${action} successful`);
                this.showNotification(`Agent ${agentId} ${action} successful`);
                this.updateAgentStatus(agentId, action === 'run');
            } else {
                console.error(`[KRONOS-SidePanel] Agent ${agentId} ${action} failed:`, response.error);
                this.showNotification(`Failed to ${action} agent ${agentId}`, 'error');
            }
        } catch (error) {
            console.error(`[KRONOS-SidePanel] Agent control failed:`, error);
            this.showNotification(`Failed to ${action} agent ${agentId}`, 'error');
        }
    }

    async runWorkflow(workflowId) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'executeWorkflow',
                payload: { workflowId: workflowId }
            });

            if (response.success) {
                console.log(`[KRONOS-SidePanel] Workflow ${workflowId} executed successfully`);
                this.showNotification(`Workflow executed successfully`);
            } else {
                console.error(`[KRONOS-SidePanel] Workflow ${workflowId} execution failed:`, response.error);
                this.showNotification(`Failed to execute workflow`, 'error');
            }
        } catch (error) {
            console.error(`[KRONOS-SidePanel] Workflow execution failed:`, error);
            this.showNotification(`Failed to execute workflow`, 'error');
        }
    }

    editWorkflow(workflowId) {
        // For now, just show a message
        // In a full implementation, this would open a workflow editor
        console.log(`[KRONOS-SidePanel] Edit workflow: ${workflowId}`);
        this.showNotification('Workflow editor not yet implemented');
    }

    async updateLLMConfig(key, value) {
        this.llmConfig[key] = value;

        try {
            await chrome.storage.local.set({
                llmConfig: this.llmConfig
            });
            console.log(`[KRONOS-SidePanel] LLM config updated: ${key} = ${value}`);
        } catch (error) {
            console.error('[KRONOS-SidePanel] Failed to save LLM config:', error);
        }
    }

    updateAgentStatus(agentId, isActive) {
        const statusElement = document.querySelector(`#${agentId} .agent-status`);
        if (statusElement) {
            statusElement.className = `agent-status ${isActive ? 'active' : 'inactive'}`;
        }
    }

    showNotification(message, type = 'success') {
        // Use Chrome notifications API
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'KRONOS-OS Settings',
            message: message,
            priority: type === 'error' ? 2 : 1
        });
    }
}

// Initialize side panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[KRONOS-SidePanel] Initializing...');
    new KronosSidePanel();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[KRONOS-SidePanel] Received message:', message);

    // Handle agent status updates
    if (message.type === 'agent:state') {
        // Update agent status in side panel
        const agentId = message.payload.agentId;
        const isActive = message.payload.status === 'running';
        const statusElement = document.querySelector(`#${agentId} .agent-status`);
        if (statusElement) {
            statusElement.className = `agent-status ${isActive ? 'active' : 'inactive'}`;
        }
    }

    // Handle connection status updates
    if (message.type === 'connection:status') {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        if (statusDot && statusText) {
            statusDot.className = 'status-dot';

            switch (message.payload.status) {
                case 'connected':
                    statusDot.classList.add('connected');
                    statusText.textContent = 'Connected to KRONOS-OS';
                    break;
                case 'connecting':
                    statusDot.classList.add('loading');
                    statusText.textContent = 'Connecting...';
                    break;
                case 'disconnected':
                    statusText.textContent = 'Disconnected';
                    break;
                case 'error':
                    statusText.textContent = 'Connection Error';
                    break;
            }
        }
    }

    return true;
});

console.log('[KRONOS-SidePanel] Script loaded');