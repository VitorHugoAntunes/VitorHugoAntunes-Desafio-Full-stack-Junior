import { 
  Body, 
  Controller, 
  Param, 
  Post, 
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
  ApiBody,
} from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/decorators/current-user-decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { UserPayload } from '@/modules/auth/strategies/jwt.strategy';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { UuidParamDto } from '../dtos/uuid-param.dto';
import { ClassValidationPipe } from '@/common/pipes/class-validation.pipe';

@ApiTags('comments')
@Controller('/api/tasks')
@UseGuards(JwtAuthGuard)
@UsePipes(ClassValidationPipe)
@ApiBearerAuth('JWT-auth')
export class CreateCommentProxyController {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  @Post(':id/comments')
  @ApiOperation({ 
    summary: 'Create comment on task',
    description: 'Adds a new comment to an existing task',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Task ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Comment created successfully',
    schema: {
      example: {
        comment: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          content: 'This task needs to be completed by end of week',
          taskId: '550e8400-e29b-41d4-a716-446655440000',
          authorId: '660e8400-e29b-41d4-a716-446655440000',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async handle(
    @Param() params: UuidParamDto,
    @Body() body: CreateCommentDto,
    @CurrentUser() user: UserPayload,
  ) {
    const response = await firstValueFrom(
      this.tasksService.send('tasks.comments.create', {
        taskId: params.id,
        authorId: user.sub,
        content: body.content,
      })
    );

    if (!response.success) {
      throw new NotFoundException(response.error);
    }

    return { comment: response.comment };
  }
}