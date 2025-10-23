import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface HealthCheck {
  status: string;
  message?: string;
  error?: string;
}

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get()
  async check() {
    const health = {
      status: 'healthy',
      service: 'notifications-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: await this.checkDatabase(),
      },
    };

    health.status = Object.values(health.checks).every((check: HealthCheck) => check.status === 'healthy')
      ? 'healthy'
      : 'degraded';

    return health;
  }

  @Get('ready')
  async ready() {
    const dbHealthy = await this.checkDatabase();
    
    if (dbHealthy.status !== 'healthy') {
      throw new Error('Database is not ready');
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern('health.check')
  async healthCheck() {
    const dbCheck = await this.checkDatabase();
    
    return {
      status: dbCheck.status === 'healthy' ? 'healthy' : 'degraded',
      service: 'notifications-service',
      timestamp: new Date().toISOString(),
      database: dbCheck,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'healthy', message: 'Database connection is healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: 'Database connection failed',
        error: error.message 
      };
    }
  }
}