import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env';
import { User } from './entities/user.entity';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UsersRepository } from './repositories/users.repository';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { createLogger, HttpLoggerMiddleware } from '@repo/logger';

const logger = createLogger('auth-service');

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        signOptions: { algorithm: 'RS256' },
        privateKey: Buffer.from(config.get<string>('JWT_PRIVATE_KEY', { infer: true })!, 'base64'),
        publicKey: Buffer.from(config.get<string>('JWT_PUBLIC_KEY', { infer: true })!, 'base64'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersRepository, JwtStrategy, {
      provide: 'LOGGER',
      useValue: logger,
    },],
  exports: [AuthService, UsersRepository, 'LOGGER'],
})
export class AuthModule {
   configure(consumer: MiddlewareConsumer) {
      consumer
        .apply((req, res, next) => new HttpLoggerMiddleware(logger).use(req, res, next))
        .forRoutes('*');
    }
}