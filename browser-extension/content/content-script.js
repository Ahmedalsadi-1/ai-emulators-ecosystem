// KRONOS-OS Content Script
// Injects into web pages for interaction capabilities

class KronosContentScript {
    constructor() {
        this.agentId = null;
        this.isActive = false;
        this.init();
    }

    init() {
        console.log('[KRONOS-Content] Initializing content script');

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Listen for messages from popup/sidebar
        window.addEventListener('message', (event) => {
            if (event.source !== window) return;
            if (event.data.type && event.data.type.startsWith('kronos-')) {
                this.handleWindowMessage(event.data);
            }
        });

        // Announce content script ready
        this.announceReady();
    }

    announceReady() {
        // Send message to background script that content script is ready
        chrome.runtime.sendMessage({
            type: 'content-script-ready',
            url: window.location.href,
            title: document.title
        });
    }

    handleMessage(message, sender, sendResponse) {
        console.log('[KRONOS-Content] Received message:', message);

        switch (message.type) {
            case 'agent:run':
                this.runAgent(message.payload);
                sendResponse({ success: true });
                break;

            case 'agent:close':
                this.closeAgent(message.payload);
                sendResponse({ success: true });
                break;

            case 'workflow:execute':
                this.executeWorkflow(message.payload);
                sendResponse({ success: true });
                break;

            case 'skills:search':
                this.executeSearchSkill(message.payload);
                sendResponse({ success: true });
                break;

            case 'skills:crawl':
                this.executeCrawlSkill(message.payload);
                sendResponse({ success: true });
                break;

            case 'skills:code':
                this.executeCodeSkill(message.payload);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    }

    handleWindowMessage(data) {
        console.log('[KRONOS-Content] Window message:', data);
        // Handle messages from injected scripts or other content
    }

    runAgent(payload) {
        console.log('[KRONOS-Content] Running agent:', payload);
        this.agentId = payload.agentId;
        this.isActive = true;

        // Create agent overlay
        this.createAgentOverlay(payload);

        // Start agent execution
        this.executeAgentTasks(payload);
    }

    closeAgent(payload) {
        console.log('[KRONOS-Content] Closing agent:', payload);
        this.isActive = false;
        this.agentId = null;

        // Remove agent overlay
        this.removeAgentOverlay();
    }

    createAgentOverlay(payload) {
        // Create visual indicator that agent is active
        const overlay = document.createElement('div');
        overlay.id = 'kronos-agent-overlay';
        overlay.innerHTML = `
            <div class="kronos-agent-indicator">
                <div class="agent-icon">🤖</div>
                <div class="agent-status">Agent Active</div>
                <div class="agent-name">${payload.agentId}</div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #kronos-agent-overlay {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            }

            .kronos-agent-indicator {
                background: linear-gradient(135deg, #6d28d9, #8b5cf6);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .agent-icon {
                font-size: 16px;
            }

            .agent-status {
                font-weight: 600;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }

    removeAgentOverlay() {
        const overlay = document.getElementById('kronos-agent-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    executeAgentTasks(payload) {
        // Send tasks to background script for processing
        chrome.runtime.sendMessage({
            type: 'agent:tasks',
            payload: {
                agentId: payload.agentId,
                tasks: payload.tasks || [],
                url: window.location.href
            }
        });
    }

    executeWorkflow(payload) {
        console.log('[KRONOS-Content] Executing workflow:', payload);

        // Execute workflow steps
        chrome.runtime.sendMessage({
            type: 'workflow:steps',
            payload: {
                workflowId: payload.workflowId,
                steps: payload.steps || [],
                url: window.location.href
            }
        });
    }

    async executeSearchSkill(payload) {
        console.log('[KRONOS-Content] Executing search skill:', payload);

        // Extract search query from selection or payload
        const query = payload.query || window.getSelection().toString();

        if (!query) {
            console.warn('[KRONOS-Content] No search query provided');
            return;
        }

        // Send search request to background script
        chrome.runtime.sendMessage({
            type: 'skill:search',
            payload: {
                query: query,
                context: {
                    url: window.location.href,
                    title: document.title,
                    selectedText: window.getSelection().toString()
                }
            }
        });
    }

    async executeCrawlSkill(payload) {
        console.log('[KRONOS-Content] Executing crawl skill:', payload);

        // Extract page content
        const content = this.extractPageContent();

        // Send crawl data to background script
        chrome.runtime.sendMessage({
            type: 'skill:crawl',
            payload: {
                url: window.location.href,
                title: document.title,
                content: content,
                metadata: this.extractPageMetadata()
            }
        });
    }

    async executeCodeSkill(payload) {
        console.log('[KRONOS-Content] Executing code skill:', payload);

        try {
            // Execute JavaScript code in page context
            const result = eval(payload.code);

            // Send result back to background script
            chrome.runtime.sendMessage({
                type: 'skill:code-result',
                payload: {
                    code: payload.code,
                    result: result,
                    url: window.location.href
                }
            });
        } catch (error) {
            console.error('[KRONOS-Content] Code execution error:', error);

            chrome.runtime.sendMessage({
                type: 'skill:code-error',
                payload: {
                    code: payload.code,
                    error: error.message,
                    url: window.location.href
                }
            });
        }
    }

    extractPageContent() {
        // Extract main content from page
        const contentSelectors = [
            'main',
            '[role="main"]',
            '.content',
            '.post-content',
            '.article-content',
            'article'
        ];

        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.length > 100) {
                return element.textContent.trim();
            }
        }

        // Fallback to body content
        return document.body.textContent.trim();
    }

    extractPageMetadata() {
        const meta = {
            title: document.title,
            description: '',
            keywords: '',
            author: '',
            published: '',
            modified: ''
        };

        // Extract meta tags
        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');

            if (name && content) {
                switch (name.toLowerCase()) {
                    case 'description':
                        meta.description = content;
                        break;
                    case 'keywords':
                        meta.keywords = content;
                        break;
                    case 'author':
                        meta.author = content;
                        break;
                    case 'article:published_time':
                    case 'og:article:published_time':
                        meta.published = content;
                        break;
                    case 'article:modified_time':
                    case 'og:article:modified_time':
                        meta.modified = content;
                        break;
                }
            }
        });

        return meta;
    }
}

// Initialize content script
const kronosContentScript = new KronosContentScript();

console.log('[KRONOS-Content] Content script loaded');