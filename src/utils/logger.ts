export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  component?: string;
}

class Logger {
  private static instance: Logger;
  private currentLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {
    // Set log level based on environment
    if (import.meta.env.PROD) {
      this.currentLevel = LogLevel.ERROR; // Only errors in production
    } else {
      this.currentLevel = LogLevel.DEBUG; // All logs in development
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, component?: string): string {
    const timestamp = new Date().toISOString();
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'] as const;
    const levelName = levelNames[level];
    const componentStr = component ? `[${component}]` : '';
    return `${timestamp} ${levelName} ${componentStr} ${message}`;
  }

  private addLog(level: LogLevel, message: string, data?: unknown, component?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (this.shouldLog(level)) {
      const formattedMessage = this.formatMessage(level, message, component);

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data);
          break;
        case LogLevel.INFO:
          console.log(formattedMessage, data);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data);
          break;
      }
    }
  }

  debug(message: string, data?: unknown, component?: string): void {
    this.addLog(LogLevel.DEBUG, message, data, component);
  }

  info(message: string, data?: unknown, component?: string): void {
    this.addLog(LogLevel.INFO, message, data, component);
  }

  warn(message: string, data?: unknown, component?: string): void {
    this.addLog(LogLevel.WARN, message, data, component);
  }

  error(message: string, data?: unknown, component?: string): void {
    this.addLog(LogLevel.ERROR, message, data, component);
  }

  // Performance logging
  performance(operation: string, duration: number, component?: string): void {
    const message = `Operation completed in ${duration.toFixed(2)}ms`;
    this.info(message, { operation, duration }, component);
  }

  // Slow render warning
  slowRender(componentName: string, renderTime: number, threshold: number): void {
    const message = `Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`;
    this.warn(message, { componentName, renderTime, threshold }, 'Performance');
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance and convenience functions
export const logger = Logger.getInstance();

export const log = {
  debug: (message: string, data?: unknown, component?: string) => logger.debug(message, data, component),
  info: (message: string, data?: unknown, component?: string) => logger.info(message, data, component),
  warn: (message: string, data?: unknown, component?: string) => logger.warn(message, data, component),
  error: (message: string, data?: unknown, component?: string) => logger.error(message, data, component),
  performance: (operation: string, duration: number, component?: string) => logger.performance(operation, duration, component),
  slowRender: (componentName: string, renderTime: number, threshold: number) => logger.slowRender(componentName, renderTime, threshold)
};

export default logger;