import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

export class NestWinstonLogger implements LoggerService {
  constructor(private readonly logger: winston.Logger) {}

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(this.formatMessage(message, optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    const [trace, context] = optionalParams;
    if (trace && typeof trace === 'string') {
      this.logger.error(this.formatMessage(message, [context]), { stack: trace });
    } else {
      this.logger.error(this.formatMessage(message, optionalParams));
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(this.formatMessage(message, optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(this.formatMessage(message, optionalParams));
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logger.debug(this.formatMessage(message, optionalParams));
  }

  private formatMessage(message: any, optionalParams: any[]): string {
    const context = optionalParams.length > 0 ? optionalParams[optionalParams.length - 1] : '';
    
    if (typeof message === 'object') {
      message = JSON.stringify(message);
    }

    if (context) {
      return `[${context}] ${message}`;
    }

    return message;
  }
}