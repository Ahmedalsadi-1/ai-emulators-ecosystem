/**
 * Centralized logging utility using pino
 */

import pino from 'pino';
import { LoggingConfiguration } from '../interfaces';

let globalLogger: pino.Logger;

export class Logger {
  private logger: pino.Logger;
  private context: string;

  constructor(context: string) {
    this.context = context;
    this.logger = getLogger().child({ context });
  }

  debug(message: string, data?: Record<string, any>): void {
    this.logger.debug(data || {}, message);
  }

  info(message: string, data?: Record<string, any>): void {
    this.logger.info(data || {}, message);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.logger.warn(data || {}, message);
  }

  error(message: string, data?: Record<string, any>): void {
    this.logger.error(data || {}, message);
  }
}

export function initializeLogger(config: LoggingConfiguration): pino.Logger {
  const transports: any[] = [];

  // Console transport
  const consoleTransport = config.outputs.find(o => o.type === 'console');
  if (consoleTransport) {
    transports.push({
      targets: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });
  }

  // File transport
  const fileTransport = config.outputs.find(o => o.type === 'file');
  if (fileTransport && fileTransport.path) {
    transports.push({
      targets: 'pino/file',
      options: { destination: fileTransport.path },
    });
  }

  globalLogger = pino(
    {
      level: config.level,
      base: {
        service: 'agent-manager',
        environment: process.env.NODE_ENV || 'development',
      },
    },
    transports.length > 0 ? pino.transport({ targets: transports }) : undefined
  );

  return globalLogger;
}

export function getLogger(): pino.Logger {
  if (!globalLogger) {
    globalLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      base: {
        service: 'agent-manager',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  }
  return globalLogger;
}

export function createChildLogger(context: Record<string, any>): pino.Logger {
  return getLogger().child(context);
}

export default getLogger();
