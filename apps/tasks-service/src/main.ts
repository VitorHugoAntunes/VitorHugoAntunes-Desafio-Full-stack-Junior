import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Env } from './config/env';
import { createLogger, NestWinstonLogger } from '@repo/logger';

async function bootstrap() {
  const logger = createLogger('tasks-service');
  const nestLogger = new NestWinstonLogger(logger);
  
  const app = await NestFactory.create(AppModule, {
    logger: nestLogger,
  });
  
  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  
  const rabbitmqUrl = configService.get('RABBITMQ_URL', { infer: true });
  const port = configService.get('PORT', { infer: true });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'tasks_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
  
  logger.info(`🚀 Tasks Service is running on: http://localhost:${port}`);
  logger.info(`📡 RabbitMQ connected: ${rabbitmqUrl}`);
}

bootstrap().catch((error) => {
  const logger = createLogger('tasks-service');
  logger.error('Failed to start Tasks Service', { error: error.message, stack: error.stack });
  process.exit(1);
});