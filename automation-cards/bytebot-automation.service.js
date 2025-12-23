/*
 * Bytebot Computer Automation Service
 * Handles screen control, desktop tasks, and file operations
 */

const APIError = require('../../../api/APIError');
const BaseService = require('../../BaseService');
const { TypedValue } = require('../../drivers/meta/Runtime');
const { Context } = require('../../../util/context');

const DEFAULT_TIMEOUT_MS = 30 * 1000; // 30 seconds for automation tasks
const POLL_INTERVAL_MS = 1_000;
const MAX_RETRIES = 3;

class BytebotAutomationService extends BaseService {
    static MODULES = {
        axios: require('axios'),
    };

    _construct() {
        this.automationTypes = {
            'screen-control': {
                defaultUsageKey: 'bytebot:screen-control:default',
            },
            'desktop-task': {
                defaultUsageKey: 'bytebot:desktop-task:default',
            },
            'file-operation': {
                defaultUsageKey: 'bytebot:file-operation:default',
            },
        };
    }

    static IMPLEMENTS = {
        ['puter-bytebot-automation']: {
            async automate(params) {
                return await this.executeAutomation(params);
            },
        },
    };

    async executeAutomation(params) {
        const {
            type,
            actions,
            target,
            options,
            test_mode,
        } = params ?? {};

        // Validate required parameters
        if (!type || !actions || !Array.isArray(actions)) {
            throw APIError.create('field_invalid', null, {
                key: 'params',
                expected: 'type and actions array',
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
            }, 'Test mode: Automation would execute successfully');
        }

        // Check usage limits
        const usageKey = automationConfig.defaultUsageKey;
        const estimatedUnits = this.#calculateComplexity(actions);
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
                result = await this.#executeActions(actions, target, options);
                break; // Success, exit retry loop
            } catch (error) {
                lastError = error;
                this.logger.warn(`Automation attempt ${attempt + 1} failed:`, error.message);

                if (attempt < MAX_RETRIES - 1) {
                    await this.#delay(POLL_INTERVAL_MS * (attempt + 1)); // Exponential backoff
                }
            }
        }

        if (!result) {
            throw new Error(`Automation failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
        }

        // Meter the usage
        this.meteringService.incrementUsage(actor, usageKey, result.actualUnits);

        return new TypedValue({
            $: 'object',
            content_type: 'application/json',
        }, {
            success: true,
            type,
            actionsExecuted: result.actionsCompleted,
            duration: result.duration,
            screenshot: result.screenshot,
            results: result.results,
        });
    }

    async #executeActions(actions, target, options = {}) {
        const startTime = Date.now();
        const results = [];
        let actionsCompleted = 0;

        try {
            for (const action of actions) {
                // Check for timeout
                if (Date.now() - startTime > DEFAULT_TIMEOUT_MS) {
                    throw new Error('Automation timeout exceeded');
                }

                const result = await this.#executeSingleAction(action, target, options);
                results.push(result);
                actionsCompleted++;

                // Optional delay between actions
                if (options.delayBetweenActions) {
                    await this.#delay(options.delayBetweenActions);
                }
            }

            // Take final screenshot if requested
            let screenshot = null;
            if (options.includeScreenshot) {
                screenshot = await this.#takeScreenshot();
            }

            return {
                actionsCompleted,
                duration: Date.now() - startTime,
                screenshot,
                results,
                actualUnits: this.#calculateComplexity(actions),
            };

        } catch (error) {
            // Take error screenshot
            let errorScreenshot = null;
            try {
                errorScreenshot = await this.#takeScreenshot();
            } catch (screenshotError) {
                this.logger.warn('Failed to take error screenshot:', screenshotError.message);
            }

            throw {
                ...error,
                actionsCompleted,
                duration: Date.now() - startTime,
                errorScreenshot,
            };
        }
    }

    async #executeSingleAction(action, target, options) {
        const { action: actionType, parameters = {} } = action;

        switch (actionType) {
            case 'click':
                return await this.#performClick(parameters, target);

            case 'type_text':
                return await this.#performTypeText(parameters, target);

            case 'take_screenshot':
                return await this.#takeScreenshot(parameters);

            case 'launch_application':
                return await this.#launchApplication(parameters);

            case 'file_operation':
                return await this.#performFileOperation(parameters);

            case 'wait':
                await this.#delay(parameters.duration || 1000);
                return { action: 'wait', status: 'completed' };

            default:
                throw new Error(`Unsupported action type: ${actionType}`);
        }
    }

    async #performClick(params, target) {
        const { x, y, button = 'left', clickCount = 1 } = params;

        // Call bytebot computer use API
        const response = await this.modules.axios.post(`${target.endpoint}/computer-use/action`, {
            action: 'click_mouse',
            coordinates: { x, y },
            button,
            clickCount,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        return {
            action: 'click',
            coordinates: { x, y },
            button,
            status: response.data.success ? 'completed' : 'failed',
        };
    }

    async #performTypeText(params, target) {
        const { text, delay = 50 } = params;

        const response = await this.modules.axios.post(`${target.endpoint}/computer-use/action`, {
            action: 'type_text',
            text,
            delay,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        return {
            action: 'type_text',
            textLength: text.length,
            status: response.data.success ? 'completed' : 'failed',
        };
    }

    async #takeScreenshot(params = {}) {
        const { format = 'base64' } = params;

        const response = await this.modules.axios.post(`${target.endpoint}/computer-use/action`, {
            action: 'screenshot',
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        return {
            format,
            data: response.data.image,
            timestamp: new Date().toISOString(),
        };
    }

    async #launchApplication(params) {
        const { application } = params;

        const response = await this.modules.axios.post(`${target.endpoint}/computer-use/action`, {
            action: 'application',
            application,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        return {
            action: 'launch_application',
            application,
            status: response.data.success ? 'completed' : 'failed',
        };
    }

    async #performFileOperation(params) {
        const { operation, path, content } = params;

        const actionMap = {
            read: 'read_file',
            write: 'write_file',
        };

        const action = actionMap[operation];
        if (!action) {
            throw new Error(`Unsupported file operation: ${operation}`);
        }

        const requestBody = { action, path };
        if (operation === 'write' && content) {
            requestBody.data = Buffer.from(content).toString('base64');
        }

        const response = await this.modules.axios.post(`${target.endpoint}/computer-use/action`, requestBody, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 20000,
        });

        return {
            action: 'file_operation',
            operation,
            path,
            status: response.data.success ? 'completed' : 'failed',
            message: response.data.message,
        };
    }

    #calculateComplexity(actions) {
        let complexity = 0;

        for (const action of actions) {
            switch (action.action) {
                case 'click':
                case 'type_text':
                    complexity += 1;
                    break;
                case 'take_screenshot':
                    complexity += 2;
                    break;
                case 'launch_application':
                    complexity += 3;
                    break;
                case 'file_operation':
                    complexity += 5;
                    break;
                case 'wait':
                    complexity += 0.1;
                    break;
                default:
                    complexity += 1;
            }
        }

        return Math.max(1, Math.ceil(complexity));
    }

    async #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = {
    BytebotAutomationService,
};