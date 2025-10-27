import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { format } from 'winston';

// Custom format for console output
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, context, ...meta }) => {
    const contextStr = context ? `[${context}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

export const loggerConfig: WinstonModuleOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'assistant-aggregator-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for combined logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for external API logs
    new winston.transports.File({
      filename: 'logs/external-api.log',
      level: 'debug',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
  
  // Exception handling
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format: fileFormat,
    }),
  ],
  
  // Rejection handling
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format: fileFormat,
    }),
  ],
};

// Create a custom logger instance for external API logging
export const externalApiLogger = winston.createLogger({
  level: 'debug',
  format: fileFormat,
  defaultMeta: { service: 'external-api' },
  transports: [
    new winston.transports.File({
      filename: 'logs/external-api.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Create a custom logger instance for database operations
export const databaseLogger = winston.createLogger({
  level: 'debug',
  format: fileFormat,
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.File({
      filename: 'logs/database.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});
