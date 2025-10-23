import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envSchema } from '@/env';
import { AuthProxyModule } from './modules/auth-proxy/auth-proxy.module';
import { TasksProxyModule } from './modules/tasks-proxy/tasks-proxy.module';
import { NotificationsProxyModule } from './modules/notifications-proxy/notifications-proxy.module'; // 🔥 NOVO
import { createLogger, HttpLoggerMiddleware } from '@repo/logger';
import { HealthModule } from './modules/health/health.module';
import { RmqModule } from './modules/rmq/rmq.module';

const logger = createLogger('api-gateway');

function createThrottlerProvider() {
  if (process.env.NODE_ENV === 'test') {
    return [];
  }

  return [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      ttl: 1,
      limit: 10,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      logging: ['warn', 'error'],
      synchronize: false,
      dropSchema: false,
      autoLoadEntities: false,
    }),
    RmqModule,
    EventEmitterModule.forRoot(),
    AuthProxyModule,
    TasksProxyModule,
    NotificationsProxyModule,
    HealthModule
  ],
  providers: [
    ...createThrottlerProvider(),
    {
      provide: 'LOGGER',
      useValue: logger,
    },
  ],
  exports: ['LOGGER'],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => new HttpLoggerMiddleware(logger).use(req, res, next))
      .forRoutes('*');
  }
}