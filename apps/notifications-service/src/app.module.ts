import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { createLogger, HttpLoggerMiddleware } from '@repo/logger';
import { envSchema, Env } from './config/env';
import { Notification } from './modules/notification/entities/notification.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationsModule } from './modules/notification/notification.module';
import { HealthModule } from './modules/health/health.module';

const logger = createLogger('notifications-service');

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL', { infer: true }),
        entities: [Notification],
        synchronize: false,
        logging: ['warn', 'error'],
      }),
    }),
    PassportModule,
    EventEmitterModule.forRoot(),
    NotificationsModule,
    HealthModule,
  ],
  providers: [
    JwtStrategy,
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