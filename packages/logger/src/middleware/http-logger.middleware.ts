import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { Logger } from 'winston';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.info(`Incoming request`, {
      method,
      url: originalUrl,
      ip,
      userAgent,
    });

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

      this.logger[logLevel](`Request completed`, {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip,
      });
    });

    next();
  }
}