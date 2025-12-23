/*
 * Open-Interface Automation Service
 * Handles cross-platform computer control with LLM-driven automation
 */

const APIError = require('../../../api/APIError');
const BaseService = require('../../BaseService');
const { TypedValue } = require('../../drivers/meta/Runtime');
const { Context } = require('../../../util/context');

const DEFAULT_TIMEOUT_MS = 60 * 1000; // 60 seconds for LLM-driven tasks
const POLL_INTERVAL_MS = 2_000;
const MAX_INSTRUCTION_STEPS = 50;

class OpenInterfaceAutomationService extends BaseService {
    static MODULES = {
        axios: require('axios'),
        openai: require('openai'),
    };

    _construct() {
        this.automationTypes = {
            'screen-control': {
                defaultUsageKey: 'openinterface:screen-control:default',
            },
            'web-automation': {
                defaultUsageKey: 'openinterface:web-automation:default',
            },
            'desktop-task': {
                defaultUsageKey: 'openinterface:desktop-task:default',
            },
        };
    }

    static IMPLEMENTS = {
        ['puter-openinterface-automation']: {
            async automate(params) {
                return await this.executeAutomation(params);
            },
        },
    };

    async executeAutomation(params) {
        const {
            type,
            objective,
            context,
            options,
            test_mode,
        } = params ?? {};

        // Validate required parameters
        if (!type || !objective) {
            throw APIError.create('field_invalid', null, {
                key: 'params',
                expected: 'type and objective',
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
            }, 'Test mode: Automation instructions would be generated successfully');
        }

        // Check usage limits (based on estimated LLM calls)
        const usageKey = automationConfig.defaultUsageKey;
        const estimatedUnits = this.#estimateLLMCalls(objective);
        const actor = Context.get('actor');
        const usageAllowed = await this.meteringService.hasEnoughCreditsFor(actor, usageKey, estimatedUnits);
        if (!usageAllowed) {
            throw APIError.create('insufficient_funds');
        }

        // Initialize OpenAI client
        const openai = new this.modules.openai.OpenAI({
            apiKey: this.config?.openai?.apiKey || this.global_config?.openai?.apiKey,
        });

        // Generate automation instructions
        const instructions = await this.#generateInstructions(openai, objective, context, type, options);

        // Execute automation
        const result = await this.#executeInstructions(instructions, options);

        // Meter the usage
        const actualUnits = this.#calculateActualUsage(instructions, result);
        this.meteringService.incrementUsage(actor, usageKey, actualUnits);

        return new TypedValue({
            $: 'object',
            content_type: 'application/json',
        }, {
            success: true,
            type,
            objective,
            instructionsGenerated: instructions.steps?.length || 0,
            stepsExecuted: result.stepsCompleted,
            duration: result.duration,
            finalScreenshot: result.finalScreenshot,
            results: result.results,
        });
    }

    async #generateInstructions(openai, objective, context, type, options) {
        const systemPrompt = this.#buildSystemPrompt(type, options);
        const userPrompt = this.#buildUserPrompt(objective, context);

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 2000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Failed to generate automation instructions');
        }

        try {
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Invalid JSON response from LLM: ${error.message}`);
        }
    }

    #buildSystemPrompt(type, options) {
        const basePrompt = `You are an expert automation engineer. Generate step-by-step instructions for computer automation tasks.

Available actions:
- sleep: Wait for a specified number of seconds
- pyautogui functions: click, moveTo, write, press, hotkey, screenshot, etc.

Response format:
{
  "steps": [
    {
      "function": "action_name",
      "parameters": { "param": "value" },
      "human_readable_justification": "Why this step is needed"
    }
  ],
  "done": false
}

Guidelines:
- Break complex tasks into small, atomic steps
- Use sleep between actions when waiting for UI changes
- Provide clear justifications for each step
- Consider error handling and recovery`;

        const typeSpecificPrompt = {
            'screen-control': `
Focus on mouse and keyboard interactions:
- Use coordinates for precise clicks
- Handle different click types (left, right, double)
- Manage keyboard input and shortcuts`,
            'web-automation': `
Focus on web browser interactions:
- Navigate to URLs
- Fill forms and click buttons
- Extract information from web pages
- Handle dynamic content loading`,
            'desktop-task': `
Focus on desktop application management:
- Launch and switch between applications
- File operations (open, save, copy)
- System shortcuts and menus
- Window management`,
        };

        return basePrompt + (typeSpecificPrompt[type] || '');
    }

    #buildUserPrompt(objective, context) {
        let prompt = `Objective: ${objective}\n\n`;

        if (context) {
            prompt += `Context:\n${JSON.stringify(context, null, 2)}\n\n`;
        }

        prompt += `Generate the automation steps needed to accomplish this objective.`;

        return prompt;
    }

    async #executeInstructions(instructions, options) {
        const startTime = Date.now();
        const results = [];
        let stepsCompleted = 0;

        try {
            const steps = instructions.steps || [];

            for (let i = 0; i < steps.length && i < MAX_INSTRUCTION_STEPS; i++) {
                const step = steps[i];

                // Check for timeout
                if (Date.now() - startTime > DEFAULT_TIMEOUT_MS) {
                    throw new Error('Automation timeout exceeded');
                }

                const result = await this.#executeStep(step, options);
                results.push({
                    step: i + 1,
                    function: step.function,
                    result,
                    justification: step.human_readable_justification,
                });
                stepsCompleted++;

                // Optional delay between steps
                if (options?.delayBetweenSteps) {
                    await this.#delay(options.delayBetweenSteps);
                }
            }

            // Take final screenshot if requested
            let finalScreenshot = null;
            if (options?.includeFinalScreenshot) {
                finalScreenshot = await this.#takeScreenshot();
            }

            return {
                stepsCompleted,
                duration: Date.now() - startTime,
                finalScreenshot,
                results,
                completed: instructions.done || stepsCompleted >= steps.length,
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
                stepsCompleted,
                duration: Date.now() - startTime,
                errorScreenshot,
            };
        }
    }

    async #executeStep(step, options) {
        const { function: functionName, parameters = {} } = step;

        // Execute via Open-Interface API
        const response = await this.modules.axios.post(`${options.endpoint}/execute`, {
            function: functionName,
            parameters,
            human_readable_justification: step.human_readable_justification,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        return {
            success: response.data.success,
            output: response.data.output,
            duration: response.data.duration,
        };
    }

    async #takeScreenshot() {
        // This would integrate with Open-Interface's screenshot capability
        return {
            format: 'base64',
            data: 'screenshot_data_placeholder',
            timestamp: new Date().toISOString(),
        };
    }

    #estimateLLMCalls(objective) {
        // Estimate based on objective complexity
        const length = objective.length;
        if (length < 100) return 1;
        if (length < 500) return 2;
        return 3;
    }

    #calculateActualUsage(instructions, result) {
        // Calculate based on steps executed and LLM calls made
        const steps = instructions.steps?.length || 0;
        const llmCalls = Math.ceil(steps / 10); // Estimate LLM calls needed
        return Math.max(1, llmCalls + Math.floor(result.stepsCompleted / 5));
    }

    async #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = {
    OpenInterfaceAutomationService,
};