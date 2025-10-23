import { Controller, Get, Query, UseGuards, Inject, UsePipes } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PaginationDto } from '../dtos/pagination.dto';
import { ClassValidationPipe } from '@/common/pipes/class-validation.pipe';

@Controller('/api/tasks')
@ApiTags('tasks')
@UseGuards(JwtAuthGuard)
@UsePipes(ClassValidationPipe)
@ApiBearerAuth('JWT-auth')
export class FetchTasksProxyController {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Fetch all tasks',
    description: 'Returns a paginated list of all tasks with optional filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'size', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'List of tasks retrieved successfully',
    schema: {
      example: {
        tasks: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Task 1',
            description: 'Description 1',
            status: 'TODO',
            priority: 'HIGH',
          },
        ],
        total: 100,
        page: 1,
        size: 20,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async handle(
    @Query() query: PaginationDto,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    const response = await firstValueFrom(
      this.tasksService.send('tasks.fetch', {
        page: query.page,
        size: query.size,
        search,
        status,
        priority,
      })
    );

    return { 
      tasks: response.tasks,
      total: response.total,
      page: response.page,
      size: response.size,
    };
  }
}