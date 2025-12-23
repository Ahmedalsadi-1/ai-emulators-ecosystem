/**
 * Services - Core service implementations
 */

export { CLIInstallerService, type CLIInstallationConfig, type CLIInstallationResult, type CLIVerificationResult } from './cli-installer.service';
export { default as cliInstallerService } from './cli-installer.service';

export { AuthenticationService, type AuthenticationConfig } from './authentication.service';
export { default as authenticationService } from './authentication.service';

export { ConfigurationService } from './configuration.service';
export { default as configurationService } from './configuration.service';

export { CloudSyncService, type CloudBackup, type CloudRestore, type CloudConflictResolution } from './cloud-sync.service';
export { default as cloudSyncService } from './cloud-sync.service';

export { ParallelExecutorService, type ExecutionTask, type ResourceAllocation, type ExecutionMetrics } from './parallel-executor.service';
export { default as parallelExecutorService } from './parallel-executor.service';

export { TerminalWorkflowService, type TerminalSession, type WorkflowStep, type TerminalOutput } from './terminal-workflow.service';
export { default as terminalWorkflowService } from './terminal-workflow.service';

export { MCPIntegrationService, type MCPServer, type MCPTool, type MCPToolExecution } from './mcp-integration.service';
export { default as mcpIntegrationService } from './mcp-integration.service';

export { DeploymentService, type DeploymentConfig, type DeploymentStatus, type RollbackConfig } from './deployment.service';
export { default as deploymentService } from './deployment.service';
