/*
 * Wan2GP Video Generation Automation Service
 * AI-powered video generation from text prompts and images
 *
 * Capabilities:
 * - Text-to-video generation
 * - Image-to-video generation
 * - Video editing and postprocessing
 * - Multiple model profiles (Wan, Hunyuan, etc.)
 * - Quality and performance optimization
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class Wan2GPVideoGenerationService {
    constructor(config = {}) {
        this.config = {
            maxConcurrentJobs: config.maxConcurrentJobs || 2,
            timeoutMinutes: config.timeoutMinutes || 30,
            outputDir: config.outputDir || './generated_videos',
            gpuMemoryLimit: config.gpuMemoryLimit || '8GB',
            ...config
        };

        this.activeJobs = new Map();
        this.jobQueue = [];
    }

    async validateParams(params) {
        const { type, prompt, model, steps } = params;

        if (!['text2video', 'image2video'].includes(type)) {
            throw new Error('Invalid generation type. Must be text2video or image2video');
        }

        if (type === 'text2video' && !prompt) {
            throw new Error('Prompt required for text-to-video generation');
        }

        if (type === 'image2video' && !params.inputImage) {
            throw new Error('Input image required for image-to-video generation');
        }

        if (!model || !this.isValidModel(model)) {
            throw new Error('Invalid or unsupported model specified');
        }

        if (steps < 1 || steps > 50) {
            throw new Error('Steps must be between 1 and 50');
        }

        return true;
    }

    isValidModel(model) {
        const validModels = [
            'wan_2_2', 'wan_2_2_5B', 'wan_2_2_ovi', 'wan_alpha',
            'wan_chrono_edit', 'wan_i2v', 'hunyuan_1_5', 'qwen', 'flux'
        ];
        return validModels.includes(model);
    }

    async estimateResourceUsage(params) {
        const { model, steps, duration } = params;

        let gpuMemoryGB = 4; // base
        let estimatedTimeMinutes = 5;

        // Model-specific estimates
        switch (model) {
            case 'wan_2_2_5B':
                gpuMemoryGB = 12;
                estimatedTimeMinutes = steps * 2;
                break;
            case 'wan_2_2':
                gpuMemoryGB = 8;
                estimatedTimeMinutes = steps * 1.5;
                break;
            case 'hunyuan_1_5':
                gpuMemoryGB = 10;
                estimatedTimeMinutes = steps * 1.8;
                break;
            default:
                estimatedTimeMinutes = steps * 1.2;
        }

        // Adjust for duration
        if (duration && duration > 5) {
            estimatedTimeMinutes *= (duration / 5);
        }

        return {
            gpuMemoryGB,
            estimatedTimeMinutes,
            costEstimate: Math.ceil(estimatedTimeMinutes / 60 * 0.5) // $0.50 per GPU hour
        };
    }

    async generateVideo(params, progressCallback = null) {
        await this.validateParams(params);

        const jobId = `wan2gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job = {
            id: jobId,
            params,
            status: 'queued',
            progress: 0,
            startTime: new Date(),
            estimatedCompletion: null
        };

        this.activeJobs.set(jobId, job);
        this.jobQueue.push(job);

        try {
            const resources = await this.estimateResourceUsage(params);
            job.estimatedCompletion = new Date(Date.now() + resources.estimatedTimeMinutes * 60000);

            // Process job
            job.status = 'running';
            const result = await this._executeGeneration(job, progressCallback);

            job.status = 'completed';
            job.progress = 100;
            job.result = result;

            return {
                jobId,
                success: true,
                result,
                metadata: {
                    generationTime: Date.now() - job.startTime.getTime(),
                    model: params.model,
                    prompt: params.prompt,
                    outputPath: result.outputPath
                }
            };

        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            throw error;
        } finally {
            // Cleanup
            setTimeout(() => {
                this.activeJobs.delete(jobId);
            }, 300000); // Keep for 5 minutes
        }
    }

    async _executeGeneration(job, progressCallback) {
        const { params } = job;
        const outputDir = path.join(this.config.outputDir, job.id);
        await fs.mkdir(outputDir, { recursive: true });

        const command = 'python';
        const args = [
            'wgp.py',
            '--model', params.model,
            '--steps', params.steps.toString(),
            '--output', outputDir
        ];

        if (params.type === 'text2video') {
            args.push('--prompt', params.prompt);
        } else {
            args.push('--input-image', params.inputImage);
        }

        if (params.duration) {
            args.push('--duration', params.duration.toString());
        }

        return new Promise((resolve, reject) => {
            const process = spawn(command, args, {
                cwd: path.dirname(require.resolve('wan2gp')),
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
                // Parse progress from output
                const progressMatch = stdout.match(/Progress: (\d+)%/);
                if (progressMatch) {
                    job.progress = parseInt(progressMatch[1]);
                    if (progressCallback) {
                        progressCallback(job.progress, `Generating video... ${job.progress}%`);
                    }
                }
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', async (code) => {
                if (code === 0) {
                    // Find generated video file
                    const files = await fs.readdir(outputDir);
                    const videoFile = files.find(f => f.endsWith('.mp4'));

                    if (!videoFile) {
                        reject(new Error('No video file generated'));
                        return;
                    }

                    resolve({
                        outputPath: path.join(outputDir, videoFile),
                        metadata: {
                            size: (await fs.stat(path.join(outputDir, videoFile))).size,
                            format: 'mp4'
                        }
                    });
                } else {
                    reject(new Error(`Generation failed: ${stderr}`));
                }
            });

            process.on('error', (error) => {
                reject(new Error(`Process error: ${error.message}`));
            });

            // Timeout
            setTimeout(() => {
                process.kill();
                reject(new Error('Generation timeout'));
            }, this.config.timeoutMinutes * 60000);
        });
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
            startTime: job.startTime,
            estimatedCompletion: job.estimatedCompletion,
            error: job.error
        };
    }

    async cancelJob(jobId) {
        const job = this.activeJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        if (job.process) {
            job.process.kill();
        }

        job.status = 'cancelled';
        this.activeJobs.delete(jobId);

        return { success: true };
    }
}

module.exports = { Wan2GPVideoGenerationService };