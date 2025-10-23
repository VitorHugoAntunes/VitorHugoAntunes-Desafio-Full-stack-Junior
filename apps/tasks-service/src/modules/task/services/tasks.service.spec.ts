import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { TasksService } from '../services/tasks.service';
import { TasksRepository } from '../repositories/tasks.repository';
import { TaskPriority, TaskStatus } from '../entities/task.entity';

describe('TasksService (Unit)', () => {
  let tasksService: TasksService;
  let tasksRepository: TasksRepository;
  let notificationsClient: ClientProxy;

  beforeEach(() => {
    tasksRepository = {
      createTask: vi.fn(),
      findTaskById: vi.fn(),
      findTaskByIdAndAuthor: vi.fn(),
      fetchTasks: vi.fn(),
      getAllTasks: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      createTaskHistory: vi.fn(),
      fetchTaskHistory: vi.fn(),
      createComment: vi.fn(),
      fetchComments: vi.fn(),
    } as any;

    notificationsClient = {
      emit: vi.fn().mockReturnValue(of({})),
    } as any;

    tasksService = new TasksService(tasksRepository, notificationsClient);
  });

  describe('createTask', () => {
    test('should create task and emit notification', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        authorId: 'user1',
        assigneeIds: ['user2'],
      };

      const createdTask = {
        id: 'task1',
        ...taskData,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tasksRepository.createTask as any).mockResolvedValue(createdTask);

      const result = await tasksService.createTask(taskData);

      expect(tasksRepository.createTask).toHaveBeenCalledWith(taskData);
      expect(notificationsClient.emit).toHaveBeenCalledWith('task.created', {
        id: createdTask.id,
        title: createdTask.title,
        authorId: createdTask.authorId,
        assigneeIds: createdTask.assigneeIds,
      });
      expect(result).toEqual({
        success: true,
        task: createdTask,
      });
    });
  });

  describe('getTask', () => {
    test('should return task by id', async () => {
      const task = {
        id: 'task1',
        title: 'Test Task',
        description: 'Description',
        authorId: 'user1',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tasksRepository.findTaskById as any).mockResolvedValue(task);

      const result = await tasksService.getTask({ id: 'task1' });

      expect(tasksRepository.findTaskById).toHaveBeenCalledWith('task1');
      expect(result).toEqual({
        success: true,
        task,
      });
    });

    test('should return error if task not found', async () => {
      (tasksRepository.findTaskById as any).mockResolvedValue(null);

      const result = await tasksService.getTask({ id: 'task1' });

      expect(result).toEqual({
        success: false,
        error: 'Task not found',
      });
    });
  });

  describe('fetchTasks', () => {
    test('should fetch tasks with pagination and filters', async () => {
      const tasks = [
        { id: 'task1', title: 'Task 1' },
        { id: 'task2', title: 'Task 2' },
      ];
      const total = 10;

      (tasksRepository.fetchTasks as any).mockResolvedValue({ tasks, total });

      const result = await tasksService.fetchTasks({
        page: 1,
        size: 20,
        search: 'test',
        status: 'TODO',
        priority: 'HIGH',
      });

      expect(tasksRepository.fetchTasks).toHaveBeenCalledWith({
        page: 1,
        size: 20,
        search: 'test',
        status: 'TODO',
        priority: 'HIGH',
      });
      expect(result).toEqual({
        success: true,
        tasks,
        total,
        page: 1,
        size: 20,
      });
    });
  });

  describe('getTaskStats', () => {
    test('should return task statistics', async () => {
      const tasks = [
        { id: 'task1', status: TaskStatus.TODO },
        { id: 'task2', status: TaskStatus.TODO },
        { id: 'task3', status: TaskStatus.IN_PROGRESS },
        { id: 'task4', status: TaskStatus.REVIEW },
        { id: 'task5', status: TaskStatus.DONE },
      ];

      (tasksRepository.getAllTasks as any).mockResolvedValue(tasks);

      const result = await tasksService.getTaskStats();

      expect(tasksRepository.getAllTasks).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        stats: {
          total: 5,
          todo: 2,
          inProgress: 1,
          review: 1,
          done: 1,
        },
      });
    });
  });

  describe('updateTask', () => {
    test('should update task and create history', async () => {
      const task = {
        id: 'task1',
        title: 'Old Title',
        description: 'Old Description',
        authorId: 'user1',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeIds: ['user2'],
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates = {
        title: 'New Title',
        status: TaskStatus.IN_PROGRESS,
      };

      const updatedTask = { ...task, ...updates };

      (tasksRepository.findTaskById as any).mockResolvedValue(task);
      (tasksRepository.updateTask as any).mockResolvedValue(updatedTask);
      (tasksRepository.createTaskHistory as any).mockResolvedValue({});

      const result = await tasksService.updateTask({
        id: 'task1',
        userId: 'user1',
        updates,
      });

      expect(tasksRepository.findTaskById).toHaveBeenCalledWith('task1');
      expect(tasksRepository.updateTask).toHaveBeenCalledWith(updatedTask);
      expect(tasksRepository.createTaskHistory).toHaveBeenCalledWith({
        taskId: task.id,
        userId: 'user1',
        changes: {
          title: { from: 'Old Title', to: 'New Title' },
          status: { from: TaskStatus.TODO, to: TaskStatus.IN_PROGRESS },
        },
      });
      expect(notificationsClient.emit).toHaveBeenCalledWith('task.updated', {
        id: updatedTask.id,
        title: updatedTask.title,
        authorId: updatedTask.authorId,
        assigneeIds: updatedTask.assigneeIds,
        previousAssigneeIds: ['user2'],
        status: updatedTask.status,
        previousStatus: TaskStatus.TODO,
        updatedBy: 'user1',
      });
      expect(result).toEqual({
        success: true,
        task: updatedTask,
      });
    });

    test('should not update if no changes detected', async () => {
      const task = {
        id: 'task1',
        title: 'Same Title',
        description: 'Same Description',
        authorId: 'user1',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeIds: ['user2'],
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tasksRepository.findTaskById as any).mockResolvedValue(task);

      const result = await tasksService.updateTask({
        id: 'task1',
        userId: 'user1',
        updates: { title: 'Same Title' },
      });

      expect(tasksRepository.updateTask).not.toHaveBeenCalled();
      expect(tasksRepository.createTaskHistory).not.toHaveBeenCalled();
      expect(notificationsClient.emit).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        task,
        message: 'No changes detected',
      });
    });

    test('should return error if task not found', async () => {
      (tasksRepository.findTaskById as any).mockResolvedValue(null);

      const result = await tasksService.updateTask({
        id: 'task1',
        userId: 'user1',
        updates: { title: 'New Title' },
      });

      expect(result).toEqual({
        success: false,
        error: 'Task not found',
      });
    });

    test('should return error if unauthorized', async () => {
      const task = {
        id: 'task1',
        authorId: 'user2',
        title: 'Task',
        description: 'Desc',
      };

      (tasksRepository.findTaskById as any).mockResolvedValue(task);

      const result = await tasksService.updateTask({
        id: 'task1',
        userId: 'user1',
        updates: { title: 'New Title' },
      });

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized to update this task',
      });
    });
  });

  describe('deleteTask', () => {
    test('should delete task and emit notification', async () => {
      const task = {
        id: 'task1',
        authorId: 'user1',
        title: 'Task to delete',
      };

      (tasksRepository.findTaskByIdAndAuthor as any).mockResolvedValue(task);
      (tasksRepository.deleteTask as any).mockResolvedValue(undefined);

      const result = await tasksService.deleteTask({
        id: 'task1',
        userId: 'user1',
      });

      expect(tasksRepository.findTaskByIdAndAuthor).toHaveBeenCalledWith('task1', 'user1');
      expect(tasksRepository.deleteTask).toHaveBeenCalledWith('task1');
      expect(notificationsClient.emit).toHaveBeenCalledWith('task.deleted', {
        taskId: 'task1',
      });
      expect(result).toEqual({
        success: true,
        message: 'Task deleted',
      });
    });

    test('should return error if task not found or unauthorized', async () => {
      (tasksRepository.findTaskByIdAndAuthor as any).mockResolvedValue(null);

      const result = await tasksService.deleteTask({
        id: 'task1',
        userId: 'user1',
      });

      expect(result).toEqual({
        success: false,
        error: 'Task not found or unauthorized',
      });
    });
  });

  describe('createComment', () => {
    test('should create comment and emit notification', async () => {
      const task = {
        id: 'task1',
        title: 'Test Task',
        authorId: 'user1',
        assigneeIds: ['user2'],
      };

      const commentData = {
        taskId: 'task1',
        authorId: 'user1',
        content: 'Test comment',
      };

      const createdComment = {
        id: 'comment1',
        ...commentData,
        createdAt: new Date(),
      };

      (tasksRepository.findTaskById as any).mockResolvedValue(task);
      (tasksRepository.createComment as any).mockResolvedValue(createdComment);

      const result = await tasksService.createComment(commentData);

      expect(tasksRepository.findTaskById).toHaveBeenCalledWith('task1');
      expect(tasksRepository.createComment).toHaveBeenCalledWith(commentData);
      expect(notificationsClient.emit).toHaveBeenCalledWith('task.comment.created', {
        taskId: 'task1',
        comment: createdComment,
        taskTitle: task.title,
        taskAuthorId: task.authorId,
        taskAssigneeIds: task.assigneeIds,
      });
      expect(result).toEqual({
        success: true,
        comment: createdComment,
      });
    });

    test('should return error if task not found', async () => {
      (tasksRepository.findTaskById as any).mockResolvedValue(null);

      const result = await tasksService.createComment({
        taskId: 'task1',
        authorId: 'user1',
        content: 'Test comment',
      });

      expect(result).toEqual({
        success: false,
        error: 'Task not found',
      });
    });
  });

  describe('fetchComments', () => {
    test('should fetch comments with pagination', async () => {
      const task = { id: 'task1', title: 'Task' };
      const comments = [
        { id: 'comment1', content: 'Comment 1' },
        { id: 'comment2', content: 'Comment 2' },
      ];
      const total = 10;

      (tasksRepository.findTaskById as any).mockResolvedValue(task);
      (tasksRepository.fetchComments as any).mockResolvedValue({ comments, total });

      const result = await tasksService.fetchComments({
        taskId: 'task1',
        page: 1,
        size: 20,
      });

      expect(tasksRepository.findTaskById).toHaveBeenCalledWith('task1');
      expect(tasksRepository.fetchComments).toHaveBeenCalledWith({
        taskId: 'task1',
        page: 1,
        size: 20,
      });
      expect(result).toEqual({
        success: true,
        comments,
        total,
      });
    });

    test('should return error if task not found', async () => {
      (tasksRepository.findTaskById as any).mockResolvedValue(null);

      const result = await tasksService.fetchComments({
        taskId: 'task1',
        page: 1,
        size: 20,
      });

      expect(result).toEqual({
        success: false,
        error: 'Task not found',
      });
    });
  });

  describe('getTaskHistory', () => {
    test('should fetch task history', async () => {
      const history = [
        { id: 'history1', changes: {} },
        { id: 'history2', changes: {} },
      ];
      const total = 5;

      (tasksRepository.fetchTaskHistory as any).mockResolvedValue({ history, total });

      const result = await tasksService.getTaskHistory({
        taskId: 'task1',
        page: 1,
        size: 10,
      });

      expect(tasksRepository.fetchTaskHistory).toHaveBeenCalledWith({
        taskId: 'task1',
        page: 1,
        size: 10,
      });
      expect(result).toEqual({
        success: true,
        history,
        total,
      });
    });
  });
});