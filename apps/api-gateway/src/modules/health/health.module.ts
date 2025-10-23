import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [HealthController],
})
export class HealthModule {}
