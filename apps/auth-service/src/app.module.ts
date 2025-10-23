import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envSchema, Env } from './config/env';
import { User } from './modules/auth/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';

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
        entities: [User],
        synchronize: false,
        logging: ['warn', 'error'],
      }),
    }),
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}