import { ClientProxy } from '@nestjs/microservices';
import { CreateTaskProxyController } from './create-task-proxy.controller';
import { of } from 'rxjs';

describe('CreateTaskProxyController (Unit)', () => {
  let controller: CreateTaskProxyController;
  let tasksService: ClientProxy;

  beforeEach(() => {
    tasksService = {
      send: vi.fn(),
    } as any;

    controller = new CreateTaskProxyController(tasksService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should create task successfully', async () => {
    const body = {
      title: 'Test Task',
      description: 'Test Description',
      priority: 'HIGH' as any,
      status: 'TODO' as any,
    };

    const currentUser = { sub: 'user-123' };

    const mockResponse = {
      success: true,
      task: {
        id: 'task-123',
        ...body,
        authorId: currentUser.sub,
      },
    };

    (tasksService.send as any).mockReturnValue(of(mockResponse));

    const result = await controller.handle(body, currentUser);

    expect(tasksService.send).toHaveBeenCalledWith('tasks.create', {
      ...body,
      authorId: currentUser.sub,
    });
    expect(result).toEqual({ task: mockResponse.task });
  });

  test('should throw BadRequestException if creation fails', async () => {
    const body = {
      title: 'Test Task',
      description: 'Test Description',
    };

    const currentUser = { sub: 'user-123' };

    const mockResponse = {
      success: false,
      error: 'Creation failed',
    };

    (tasksService.send as any).mockReturnValue(of(mockResponse));

    await expect(controller.handle(body, currentUser)).rejects.toThrow();
  });
});