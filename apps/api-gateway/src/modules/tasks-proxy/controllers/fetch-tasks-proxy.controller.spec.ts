import { of } from 'rxjs';
import { FetchTasksProxyController } from './fetch-tasks-proxy.controller';
import { ClientProxy } from '@nestjs/microservices';

describe('FetchTasksProxyController (Unit)', () => {
  let controller: FetchTasksProxyController;
  let tasksService: ClientProxy;

  beforeEach(() => {
    tasksService = {
      send: vi.fn(),
    } as any;

    controller = new FetchTasksProxyController(tasksService);
  });

  test('should fetch tasks with pagination', async () => {
    const query = { page: 1, size: 20 };
    const mockResponse = {
      tasks: [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ],
      total: 50,
      page: 1,
      size: 20,
    };

    (tasksService.send as any).mockReturnValue(of(mockResponse));

    const result = await controller.handle(query);

    expect(tasksService.send).toHaveBeenCalledWith('tasks.fetch', query);
    expect(result).toEqual(mockResponse);
  });

  test('should use default pagination values', async () => {
    const query = { page: '1', size: '20' };
    const mockResponse = {
      tasks: [],
      total: 0,
      page: 1,
      size: 20,
    };

    (tasksService.send as any).mockReturnValue(of(mockResponse));

    await controller.handle(query as any);

    expect(tasksService.send).toHaveBeenCalled();
  });
});