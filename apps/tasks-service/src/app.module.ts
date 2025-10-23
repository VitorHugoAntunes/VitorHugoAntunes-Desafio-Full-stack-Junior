import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { createLogger, HttpLoggerMiddleware } from '@repo/logger';
import { envSchema, Env } from './config/env';
import { Task } from './modules/task/entities/task.entity';
import { TaskHistory } from './modules/task/entities/task-history.entity';
import { Comment } from './modules/task/entities/comment.entity';
import { TaskModule } from './modules/task/task.module';
import { HealthModule } from './modules/health/health.module';

const logger = createLogger('tasks-service');

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
        entities: [Task, TaskHistory, Comment],
        synchronize: false,
        logging: ['warn', 'error'],
      }),
    }),
    EventEmitterModule.forRoot(),
    TaskModule,
    HealthModule,
  ],
  providers: [
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
      .apply((req, res, next) =>
        new HttpLoggerMiddleware(logger).use(req, res, next),
      )
      .forRoutes('*');
  }
}