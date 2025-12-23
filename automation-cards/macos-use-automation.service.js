/*
 * macOS Use Automation Service
 * Handles macOS-specific automation with accessibility APIs
 */

const APIError = require('../../../api/APIError');
const BaseService = require('../../BaseService');
const { TypedValue } = require('../../drivers/meta/Runtime');
const { Context } = require('../../../util/context');

const DEFAULT_TIMEOUT_MS = 45 * 1000; // 45 seconds for macOS operations
const POLL_INTERVAL_MS = 1_500;
const MAX_RETRIES = 3;

class MacOSUseAutomationService extends BaseService {
    static MODULES = {
        axios: require('axios'),
    };

    _construct() {
        this.automationTypes = {
            'accessibility-action': {
                defaultUsageKey: 'macosuse:accessibility-action:default',
            },
            'ui-automation': {
                defaultUsageKey: 'macosuse:ui-automation:default',
            },
            'app-control': {
                defaultUsageKey: 'macosuse:app-control:default',
            },
        };
    }

    static IMPLEMENTS = {
        ['puter-macosuse-automation']: {
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
            }, 'Test mode: macOS automation would execute successfully');
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
                this.logger.warn(`macOS automation attempt ${attempt + 1} failed:`, error.message);

                if (attempt < MAX_RETRIES - 1) {
                    await this.#delay(POLL_INTERVAL_MS * (attempt + 1)); // Exponential backoff
                }
            }
        }

        if (!result) {
            throw new Error(`macOS automation failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
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
            accessibilityTree: result.accessibilityTree,
            results: result.results,
        });
    }

    async #executeActions(actions, target, options = {}) {
        const startTime = Date.now();
        const results = [];

        try {
            for (const action of actions) {
                // Check for timeout
                if (Date.now() - startTime > DEFAULT_TIMEOUT_MS) {
                    throw new Error('macOS automation timeout exceeded');
                }

                const result = await this.#executeSingleAction(action, target, options);
                results.push(result);

                // Optional delay between actions
                if (options.delayBetweenActions) {
                    await this.#delay(options.delayBetweenActions);
                }
            }

            // Get final accessibility tree if requested
            let accessibilityTree = null;
            if (options.includeAccessibilityTree) {
                accessibilityTree = await this.#getAccessibilityTree(target);
            }

            return {
                actionsCompleted: results.length,
                duration: Date.now() - startTime,
                accessibilityTree,
                results,
                actualUnits: this.#calculateComplexity(actions),
            };

        } catch (error) {
            // Get error accessibility tree
            let errorAccessibilityTree = null;
            try {
                errorAccessibilityTree = await this.#getAccessibilityTree(target);
            } catch (treeError) {
                this.logger.warn('Failed to get error accessibility tree:', treeError.message);
            }

            throw {
                ...error,
                actionsCompleted: results.length,
                duration: Date.now() - startTime,
                errorAccessibilityTree,
            };
        }
    }

    async #executeSingleAction(action, target, options) {
        const { action: actionType, element, parameters = {} } = action;

        switch (actionType) {
            case 'click':
                return await this.#performClick(element, parameters, target);

            case 'type_text':
                return await this.#performTypeText(element, parameters, target);

            case 'perform_action':
                return await this.#performAccessibilityAction(element, parameters, target);

            case 'get_element_tree':
                return await this.#getElementTree(parameters, target);

            case 'wait_for_element':
                return await this.#waitForElement(parameters, target);

            default:
                throw new Error(`Unsupported macOS action type: ${actionType}`);
        }
    }

    async #performClick(element, params, target) {
        const { action = 'AXPress' } = params;

        // Call macOS-use API
        const response = await this.modules.axios.post(`${target.endpoint}/mac/action`, {
            action: 'click',
            element: element,
            action_type: action,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        return {
            action: 'click',
            element: element.identifier || element,
            action_type: action,
            status: response.data.success ? 'completed' : 'failed',
        };
    }

    async #performTypeText(element, params, target) {
        const { text, submit = false } = params;

        const response = await this.modules.axios.post(`${target.endpoint}/mac/action`, {
            action: 'type_into',
            element: element,
            text: text,
            submit: submit,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        return {
            action: 'type_text',
            element: element.identifier || element,
            textLength: text.length,
            submit,
            status: response.data.success ? 'completed' : 'failed',
        };
    }

    async #performAccessibilityAction(element, params, target) {
        const { actionName } = params;

        const response = await this.modules.axios.post(`${target.endpoint}/mac/action`, {
            action: 'perform_action',
            element: element,
            action_name: actionName,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        return {
            action: 'perform_action',
            element: element.identifier || element,
            action_name: actionName,
            status: response.data.success ? 'completed' : 'failed',
        };
    }

    async #getElementTree(params, target) {
        const { application, maxDepth = 3 } = params;

        const response = await this.modules.axios.post(`${target.endpoint}/mac/tree`, {
            application,
            max_depth: maxDepth,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 20000,
        });

        return {
            action: 'get_element_tree',
            application,
            elementCount: response.data.elements?.length || 0,
            tree: response.data,
        };
    }

    async #waitForElement(params, target) {
        const { selector, timeout = 10000 } = params;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                const response = await this.modules.axios.post(`${target.endpoint}/mac/find`, {
                    selector,
                }, {
                    headers: {
                        'Authorization': `Bearer ${target.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 5000,
                });

                if (response.data.found) {
                    return {
                        action: 'wait_for_element',
                        selector,
                        found: true,
                        waitTime: Date.now() - startTime,
                        element: response.data.element,
                    };
                }
            } catch (error) {
                // Continue waiting
            }

            await this.#delay(1000);
        }

        throw new Error(`Element not found within ${timeout}ms: ${selector}`);
    }

    async #getAccessibilityTree(target) {
        try {
            const response = await this.modules.axios.get(`${target.endpoint}/mac/tree`, {
                headers: {
                    'Authorization': `Bearer ${target.apiKey}`,
                },
                timeout: 10000,
            });

            return response.data;
        } catch (error) {
            this.logger.warn('Failed to get accessibility tree:', error.message);
            return null;
        }
    }

    #calculateComplexity(actions) {
        let complexity = 0;

        for (const action of actions) {
            switch (action.action) {
                case 'click':
                case 'perform_action':
                    complexity += 1;
                    break;
                case 'type_text':
                    complexity += 2;
                    break;
                case 'get_element_tree':
                    complexity += 3;
                    break;
                case 'wait_for_element':
                    complexity += 1.5;
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
    MacOSUseAutomationService,
};