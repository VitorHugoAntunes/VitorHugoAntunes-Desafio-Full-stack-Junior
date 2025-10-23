import {
  Controller,
  Delete,
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
} from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/decorators/current-user-decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { UserPayload } from '@/modules/auth/strategies/jwt.strategy';
import { UuidParamDto } from '../dtos/uuid-param.dto';
import { ClassValidationPipe } from '@/common/pipes/class-validation.pipe';

@ApiTags('tasks')
@Controller('/api/tasks')
@UseGuards(JwtAuthGuard)
@UsePipes(ClassValidationPipe)
@ApiBearerAuth('JWT-auth')
export class DeleteTaskProxyController {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete task',
    description: 'Deletes a task. Only the task author can delete it.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Task deleted successfully',
    schema: {
      example: {
        message: 'Task deleted',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Task not found or user is not the author' })
  async handle(
    @Param() params: UuidParamDto,
    @CurrentUser() user: UserPayload,
  ) {
    const response = await firstValueFrom(
      this.tasksService.send('tasks.delete', {
        id: params.id,
        userId: user.sub,
      }),
    );

    if (!response.success) {
      throw new NotFoundException(response.error);
    }

    return { message: response.message };
  }
}