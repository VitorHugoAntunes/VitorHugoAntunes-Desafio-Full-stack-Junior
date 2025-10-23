import { 
  Controller, 
  Get, 
  NotFoundException, 
  Param, 
  UseGuards,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { UuidParamDto } from '../dtos/uuid-param.dto';
import { ClassValidationPipe } from '@/common/pipes/class-validation.pipe';

@ApiTags('tasks')
@Controller('/api/tasks')
@UseGuards(JwtAuthGuard)
@UsePipes(ClassValidationPipe)
@ApiBearerAuth('JWT-auth')
export class GetTaskProxyController {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get task by ID',
    description: 'Returns detailed information about a specific task',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Task retrieved successfully',
    schema: {
      example: {
        task: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Task 1',
          description: 'Description 1',
          status: 'TODO',
          priority: 'HIGH',
          authorId: '660e8400-e29b-41d4-a716-446655440000',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async handle(@Param() params: UuidParamDto) {
    console.log('GetTaskProxyController called with ID:', params.id);
    const response = await firstValueFrom(
      this.tasksService.send('tasks.get', { id: params.id })
    );

    if (!response.success) {
      console.log('Task not found:', response.error);
      throw new NotFoundException(response.error);
    }

    return response.task;
  }
}