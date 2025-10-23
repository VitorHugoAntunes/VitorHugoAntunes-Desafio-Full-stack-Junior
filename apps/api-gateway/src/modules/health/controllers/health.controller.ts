import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @Inject('AUTH_SERVICE')
    private authService: ClientProxy,
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private notificationsService: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: await this.checkDatabase(),
        authService: await this.checkAuthService(),
        tasksService: await this.checkTasksService(),
        notificationsService: await this.checkNotificationsService(),
      },
    };

    const allHealthy = Object.values(health.checks).every(
      (check: any) => check.status === 'healthy'
    );

    health.status = allHealthy ? 'healthy' : 'degraded';

    return health;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
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
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase() {
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

  private async checkAuthService() {
    try {
      const result = await firstValueFrom(
        this.authService.send('health.check', {}).pipe(
          timeout(5000),
          catchError(() => of({ status: 'unhealthy' }))
        )
      );
      return result.status === 'healthy' 
        ? { status: 'healthy', message: 'Auth service is healthy' }
        : { status: 'unhealthy', message: 'Auth service is not responding' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: 'Auth service check failed',
        error: error.message 
      };
    }
  }

  private async checkTasksService() {
    try {
      const result = await firstValueFrom(
        this.tasksService.send('health.check', {}).pipe(
          timeout(5000),
          catchError(() => of({ status: 'unhealthy' }))
        )
      );
      return result.status === 'healthy'
        ? { status: 'healthy', message: 'Tasks service is healthy' }
        : { status: 'unhealthy', message: 'Tasks service is not responding' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: 'Tasks service check failed',
        error: error.message 
      };
    }
  }

  private async checkNotificationsService() {
    try {
      const result = await firstValueFrom(
        this.notificationsService.send('health.check', {}).pipe(
          timeout(5000),
          catchError(() => of({ status: 'unhealthy' }))
        )
      );
      return result.status === 'healthy'
        ? { status: 'healthy', message: 'Notifications service is healthy' }
        : { status: 'unhealthy', message: 'Notifications service is not responding' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: 'Notifications service check failed',
        error: error.message 
      };
    }
  }
}