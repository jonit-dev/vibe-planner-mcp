import { singleton } from 'tsyringe';
import winston, { format, transports } from 'winston';

@singleton()
export class LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const { combine, timestamp, printf, colorize, errors } = format;
    const isDevelopment = process.env.NODE_ENV === 'development';

    const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
      return `${ts} [${level}]: ${stack || message}`;
    });

    this.logger = winston.createLogger({
      level: isDevelopment ? process.env.LOG_LEVEL || 'info' : 'warn', // Only show info in development
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // This will automatically log the stack trace if an error object is passed
        logFormat
      ),
      transports: [
        new transports.Console({
          stderrLevels: ['error'], // Ensure errors go to stderr
        }),
        // Future: Add file transport or other transports as needed
        // new transports.File({ filename: 'error.log', level: 'error' }),
        // new transports.File({ filename: 'combined.log' }),
      ],
      exceptionHandlers: [
        // Log unhandled exceptions to console and/or file
        new transports.Console(),
        // new transports.File({ filename: 'exceptions.log' })
      ],
      rejectionHandlers: [
        // Log unhandled promise rejections
        new transports.Console(),
        // new transports.File({ filename: 'rejections.log' })
      ],
    });

    if (isDevelopment) {
      this.logger.info('LoggerService initialized in development mode.');
    }
  }

  public debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, meta);
  }

  public info(message: string, ...meta: any[]): void {
    this.logger.info(message, meta);
  }

  public warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, meta);
  }

  // The error method can accept an Error object directly
  public error(message: string | Error, ...meta: any[]): void {
    if (message instanceof Error) {
      this.logger.error(message.message, { error: message, ...meta });
    } else {
      this.logger.error(message, meta);
    }
  }
}
