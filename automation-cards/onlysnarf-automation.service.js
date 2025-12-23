/*
 * OnlySnarf Content Automation Service
 * Automated content posting and management for OnlyFans
 *
 * Capabilities:
 * - Automated post creation and scheduling
 * - Message sending to individual users or bulk
 * - Poll creation and management
 * - Discount code application
 * - Content performance tracking
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class OnlySnarfAutomationService {
    constructor(config = {}) {
        this.config = {
            maxConcurrentJobs: config.maxConcurrentJobs || 1,
            timeoutMinutes: config.timeoutMinutes || 15,
            outputDir: config.outputDir || './onlysnarf_output',
            pythonPath: config.pythonPath || 'python3',
            onlysnarfPath: config.onlysnarfPath || '/path/to/onlysnarf', // Update this
            ...config
        };

        this.activeJobs = new Map();
    }

    async validateParams(params) {
        const { action, username } = params;

        if (!['post', 'message', 'poll', 'discount', 'schedule'].includes(action)) {
            throw new Error('Invalid action. Must be post, message, poll, discount, or schedule');
        }

        if (!username) {
            throw new Error('Username required for OnlyFans operations');
        }

        // Action-specific validation
        if (action === 'post' && !params.text && !params.media) {
            throw new Error('Text or media required for post action');
        }

        if (action === 'message' && !params.recipient && !params.text) {
            throw new Error('Recipient and text required for message action');
        }

        if (action === 'poll' && !params.question) {
            throw new Error('Question required for poll action');
        }

        if (action === 'discount' && !params.code) {
            throw new Error('Discount code required for discount action');
        }

        return true;
    }

    async estimateResourceUsage(params) {
        const { action } = params;

        let estimatedTimeMinutes = 5; // base browser automation time

        // Action-specific time estimates
        switch (action) {
            case 'post':
                estimatedTimeMinutes = 8;
                break;
            case 'message':
                estimatedTimeMinutes = 6;
                break;
            case 'poll':
                estimatedTimeMinutes = 7;
                break;
            case 'discount':
                estimatedTimeMinutes = 4;
                break;
            case 'schedule':
                estimatedTimeMinutes = 3;
                break;
        }

        return {
            browserUsage: 'Required',
            estimatedTimeMinutes,
            costEstimate: 0.05 // Minimal cost for automation
        };
    }

    async executeAction(params, progressCallback = null) {
        await this.validateParams(params);

        const jobId = `onlysnarf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job = {
            id: jobId,
            params,
            status: 'queued',
            progress: 0,
            startTime: new Date()
        };

        this.activeJobs.set(jobId, job);

        try {
            job.status = 'running';
            let result;

            if (progressCallback) progressCallback(10, 'Initializing OnlySnarf automation...');

            switch (params.action) {
                case 'post':
                    result = await this._createPost(params, progressCallback);
                    break;
                case 'message':
                    result = await this._sendMessage(params, progressCallback);
                    break;
                case 'poll':
                    result = await this._createPoll(params, progressCallback);
                    break;
                case 'discount':
                    result = await this._applyDiscount(params, progressCallback);
                    break;
                case 'schedule':
                    result = await this._scheduleContent(params, progressCallback);
                    break;
                default:
                    throw new Error(`Unsupported action: ${params.action}`);
            }

            job.status = 'completed';
            job.progress = 100;
            job.result = result;

            return {
                jobId,
                success: true,
                result,
                metadata: {
                    executionTime: Date.now() - job.startTime.getTime(),
                    action: params.action,
                    username: params.username
                }
            };

        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            throw error;
        } finally {
            setTimeout(() => {
                this.activeJobs.delete(jobId);
            }, 300000);
        }
    }

    async _createPost(params, progressCallback) {
        const { text, media, username } = params;

        if (progressCallback) progressCallback(30, 'Preparing post content...');

        const args = ['snarf', '-u', username];

        if (text) {
            args.push('-text', text);
        }

        if (media) {
            if (Array.isArray(media)) {
                media.forEach(file => args.push(file));
            } else {
                args.push(media);
            }
        }

        return this._runSnarfCommand(args, progressCallback, 'Creating post...');
    }

    async _sendMessage(params, progressCallback) {
        const { recipient, text, media, username } = params;

        if (progressCallback) progressCallback(30, 'Preparing message...');

        const args = ['snarf', '-u', username, '-message'];

        if (recipient === 'all') {
            args.push('-users', 'all');
        } else {
            args.push('-user', recipient);
        }

        if (text) {
            args.push('-text', text);
        }

        if (media) {
            args.push('-media', media);
        }

        return this._runSnarfCommand(args, progressCallback, 'Sending message...');
    }

    async _createPoll(params, progressCallback) {
        const { question, options, duration, username } = params;

        if (progressCallback) progressCallback(30, 'Preparing poll...');

        const args = ['snarf', '-u', username, '-poll'];

        if (question) {
            args.push('-question', question);
        }

        if (options && Array.isArray(options)) {
            options.forEach(option => args.push('-option', option));
        }

        if (duration) {
            args.push('-duration', duration.toString());
        }

        return this._runSnarfCommand(args, progressCallback, 'Creating poll...');
    }

    async _applyDiscount(params, progressCallback) {
        const { code, percentage, username } = params;

        if (progressCallback) progressCallback(30, 'Applying discount...');

        const args = ['snarf', '-u', username, '-discount'];

        if (code) {
            args.push('-code', code);
        }

        if (percentage) {
            args.push('-percentage', percentage.toString());
        }

        return this._runSnarfCommand(args, progressCallback, 'Applying discount code...');
    }

    async _scheduleContent(params, progressCallback) {
        const { scheduleTime, content, username } = params;

        if (progressCallback) progressCallback(30, 'Scheduling content...');

        const args = ['snarf', '-u', username, '-schedule'];

        if (scheduleTime) {
            args.push('-time', scheduleTime);
        }

        if (content) {
            args.push('-content', content);
        }

        return this._runSnarfCommand(args, progressCallback, 'Scheduling content...');
    }

    async _runSnarfCommand(args, progressCallback, statusMessage) {
        return new Promise((resolve, reject) => {
            if (progressCallback) progressCallback(50, statusMessage);

            const process = spawn(this.config.pythonPath, args, {
                cwd: this.config.onlysnarfPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
                // Parse progress from snarf output if available
                if (stdout.includes('Success') || stdout.includes('Posted')) {
                    if (progressCallback) progressCallback(80, 'Operation successful...');
                }
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    if (progressCallback) progressCallback(90, 'Finalizing...');

                    resolve({
                        success: true,
                        output: stdout,
                        exitCode: code,
                        url: this._extractUrl(stdout) // Extract post/message URL if available
                    });
                } else {
                    reject(new Error(`Snarf command failed: ${stderr || stdout}`));
                }
            });

            process.on('error', (error) => {
                reject(new Error(`Process error: ${error.message}`));
            });

            // Timeout
            setTimeout(() => {
                process.kill();
                reject(new Error('Operation timeout'));
            }, this.config.timeoutMinutes * 60000);
        });
    }

    _extractUrl(output) {
        // Try to extract URL from snarf output
        const urlMatch = output.match(/https?:\/\/[^\s]+/);
        return urlMatch ? urlMatch[0] : null;
    }

    async getJobStatus(jobId) {
        const job = this.activeJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        return {
            id: job.id,
            status: job.status,
            progress: job.progress,
            action: job.params.action,
            startTime: job.startTime,
            error: job.error
        };
    }

    async cancelJob(jobId) {
        const job = this.activeJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        // Note: OnlySnarf doesn't have built-in cancellation, but we can mark as cancelled
        job.status = 'cancelled';
        this.activeJobs.delete(jobId);

        return { success: true };
    }
}

module.exports = { OnlySnarfAutomationService };