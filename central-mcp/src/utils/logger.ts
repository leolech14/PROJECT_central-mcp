/**
 * Logger Utility
 * ==============
 *
 * Simple logging for MCP server with timestamp and level.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    const baseMsg = `[${timestamp}] ${levelStr} ${message}`;

    if (data !== undefined) {
      return `${baseMsg}\n${JSON.stringify(data, null, 2)}`;
    }

    return baseMsg;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        console.error(this.formatMessage('error', message, {
          errorMessage: error.message,
          stack: error.stack
        }));
      } else {
        console.error(this.formatMessage('error', message, error));
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Singleton instance
export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);
