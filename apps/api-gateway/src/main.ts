import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Env } from './env';
import { ClassValidationPipe } from './common/pipes/class-validation.pipe';
import { SwaggerSetupModule } from './swagger/swagger.module';
import { createLogger, NestWinstonLogger } from '@repo/logger';

async function bootstrap() {
  const logger = createLogger('api-gateway');
  const nestLogger = new NestWinstonLogger(logger);
  
  const app = await NestFactory.create(AppModule, {
    logger: nestLogger,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
      queue: 'api_gateway_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'Access-Control-Allow-Headers',
    ],
    exposedHeaders: ['Authorization', 'Content-Length'],
    maxAge: 86400,
  });

  app.useGlobalPipes(new ClassValidationPipe());

  SwaggerSetupModule.setup(app);

  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  const port = configService.get('PORT', { infer: true });

  await app.startAllMicroservices();
  await app.listen(port);
  
  logger.info(`API Gateway running on http://localhost:${port}`);
  logger.info(`RabbitMQ microservice connected (queue: api_gateway_queue)`);
  logger.info(`Swagger docs available at http://localhost:${port}/api/docs`);
  logger.info(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
}

bootstrap().catch((error) => {
  const logger = createLogger('api-gateway');
  logger.error('Failed to start API Gateway', { error: error.message, stack: error.stack });
  process.exit(1);
});