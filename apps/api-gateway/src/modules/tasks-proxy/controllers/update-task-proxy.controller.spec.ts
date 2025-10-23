import { ClientProxy } from '@nestjs/microservices';
import { UpdateTaskProxyController } from './update-task-proxy.controller';
import { NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';

describe('UpdateTaskProxyController (Unit)', () => {
  let controller: UpdateTaskProxyController;
  let tasksService: ClientProxy;

  beforeEach(() => {
    tasksService = {
      send: vi.fn(),
    } as any;

    controller = new UpdateTaskProxyController(tasksService);
  });

  test('should update task successfully', async () => {
    const id = 'task-123';
    const body = {
      title: 'Updated Title',
      description: 'Updated Description',
    };
    const currentUser = { sub: 'user-123' };

    const mockResponse = {
      success: true,
      task: {
        id,
        ...body,
        authorId: currentUser.sub,
      },
    };

    (tasksService.send as any).mockReturnValue(of(mockResponse));

    const result = await controller.handle({ id }, body, currentUser);

    expect(tasksService.send).toHaveBeenCalledWith('tasks.update', {
      id,
      userId: currentUser.sub,
      updates: body,
    });
    expect(result).toEqual({ task: mockResponse.task });
  });

  test('should throw NotFoundException if task not found', async () => {
    const mockResponse = {
      success: false,
      error: 'Task not found',
    };

    (tasksService.send as any).mockReturnValue(of(mockResponse));

    await expect(
      controller.handle(
        { id: 'nonexistent' },
        { title: 'Test' },
        { sub: 'user-123' }
      )
    ).rejects.toThrow(NotFoundException);
  });
});