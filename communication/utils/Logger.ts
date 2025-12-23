/**
 * Logger Utility
 * Provides structured logging for the communication system
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private component: string;
  private minLevel: LogLevel = LogLevel.INFO;

  constructor(component: string, minLevel?: LogLevel) {
    this.component = component;
    if (minLevel) {
      this.minLevel = minLevel;
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any, data?: any): void {
    const logData = data || {};
    if (error instanceof Error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else if (error) {
      logData.error = error;
    }

    this.log(LogLevel.ERROR, message, logData);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      component: this.component,
      message,
      data
    };

    // Format log entry
    const formatted = this.formatLogEntry(entry);

    // Output based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }

    // Store in memory for debugging (optional)
    this.storeLogEntry(entry);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const component = entry.component.padEnd(20);

    let formatted = `[${timestamp}] ${level} [${component}] ${entry.message}`;

    if (entry.data) {
      formatted += ` ${JSON.stringify(entry.data, null, 0)}`;
    }

    return formatted;
  }

  private storeLogEntry(entry: LogEntry): void {
    // In production, you might want to send to a logging service
    // For now, just keep in memory for debugging
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const logs = JSON.parse(localStorage.getItem('communication_logs') || '[]');
        logs.push(entry);

        // Keep only last 100 entries
        if (logs.length > 100) {
          logs.shift();
        }

        localStorage.setItem('communication_logs', JSON.stringify(logs));
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Get stored logs (for debugging)
   */
  static getStoredLogs(): LogEntry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return JSON.parse(localStorage.getItem('communication_logs') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Clear stored logs
   */
  static clearStoredLogs(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('communication_logs');
    }
  }

  /**
   * Create child logger
   */
  child(component: string): Logger {
    return new Logger(`${this.component}:${component}`, this.minLevel);
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}