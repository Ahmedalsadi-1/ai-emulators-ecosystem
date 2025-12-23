/*
 * Kali Desktop Automation Service
 * Handles security testing and command execution in Kali Linux environment
 */

const APIError = require('../../../api/APIError');
const BaseService = require('../../BaseService');
const { TypedValue } = require('../../drivers/meta/Runtime');
const { Context } = require('../../../util/context');

const DEFAULT_TIMEOUT_MS = 300 * 1000; // 5 minutes for security operations
const POLL_INTERVAL_MS = 5_000;
const MAX_RETRIES = 2; // Fewer retries for security operations

class KaliDesktopAutomationService extends BaseService {
    static MODULES = {
        axios: require('axios'),
    };

    _construct() {
        this.automationTypes = {
            'security-scan': {
                defaultUsageKey: 'kalidesktop:security-scan:default',
            },
            'command-execution': {
                defaultUsageKey: 'kalidesktop:command-execution:default',
            },
            'penetration-test': {
                defaultUsageKey: 'kalidesktop:penetration-test:default',
            },
        };
    }

    static IMPLEMENTS = {
        ['puter-kalidesktop-automation']: {
            async automate(params) {
                return await this.executeAutomation(params);
            },
        },
    };

    async executeAutomation(params) {
        const {
            type,
            commands,
            target,
            options,
            test_mode,
        } = params ?? {};

        // Validate required parameters
        if (!type || !commands || !Array.isArray(commands)) {
            throw APIError.create('field_invalid', null, {
                key: 'params',
                expected: 'type and commands array',
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
            }, 'Test mode: Kali Desktop automation would execute successfully');
        }

        // Check usage limits (security operations are resource-intensive)
        const usageKey = automationConfig.defaultUsageKey;
        const estimatedUnits = this.#calculateComplexity(commands, type);
        const actor = Context.get('actor');
        const usageAllowed = await this.meteringService.hasEnoughCreditsFor(actor, usageKey, estimatedUnits);
        if (!usageAllowed) {
            throw APIError.create('insufficient_funds');
        }

        // Execute automation with limited retry logic (security operations are sensitive)
        let result;
        let lastError;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                result = await this.#executeCommands(commands, type, target, options);
                break; // Success, exit retry loop
            } catch (error) {
                lastError = error;
                this.logger.warn(`Kali automation attempt ${attempt + 1} failed:`, error.message);

                if (attempt < MAX_RETRIES - 1) {
                    await this.#delay(POLL_INTERVAL_MS * (attempt + 1)); // Exponential backoff
                }
            }
        }

        if (!result) {
            throw new Error(`Kali Desktop automation failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
        }

        // Meter the usage
        this.meteringService.incrementUsage(actor, usageKey, result.actualUnits);

        return new TypedValue({
            $: 'object',
            content_type: 'application/json',
        }, {
            success: true,
            type,
            commandsExecuted: result.commandsCompleted,
            duration: result.duration,
            securityReport: result.securityReport,
            vulnerabilities: result.vulnerabilities,
            results: result.results,
        });
    }

    async #executeCommands(commands, type, target, options = {}) {
        const startTime = Date.now();
        const results = [];

        try {
            for (const command of commands) {
                // Check for timeout
                if (Date.now() - startTime > DEFAULT_TIMEOUT_MS) {
                    throw new Error('Kali automation timeout exceeded');
                }

                const result = await this.#executeSingleCommand(command, type, target, options);
                results.push(result);

                // Optional delay between commands (security operations need time)
                const delay = options.delayBetweenCommands || 2000;
                await this.#delay(delay);
            }

            // Generate security report if applicable
            let securityReport = null;
            let vulnerabilities = null;
            if (type === 'security-scan' || type === 'penetration-test') {
                securityReport = await this.#generateSecurityReport(results, target);
                vulnerabilities = this.#analyzeVulnerabilities(results);
            }

            return {
                commandsCompleted: results.length,
                duration: Date.now() - startTime,
                securityReport,
                vulnerabilities,
                results,
                actualUnits: this.#calculateComplexity(commands, type),
            };

        } catch (error) {
            // Generate error report
            let errorReport = null;
            try {
                errorReport = await this.#generateErrorReport(results, error, target);
            } catch (reportError) {
                this.logger.warn('Failed to generate error report:', reportError.message);
            }

            throw {
                ...error,
                commandsCompleted: results.length,
                duration: Date.now() - startTime,
                errorReport,
            };
        }
    }

    async #executeSingleCommand(command, type, target, options) {
        const { tool, args = [], timeout = 60000, expectOutput = true } = command;

        // Map common security tools to their full commands
        const toolMap = {
            nmap: 'nmap',
            nikto: 'nikto',
            sqlmap: 'sqlmap',
            metasploit: 'msfconsole',
            burp: 'burpsuite',
            wireshark: 'wireshark',
            john: 'john',
            hashcat: 'hashcat',
            aircrack: 'aircrack-ng',
            dirb: 'dirb',
            gobuster: 'gobuster',
            hydra: 'hydra',
            // Add more security tools as needed
        };

        const fullCommand = toolMap[tool] || tool;
        const commandString = `${fullCommand} ${args.join(' ')}`.trim();

        // Execute via Kali MCP server
        const response = await this.modules.axios.post(`${target.endpoint}/execute`, {
            command: commandString,
            timeout,
            expect_output: expectOutput,
        }, {
            headers: {
                'Authorization': `Bearer ${target.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: timeout + 10000, // Add buffer for network latency
        });

        return {
            tool,
            command: commandString,
            exitCode: response.data.exit_code,
            output: response.data.output,
            error: response.data.error,
            duration: response.data.duration,
            timestamp: new Date().toISOString(),
            success: response.data.exit_code === 0,
        };
    }

    async #generateSecurityReport(results, target) {
        // Analyze results to generate a security report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalCommands: results.length,
                successfulCommands: results.filter(r => r.success).length,
                failedCommands: results.filter(r => !r.success).length,
            },
            findings: [],
            recommendations: [],
        };

        // Analyze outputs for security findings
        for (const result of results) {
            if (result.success && result.output) {
                const findings = this.#extractSecurityFindings(result.tool, result.output);
                report.findings.push(...findings);
            }
        }

        // Generate recommendations based on findings
        report.recommendations = this.#generateRecommendations(report.findings);

        return report;
    }

    #analyzeVulnerabilities(results) {
        const vulnerabilities = [];

        for (const result of results) {
            if (result.output) {
                // Look for common vulnerability patterns
                const vulnPatterns = [
                    { pattern: /vulnerable|vulnerability/gi, severity: 'high' },
                    { pattern: /weak|insecure/gi, severity: 'medium' },
                    { pattern: /exposed|leaked/gi, severity: 'high' },
                    { pattern: /unpatched|outdated/gi, severity: 'medium' },
                ];

                for (const { pattern, severity } of vulnPatterns) {
                    if (pattern.test(result.output)) {
                        vulnerabilities.push({
                            tool: result.tool,
                            severity,
                            description: `Potential ${severity} security issue detected`,
                            output: result.output.substring(0, 500), // Truncate for brevity
                            timestamp: result.timestamp,
                        });
                    }
                }
            }
        }

        return vulnerabilities;
    }

    #extractSecurityFindings(tool, output) {
        const findings = [];

        // Tool-specific finding extraction
        switch (tool) {
            case 'nmap':
                // Extract open ports and services
                const portMatches = output.match(/(\d+)\/(tcp|udp)\s+(\w+)\s+(.+)/g);
                if (portMatches) {
                    findings.push(...portMatches.map(match => ({
                        type: 'open_port',
                        details: match,
                        severity: 'info',
                    })));
                }
                break;

            case 'nikto':
                // Extract web server vulnerabilities
                const vulnMatches = output.match(/OSVDB-\d+:\s+(.+)/g);
                if (vulnMatches) {
                    findings.push(...vulnMatches.map(match => ({
                        type: 'web_vulnerability',
                        details: match,
                        severity: 'high',
                    })));
                }
                break;

            // Add more tool-specific extractors as needed
        }

        return findings;
    }

    #generateRecommendations(findings) {
        const recommendations = [];

        const findingTypes = findings.map(f => f.type);
        const uniqueTypes = [...new Set(findingTypes)];

        for (const type of uniqueTypes) {
            switch (type) {
                case 'open_port':
                    recommendations.push('Consider closing unnecessary open ports');
                    recommendations.push('Implement firewall rules to restrict access');
                    break;
                case 'web_vulnerability':
                    recommendations.push('Update web server and apply security patches');
                    recommendations.push('Implement Web Application Firewall (WAF)');
                    break;
            }
        }

        return [...new Set(recommendations)]; // Remove duplicates
    }

    async #generateErrorReport(results, error, target) {
        return {
            timestamp: new Date().toISOString(),
            error: error.message,
            completedCommands: results.length,
            lastSuccessfulCommand: results[results.length - 1] || null,
        };
    }

    #calculateComplexity(commands, type) {
        let complexity = 0;

        for (const command of commands) {
            // Base complexity for command execution
            complexity += 5;

            // Tool-specific complexity
            switch (command.tool) {
                case 'nmap':
                    complexity += 3; // Network scanning is resource intensive
                    break;
                case 'metasploit':
                    complexity += 10; // Exploitation framework is very complex
                    break;
                case 'sqlmap':
                    complexity += 8; // SQL injection testing
                    break;
                case 'john':
                case 'hashcat':
                    complexity += 15; // Password cracking is extremely resource intensive
                    break;
                default:
                    complexity += 2;
            }

            // Timeout affects complexity
            if (command.timeout > 300000) { // 5 minutes
                complexity += 5;
            } else if (command.timeout > 60000) { // 1 minute
                complexity += 2;
            }
        }

        // Type multiplier
        const typeMultiplier = {
            'security-scan': 1.5,
            'command-execution': 1.0,
            'penetration-test': 2.0,
        };

        complexity *= typeMultiplier[type] || 1.0;

        return Math.max(1, Math.ceil(complexity));
    }

    async #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = {
    KaliDesktopAutomationService,
};