import { 
  Controller, 
  Get, 
  Query, 
  Param, 
  UseGuards, 
  NotFoundException,
  Inject,
  UsePipes,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PaginationDto } from '../dtos/pagination.dto';
import { UuidParamDto } from '../dtos/uuid-param.dto';
import { ClassValidationPipe } from '@/common/pipes/class-validation.pipe';

@ApiTags('comments')
@Controller('/api/tasks')
@UseGuards(JwtAuthGuard)
@UsePipes(ClassValidationPipe)
@ApiBearerAuth('JWT-auth')
export class FetchCommentsProxyController {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  @Get(':id/comments')
  @ApiOperation({ 
    summary: 'Fetch task comments',
    description: 'Returns a paginated list of comments for a specific task',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Task ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'size', required: false, type: Number, example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Comments retrieved successfully',
    schema: {
      example: {
        comments: [
          {
            id: '770e8400-e29b-41d4-a716-446655440000',
            content: 'This task needs to be completed by end of week',
            taskId: '550e8400-e29b-41d4-a716-446655440000',
            authorId: '660e8400-e29b-41d4-a716-446655440000',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 10,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async handle(
    @Param() params: UuidParamDto, 
    @Query() query: PaginationDto
  ) {
    const response = await firstValueFrom(
      this.tasksService.send('tasks.comments.fetch', {
        taskId: params.id,
        page: query.page,
        size: query.size,
      })
    );

    if (!response.success) {
      throw new NotFoundException(response.error);
    }

    return { 
      comments: response.comments,
      total: response.total,
    };
  }
}