/**
 * Unified Agent Manager - Main Entry Point
 * Integrates Kilo CLI and OpenCode with agent-skills-system
 */

// Export all interfaces
export * from './interfaces';

// Export services
export * from './services';

// Export utilities
export { Logger, getLogger, createChildLogger, initializeLogger } from './utils/logger';

// Version
export const VERSION = '1.0.0';
