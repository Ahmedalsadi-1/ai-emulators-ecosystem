/*
 * Factif AI Automation Service
 * Handles browser automation and visual testing
 */

const APIError = require('../../../api/APIError');
const BaseService = require('../../BaseService');
const { TypedValue } = require('../../drivers/meta/Runtime');
const { Context } = require('../../../util/context');

const DEFAULT_TIMEOUT_MS = 120 * 1000; // 2 minutes for browser operations
const POLL_INTERVAL_MS = 3_000;
const MAX_RETRIES = 3;

class FactifAIAutomationService extends BaseService {
    static MODULES = {
        axios: require('axios'),
    };

    _construct() {
        this.automationTypes = {
            'browser-control': {
                defaultUsageKey: 'factifai:browser-control:default',
            },
            'web-automation': {
                defaultUsageKey: 'factifai:web-automation:default',
            },
            'visual-testing': {
                defaultUsageKey: 'factifai:visual-testing:default',
            },
        };
    }

    static IMPLEMENTS = {
        ['puter-factifai-automation']: {
            async automate(params) {
                return await this.executeAutomation(params);
            },
        },
    };

    async executeAutomation(params) {
        const {
            type,
            scenario,
            actions,
            target,
            options,
            test_mode,
        } = params ?? {};

        // Validate required parameters
        if (!type || (!scenario && !actions)) {
            throw APIError.create('field_invalid', null, {
                key: 'params',
                expected: 'type and either scenario or actions',
                got: params,
            });
        }

        // Validate automation type
        const automationConfig = this.automationTypes[type];
        if (!automationConfig) {
            throw APIError.create('field_invalid', null, {
                key: 'type',
                expected: `one of: ${Object.keys(this.automationTypes).join(', ')}`,
                got: type,
            });
        }

        if (test_mode) {
            return new TypedValue({
                $: 'string:text',
                content_type: 'text/plain',
            }, 'Test mode: Browser automation would execute successfully');
        }

        // Check usage limits
        const usageKey = automationConfig.defaultUsageKey;
        const estimatedUnits = this.#calculateComplexity(scenario, actions);
        const actor = Context.get('actor');
        const usageAllowed = await this.meteringService.hasEnoughCreditsFor(actor, usageKey, estimatedUnits);
        if (!usageAllowed) {
            throw APIError.create('insufficient_funds');
        }

        // Execute automation with retry logic
        let result;
        let lastError;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                result = await this.#executeAutomation(scenario, actions, target, options);
                break; // Success, exit retry loop
            } catch (error) {
                lastError = error;
                this.logger.warn(`Browser automation attempt ${attempt + 1} failed:`, error.message);

                if (attempt < MAX_RETRIES - 1) {
                    await this.#delay(POLL_INTERVAL_MS * (attempt + 1)); // Exponential backoff
                }
            }
        }

        if (!result) {
            throw new Error(`Browser automation failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
        }

        // Meter the usage
        this.meteringService.incrementUsage(actor, usageKey, result.actualUnits);

        return new TypedValue({
            $: 'object',
            content_type: 'application/json',
        }, {
            success: true,
            type,
            scenario: scenario?.name,
            actionsExecuted: result.actionsCompleted,
            duration: result.duration,
            finalScreenshot: result.finalScreenshot,
            visualDifferences: result.visualDifferences,
            results: result.results,
        });
    }

    async #executeAutomation(scenario, actions, target, options = {}) {
        const startTime = Date.now();

        try {
            // Initialize browser session
            const sessionId = await this.#initializeBrowserSession(target, options);

            let result;
            if (scenario) {
                result = await this.#executeScenario(scenario, sessionId, target, options);
            } else {
                result = await this.#executeActions(actions, sessionId, target, options);
            }

            // Take final screenshot if requested
            let finalScreenshot = null;
            if (options.includeFinalScreenshot) {
                finalScreenshot = await this.#takeScreenshot(sessionId, target);
            }

            // Clean up session
            await this.#cleanupBrowserSession(sessionId, target);

            return {
                ...result,
                duration: Date.now() - startTime,
                finalScreenshot,
                actualUnits: this.#calculateComplexity(scenario, actions),
            };

        } catch (error) {
            // Take error screenshot and cleanup
            let errorScreenshot = null;
            try {
                if (target.sessionId) {
                    errorScreenshot = await this.#takeScreenshot(target.sessionId, target);
                    await this.#cleanupBrowserSession(target.sessionId, target);
                }
            } catch (cleanupError) {
                this.logger.warn('Failed to cleanup browser session:', cleanupError.message);
            }

            throw {
                ...error,
                duration: Date.now() - startTime,
                errorScreenshot,
            };
        }
    }

    async #initializeBrowserSession(target, options) {
        const response = await this.modules.axios.post(`${target.endpoint}/initialize`, {
            url: options.startUrl || 'about:blank',
            viewport: options.viewport || { width: 1366, height: 768 },
            headless: options.headless !== false,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        return response.data.sessionId;
    }

    async #executeScenario(scenario, sessionId, target, options) {
        const response = await this.modules.axios.post(`${target.endpoint}/execute-scenario`, {
            sessionId,
            scenario: {
                name: scenario.name,
                steps: scenario.steps,
                assertions: scenario.assertions,
            },
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 90000,
        });

        const data = response.data;
        return {
            actionsCompleted: data.stepsCompleted || 0,
            results: data.results,
            visualDifferences: data.visualDifferences,
            assertionsPassed: data.assertionsPassed,
        };
    }

    async #executeActions(actions, sessionId, target, options) {
        const results = [];

        for (const action of actions) {
            // Check for timeout
            if (Date.now() - Date.now() > DEFAULT_TIMEOUT_MS) {
                throw new Error('Browser automation timeout exceeded');
            }

            const result = await this.#executeSingleAction(action, sessionId, target);
            results.push(result);

            // Optional delay between actions
            if (options.delayBetweenActions) {
                await this.#delay(options.delayBetweenActions);
            }
        }

        return {
            actionsCompleted: results.length,
            results,
        };
    }

    async #executeSingleAction(action, sessionId, target) {
        const { type, parameters = {} } = action;

        const response = await this.modules.axios.post(`${target.endpoint}/action`, {
            sessionId,
            action: {
                type,
                parameters,
            },
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        return {
            action: type,
            parameters,
            result: response.data.result,
            screenshot: response.data.screenshot,
            timestamp: new Date().toISOString(),
        };
    }

    async #takeScreenshot(sessionId, target) {
        const response = await this.modules.axios.post(`${target.endpoint}/screenshot`, {
            sessionId,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        return {
            sessionId,
            data: response.data.screenshot,
            timestamp: new Date().toISOString(),
        };
    }

    async #cleanupBrowserSession(sessionId, target) {
        try {
            await this.modules.axios.post(`${target.endpoint}/cleanup`, {
                sessionId,
            }, {
                headers: {
                    'Authorization': `Bearer ${target.apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
        } catch (error) {
            this.logger.warn('Failed to cleanup browser session:', error.message);
        }
    }

    #calculateComplexity(scenario, actions) {
        let complexity = 0;

        if (scenario) {
            // Scenario-based complexity
            const stepCount = scenario.steps?.length || 0;
            complexity += stepCount * 2; // Each step is moderately complex

            if (scenario.assertions) {
                complexity += scenario.assertions.length * 1.5; // Assertions add complexity
            }
        }

        if (actions) {
            // Action-based complexity
            for (const action of actions) {
                switch (action.type) {
                    case 'navigate':
                    case 'click':
                    case 'type':
                        complexity += 1;
                        break;
                    case 'wait':
                    case 'scroll':
                        complexity += 0.5;
                        break;
                    case 'screenshot':
                        complexity += 2;
                        break;
                    case 'assert':
                        complexity += 3;
                        break;
                    default:
                        complexity += 1;
                }
            }
        }

        return Math.max(1, Math.ceil(complexity));
    }

    async #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = {
    FactifAIAutomationService,
};