import DailyRotateFile from 'winston-daily-rotate-file';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

// Custom format for console
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

const fileFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const logObject = {
    timestamp,
    level,
    message,
    ...metadata,
  };
  
  return JSON.stringify(logObject);
});

function ensureLogDirectory(logDir: string): boolean {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
    }

    const testFile = path.join(logDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return true;
  } catch (error) {
    console.warn(`Cannot create/write to log directory: ${logDir}`, error.message);
    return false;
  }
}

export const createLogger = (serviceName: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  const transports: winston.transport[] = [];

  if (!isTest) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          consoleFormat
        ),
        level: isDevelopment ? 'debug' : 'info',
      })
    );
  }

  if ((isProduction || isDevelopment) && !isTest) {
    const logDir = path.resolve(process.cwd(), 'logs');
    
    if (ensureLogDirectory(logDir)) {
      try {
        transports.push(
          new DailyRotateFile({
            filename: path.join(logDir, `${serviceName}-error-%DATE%.log`),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d',
            maxSize: '20m',
            format: winston.format.combine(
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.errors({ stack: true }),
              fileFormat
            ),
          })
        );

        transports.push(
          new DailyRotateFile({
            filename: path.join(logDir, `${serviceName}-combined-%DATE%.log`),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            maxSize: '20m',
            format: winston.format.combine(
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.errors({ stack: true }),
              fileFormat
            ),
          })
        );

      } catch (error) {
        console.warn('Failed to initialize file logging, continuing with console only', error.message);
      }
    } else {
      console.warn('File logging disabled - using console only');
    }
  }

  const logger = winston.createLogger({
    level: isDevelopment ? 'debug' : isTest ? 'error' : 'info',
    defaultMeta: { service: serviceName },
    transports,
    exitOnError: false,
  });

  return logger;
};

export default createLogger;