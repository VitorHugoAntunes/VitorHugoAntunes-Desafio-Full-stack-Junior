import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('tasks')
@Controller('/api/stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TaskStatsProxyController {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  @Get('tasks')
  @ApiOperation({ 
    summary: 'Get task statistics',
    description: 'Returns overall statistics about tasks (total, by status)',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        total: 100,
        todo: 25,
        inProgress: 30,
        review: 20,
        done: 25,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async handle() {
    const response = await firstValueFrom(
      this.tasksService.send('tasks.stats', {})
    );

    if (!response.success) {
      throw new Error('Failed to fetch task statistics');
    }

    return response.stats;
  }
}