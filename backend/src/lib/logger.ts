export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private format(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format(LogLevel.DEBUG, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    console.log(this.format(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.format(LogLevel.WARN, message, meta));
  }

  error(message: string, error?: any): void {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.format(LogLevel.ERROR, message, errorDetails));
  }
}

export const logger = new Logger();
