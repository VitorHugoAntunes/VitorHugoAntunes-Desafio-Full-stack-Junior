import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from '../services/tasks.service';
import { TaskPriority, TaskStatus } from '../entities/task.entity';

describe('TasksController (Unit)', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockTasksService = {
    createTask: vi.fn(),
    getTask: vi.fn(),
    fetchTasks: vi.fn(),
    getTaskStats: vi.fn(),
    getTaskHistory: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    createComment: vi.fn(),
    fetchComments: vi.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);

    vi.clearAllMocks();
  });

  describe('createTask', () => {
    test('should create a task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        authorId: 'user1',
        assigneeIds: ['user2'],
      };

      const expectedResult = {
        success: true,
        task: {
          id: 'task1',
          ...taskData,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockTasksService.createTask.mockResolvedValue(expectedResult);

      const result = await controller.createTask(taskData);

      expect(tasksService.createTask).toHaveBeenCalledWith(taskData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTask', () => {
    test('should get a task by id', async () => {
      const expectedResult = {
        success: true,
        task: {
          id: 'task1',
          title: 'Test Task',
        },
      };

      mockTasksService.getTask.mockResolvedValue(expectedResult);

      const result = await controller.getTask({ id: 'task1' });

      expect(tasksService.getTask).toHaveBeenCalledWith({ id: 'task1' });
      expect(result).toEqual(expectedResult);
    });

    test('should return error if task not found', async () => {
      const expectedResult = {
        success: false,
        error: 'Task not found',
      };

      mockTasksService.getTask.mockResolvedValue(expectedResult);

      const result = await controller.getTask({ id: 'nonexistent' });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('fetchTasks', () => {
    test('should fetch tasks with pagination', async () => {
      const query = {
        page: 1,
        size: 20,
        search: 'test',
        status: 'TODO',
        priority: 'HIGH',
      };

      const expectedResult = {
        success: true,
        tasks: [{ id: 'task1', title: 'Task 1' }],
        total: 1,
        page: 1,
        size: 20,
      };

      mockTasksService.fetchTasks.mockResolvedValue(expectedResult);

      const result = await controller.fetchTasks(query);

      expect(tasksService.fetchTasks).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTaskStats', () => {
    test('should get task statistics', async () => {
      const expectedResult = {
        success: true,
        stats: {
          total: 10,
          todo: 3,
          inProgress: 4,
          review: 2,
          done: 1,
        },
      };

      mockTasksService.getTaskStats.mockResolvedValue(expectedResult);

      const result = await controller.getTaskStats();

      expect(tasksService.getTaskStats).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateTask', () => {
    test('should update a task', async () => {
      const updateData = {
        id: 'task1',
        userId: 'user1',
        updates: {
          title: 'Updated Title',
          status: TaskStatus.IN_PROGRESS,
        },
      };

      const expectedResult = {
        success: true,
        task: {
          id: 'task1',
          title: 'Updated Title',
          status: TaskStatus.IN_PROGRESS,
        },
      };

      mockTasksService.updateTask.mockResolvedValue(expectedResult);

      const result = await controller.updateTask(updateData);

      expect(tasksService.updateTask).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(expectedResult);
    });

    test('should return error if task not found', async () => {
      const updateData = {
        id: 'nonexistent',
        userId: 'user1',
        updates: { title: 'New Title' },
      };

      const expectedResult = {
        success: false,
        error: 'Task not found',
      };

      mockTasksService.updateTask.mockResolvedValue(expectedResult);

      const result = await controller.updateTask(updateData);

      expect(result).toEqual(expectedResult);
    });

    test('should return error if unauthorized', async () => {
      const updateData = {
        id: 'task1',
        userId: 'user2',
        updates: { title: 'New Title' },
      };

      const expectedResult = {
        success: false,
        error: 'Unauthorized to update this task',
      };

      mockTasksService.updateTask.mockResolvedValue(expectedResult);

      const result = await controller.updateTask(updateData);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteTask', () => {
    test('should delete a task', async () => {
      const deleteData = {
        id: 'task1',
        userId: 'user1',
      };

      const expectedResult = {
        success: true,
        message: 'Task deleted',
      };

      mockTasksService.deleteTask.mockResolvedValue(expectedResult);

      const result = await controller.deleteTask(deleteData);

      expect(tasksService.deleteTask).toHaveBeenCalledWith(deleteData);
      expect(result).toEqual(expectedResult);
    });

    test('should return error if task not found or unauthorized', async () => {
      const deleteData = {
        id: 'task1',
        userId: 'user2',
      };

      const expectedResult = {
        success: false,
        error: 'Task not found or unauthorized',
      };

      mockTasksService.deleteTask.mockResolvedValue(expectedResult);

      const result = await controller.deleteTask(deleteData);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('createComment', () => {
    test('should create a comment', async () => {
      const commentData = {
        taskId: 'task1',
        authorId: 'user1',
        content: 'Test comment',
      };

      const expectedResult = {
        success: true,
        comment: {
          id: 'comment1',
          ...commentData,
          createdAt: new Date(),
        },
      };

      mockTasksService.createComment.mockResolvedValue(expectedResult);

      const result = await controller.createComment(commentData);

      expect(tasksService.createComment).toHaveBeenCalledWith(commentData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('fetchComments', () => {
    test('should fetch comments', async () => {
      const fetchData = {
        taskId: 'task1',
        page: 1,
        size: 20,
      };

      const expectedResult = {
        success: true,
        comments: [{ id: 'comment1', content: 'Comment 1' }],
        total: 1,
      };

      mockTasksService.fetchComments.mockResolvedValue(expectedResult);

      const result = await controller.fetchComments(fetchData);

      expect(tasksService.fetchComments).toHaveBeenCalledWith(fetchData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTaskHistory', () => {
    test('should get task history', async () => {
      const historyData = {
        taskId: 'task1',
        page: 1,
        size: 10,
      };

      const expectedResult = {
        success: true,
        history: [{ id: 'history1', changes: {} }],
        total: 1,
      };

      mockTasksService.getTaskHistory.mockResolvedValue(expectedResult);

      const result = await controller.getTaskHistory(historyData);

      expect(tasksService.getTaskHistory).toHaveBeenCalledWith(historyData);
      expect(result).toEqual(expectedResult);
    });
  });
});