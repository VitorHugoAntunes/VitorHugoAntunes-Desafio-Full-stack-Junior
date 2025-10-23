import {
  Body,
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  Inject,
  UsePipes,
  Param,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/decorators/current-user-decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { UserPayload } from '@/modules/auth/strategies/jwt.strategy';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { ClassValidationPipe } from '@/common/pipes/class-validation.pipe';
import { UuidParamDto } from '../dtos';

@ApiTags('tasks')
@Controller('/api/tasks')
@UseGuards(JwtAuthGuard)
@UsePipes(ClassValidationPipe)
@ApiBearerAuth('JWT-auth')
export class CreateTaskProxyController {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new task',
    description: 'Creates a new task assigned to the authenticated user',
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Task successfully created',
    schema: {
      example: {
        task: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Implement user authentication',
          description: 'Add JWT authentication with refresh tokens',
          authorId: '660e8400-e29b-41d4-a716-446655440000',
          priority: 'HIGH',
          status: 'TODO',
          dueDate: '2024-12-31T00:00:00.000Z',
          assigneeIds: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async handle(
    @Body() body: CreateTaskDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    const response = await firstValueFrom(
      this.tasksService.send('tasks.create', {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        authorId: currentUser.sub,
      }),
    );

    if (!response.success) {
      throw new BadRequestException(response.error);
    }

    return { task: response.task };
  }
}