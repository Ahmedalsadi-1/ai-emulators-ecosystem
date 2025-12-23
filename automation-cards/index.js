/*
 * Turix-Style Automation Cards
 * Production-ready automation services for various platforms
 *
 * This collection provides comprehensive automation capabilities across:
 * - Screen control and desktop tasks
 * - Web automation and browser control
 * - Security testing and penetration testing
 * - Error handling and retry logic
 * - Usage metering and resource management
 *
 * Each service follows the same architectural pattern as the Sora video generation service:
 * - Parameter validation
 * - Resource usage estimation and metering
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Result aggregation and reporting
 */

const { BytebotAutomationService } = require('./bytebot-automation.service');
const { OpenInterfaceAutomationService } = require('./open-interface-automation.service');
const { MacOSUseAutomationService } = require('./macos-use-automation.service');
const { FactifAIAutomationService } = require('./factif-ai-automation.service');
const { KaliDesktopAutomationService } = require('./kali-desktop-automation.service');
const { Wan2GPVideoGenerationService } = require('./wan2gp-automation.service');
const { ReelsfyVideoProcessingService } = require('./reelsfy-automation.service');
const { PostizAutomationService } = require('./postiz-automation.service');
const { OnlySnarfAutomationService } = require('./onlysnarf-automation.service');

module.exports = {
    // Individual automation services
    BytebotAutomationService,
    OpenInterfaceAutomationService,
    MacOSUseAutomationService,
    FactifAIAutomationService,
    KaliDesktopAutomationService,
    Wan2GPVideoGenerationService,
    ReelsfyVideoProcessingService,
    PostizAutomationService,
    OnlySnarfAutomationService,

    // Registry of all automation cards
    automationCards: {
        'puter-bytebot-automation': BytebotAutomationService,
        'puter-openinterface-automation': OpenInterfaceAutomationService,
        'puter-macosuse-automation': MacOSUseAutomationService,
        'puter-factifai-automation': FactifAIAutomationService,
        'puter-kalidesktop-automation': KaliDesktopAutomationService,
        'puter-wan2gp-automation': Wan2GPVideoGenerationService,
        'puter-reelsfy-automation': ReelsfyVideoProcessingService,
        'puter-postiz-automation': PostizAutomationService,
        'puter-onlysnarf-automation': OnlySnarfAutomationService,
    },

    // Card descriptions for UI/display purposes
    cardDescriptions: {
        'puter-bytebot-automation': {
            name: 'Bytebot Computer Automation',
            description: 'Screen control, mouse/keyboard input, application management, and file operations',
            capabilities: ['screen-control', 'desktop-task', 'file-operation'],
            platforms: ['Linux', 'Windows', 'macOS'],
            complexity: 'Medium',
        },
        'puter-openinterface-automation': {
            name: 'Open-Interface Automation',
            description: 'LLM-driven computer control with natural language instructions',
            capabilities: ['screen-control', 'web-automation', 'desktop-task'],
            platforms: ['Cross-platform'],
            complexity: 'High (LLM-powered)',
        },
        'puter-macosuse-automation': {
            name: 'macOS Use Automation',
            description: 'macOS-specific automation using accessibility APIs',
            capabilities: ['accessibility-action', 'ui-automation', 'app-control'],
            platforms: ['macOS'],
            complexity: 'Medium',
        },
        'puter-factifai-automation': {
            name: 'Factif AI Browser Automation',
            description: 'Advanced browser automation with visual testing capabilities',
            capabilities: ['browser-control', 'web-automation', 'visual-testing'],
            platforms: ['Cross-platform (Browser)'],
            complexity: 'High',
        },
        'puter-kalidesktop-automation': {
            name: 'Kali Desktop Security Automation',
            description: 'Security testing and penetration testing automation',
            capabilities: ['security-scan', 'command-execution', 'penetration-test'],
            platforms: ['Linux (Kali)'],
            complexity: 'Very High',
        },
        'puter-wan2gp-automation': {
            name: 'Wan2GP Video Generation',
            description: 'AI-powered video generation from text prompts and images using advanced models',
            capabilities: ['video-generation', 'text2video', 'image2video', 'ai-model'],
            platforms: ['Cross-platform (GPU required)'],
            complexity: 'High (GPU-intensive)',
        },
        'puter-reelsfy-automation': {
            name: 'Reelsfy Video Processing',
            description: 'Convert long videos to engaging Instagram Reels with AI analysis and subtitles',
            capabilities: ['video-editing', 'content-analysis', 'subtitle-generation', 'format-conversion'],
            platforms: ['Cross-platform'],
            complexity: 'Medium',
        },
        'puter-postiz-automation': {
            name: 'Postiz Social Media Scheduling',
            description: 'AI-powered social media content scheduling across multiple platforms',
            capabilities: ['social-scheduling', 'content-creation', 'analytics', 'multi-platform'],
            platforms: ['Cross-platform (Web)'],
            complexity: 'Medium',
        },
        'puter-onlysnarf-automation': {
            name: 'OnlySnarf Content Automation',
            description: 'Automated content posting and management for OnlyFans platform',
            capabilities: ['content-posting', 'message-automation', 'poll-creation', 'scheduling'],
            platforms: ['Cross-platform (Browser)'],
            complexity: 'Medium',
        },
    },

    // Utility functions
    getCardByName: function(name) {
        return this.automationCards[name];
    },

    getAvailableCards: function() {
        return Object.keys(this.automationCards);
    },

    getCardDescription: function(name) {
        return this.cardDescriptions[name];
    },

    // Validation helpers
    validateAutomationParams: function(cardName, params) {
        const card = this.getCardByName(cardName);
        if (!card) {
            throw new Error(`Unknown automation card: ${cardName}`);
        }

        // Basic validation - can be extended per card
        if (!params.type) {
            throw new Error('Automation type is required');
        }

        return true;
    },
};