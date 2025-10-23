import {
  Body,
  Controller,
  Param,
  Put,
  UseGuards,
  NotFoundException,
  UnauthorizedException,
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
  ApiBody,
} from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/decorators/current-user-decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { UserPayload } from '@/modules/auth/strategies/jwt.strategy';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { UuidParamDto } from '../dtos/uuid-param.dto';
import { ClassValidationPipe } from '@/common/pipes/class-validation.pipe';

@ApiTags('tasks')
@Controller('/api/tasks')
@UseGuards(JwtAuthGuard)
@UsePipes(ClassValidationPipe)
@ApiBearerAuth('JWT-auth')
export class UpdateTaskProxyController {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update task',
    description: 'Updates an existing task. Only the task author can update it.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Task updated successfully',
    schema: {
      example: {
        task: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Updated task title',
          description: 'Updated description',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token or user is not the author' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async handle(
    @Param() params: UuidParamDto,
    @Body() body: UpdateTaskDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    const response = await firstValueFrom(
      this.tasksService.send('tasks.update', {
        id: params.id,
        userId: currentUser.sub,
        updates: {
          ...body,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        },
      })
    );

    if (!response.success) {
      if (response.error === 'Task not found') {
        throw new NotFoundException('Task not found');
      }
      if (response.error === 'Unauthorized to update this task') {
        throw new UnauthorizedException('User is not authorized to update this task');
      }

      throw new NotFoundException(response.error);
    }

    return { task: response.task };
  }
}