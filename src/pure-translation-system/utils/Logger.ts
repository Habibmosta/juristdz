/**
 * Logger - Comprehensive logging system for Pure Translation System
 * 
 * Provides structured logging with different levels and contexts
 * for monitoring translation system performance and issues.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  source: string;
  requestId?: string;
  userId?: string;
  translationId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  maxFileSize: number;
  maxFiles: number;
  remoteEndpoint?: string;
}

export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  debug(message: string, context?: any, source = 'PureTranslationSystem'): void {
    this.log(LogLevel.DEBUG, message, context, source);
  }

  info(message: string, context?: any, source = 'PureTranslationSystem'): void {
    this.log(LogLevel.INFO, message, context, source);
  }

  warn(message: string, context?: any, source = 'PureTranslationSystem'): void {
    this.log(LogLevel.WARN, message, context, source);
  }

  error(message: string, context?: any, source = 'PureTranslationSystem'): void {
    this.log(LogLevel.ERROR, message, context, source);
  }

  critical(message: string, context?: any, source = 'PureTranslationSystem'): void {
    this.log(LogLevel.CRITICAL, message, context, source);
  }

  private log(level: LogLevel, message: string, context?: any, source = 'PureTranslationSystem'): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      source,
      requestId: this.getRequestId(),
      userId: this.getUserId(),
      translationId: this.getTranslationId()
    };

    this.addToBuffer(entry);

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableFile) {
      this.logToFile(entry);
    }

    if (this.config.enableRemote) {
      this.logToRemote(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const configLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= configLevelIndex;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    const logMessage = `[${timestamp}] ${entry.level.toUpperCase()} [${entry.source}] ${entry.message}${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 CRITICAL: ${logMessage}`);
        break;
    }
  }

  private logToFile(entry: LogEntry): void {
    // File logging implementation would go here
    // For now, we'll just store in memory buffer
  }

  private logToRemote(entry: LogEntry): void {
    // Remote logging implementation would go here
    // Could send to external monitoring service
  }

  private getRequestId(): string | undefined {
    // Implementation to get current request ID from context
    return undefined;
  }

  private getUserId(): string | undefined {
    // Implementation to get current user ID from context
    return undefined;
  }

  private getTranslationId(): string | undefined {
    // Implementation to get current translation ID from context
    return undefined;
  }

  getRecentLogs(count = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  getLogsByLevel(level: LogLevel, count = 100): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.level === level)
      .slice(-count);
  }

  clearBuffer(): void {
    this.logBuffer = [];
  }

  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Default logger instance
export const defaultLogger = new Logger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  enableRemote: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
});