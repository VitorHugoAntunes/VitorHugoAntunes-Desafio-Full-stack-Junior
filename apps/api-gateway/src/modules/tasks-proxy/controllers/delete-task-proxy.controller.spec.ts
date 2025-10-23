import { ClientProxy } from '@nestjs/microservices';
import { DeleteTaskProxyController } from './delete-task-proxy.controller';
import { of } from 'rxjs';
import { NotFoundException } from '@nestjs/common';

describe('DeleteTaskProxyController (Unit)', () => {
  let controller: DeleteTaskProxyController;
  let tasksService: ClientProxy;

  beforeEach(() => {
    tasksService = {
      send: vi.fn(),
    } as any;

    controller = new DeleteTaskProxyController(tasksService);
  });

  test('should delete task successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Task deleted',
    };

    (tasksService.send as any).mockReturnValue(of(mockResponse));

    const result = await controller.handle(
      { id: 'task-123' },
      { sub: 'user-123' }
    );

    expect(tasksService.send).toHaveBeenCalledWith('tasks.delete', {
      id: 'task-123',
      userId: 'user-123',
    });
    expect(result).toEqual({ message: 'Task deleted' });
  });

  test('should throw NotFoundException if task not found', async () => {
    const mockResponse = {
      success: false,
      error: 'Task not found or unauthorized',
    };

    (tasksService.send as any).mockReturnValue(of(mockResponse));

    await expect(
      controller.handle({ id: 'nonexistent' }, { sub: 'user-123' })
    ).rejects.toThrow(NotFoundException);
  });
});