import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { Task, TaskPriority, TaskStatus } from '../src/modules/task/entities/task.entity';
import { Comment } from '../src/modules/task/entities/comment.entity';

describe('Tasks Service - Message Patterns (E2E)', () => {
  let app: INestApplication;
  let client: ClientProxy;
  let taskRepository: Repository<Task>;
  let commentRepository: Repository<Comment>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'TASKS_SERVICE',
            transport: Transport.RMQ,
            options: {
              urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
              queue: 'tasks_queue_test',
              queueOptions: {
                durable: true,
              },
            },
          },
        ]),
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
        queue: 'tasks_queue_test',
        queueOptions: {
          durable: true,
        },
      },
    });

    await app.startAllMicroservices();
    await app.init();

    client = app.get('TASKS_SERVICE');
    await client.connect();

    taskRepository = moduleRef.get<Repository<Task>>(getRepositoryToken(Task));
    commentRepository = moduleRef.get<Repository<Comment>>(getRepositoryToken(Comment));
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  describe('tasks.create', () => {
    test('should create task via message pattern', async () => {
      const data = {
        title: 'Test Task',
        description: 'Test Description',
        authorId: randomUUID(),
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
      };

      const response = await firstValueFrom(
        client.send('tasks.create', data)
      );

      expect(response.success).toBe(true);
      expect(response.task).toMatchObject({
        id: expect.any(String),
        title: data.title,
        description: data.description,
        authorId: data.authorId,
        priority: data.priority,
        status: data.status,
      });

      const task = await taskRepository.findOneBy({ id: response.task.id });
      expect(task).toBeTruthy();
      expect(task?.title).toBe(data.title);
    });

    test('should create task with default priority and status', async () => {
      const data = {
        title: 'Default Task',
        description: 'Description',
        authorId: randomUUID(),
      };

      const response = await firstValueFrom(
        client.send('tasks.create', data)
      );

      expect(response.task.priority).toBe(TaskPriority.MEDIUM);
      expect(response.task.status).toBe(TaskStatus.TODO);
    });

    test('should create task with assignees', async () => {
      const data = {
        title: 'Task with Assignees',
        description: 'Description',
        authorId: randomUUID(),
        assigneeIds: [randomUUID(), randomUUID()],
      };

      const response = await firstValueFrom(
        client.send('tasks.create', data)
      );

      expect(response.task.assigneeIds).toHaveLength(2);
      expect(response.task.assigneeIds).toEqual(data.assigneeIds);
    });
  });

  describe('tasks.fetch', () => {
    test('should fetch tasks with pagination', async () => {
      const authorId = randomUUID();

      for (let i = 0; i < 5; i++) {
        await taskRepository.save({
          title: `Fetch Test Task ${i}`,
          description: 'Description',
          authorId,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
          assigneeIds: [],
        });
      }

      const response = await firstValueFrom(
        client.send('tasks.fetch', { page: 1, size: 3 })
      );

      expect(response.success).toBe(true);
      expect(response.tasks).toBeInstanceOf(Array);
      expect(response.tasks.length).toBeLessThanOrEqual(3);
      expect(response).toHaveProperty('total');
      expect(response.page).toBe(1);
      expect(response.size).toBe(3);
    });

    test('should calculate correct offset for page 2', async () => {
      const response = await firstValueFrom(
        client.send('tasks.fetch', { page: 2, size: 10 })
      );

      expect(response.success).toBe(true);
      expect(response.page).toBe(2);
    });
  });

  describe('tasks.get', () => {
    test('should get task by id', async () => {
      const task = await taskRepository.save({
        title: 'Get Test Task',
        description: 'Description',
        authorId: randomUUID(),
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        assigneeIds: [],
      });

      const response = await firstValueFrom(
        client.send('tasks.get', { id: task.id })
      );

      expect(response.success).toBe(true);
      expect(response.task.id).toBe(task.id);
      expect(response.task.title).toBe(task.title);
    });

    test('should return error for non-existent task', async () => {
      const response = await firstValueFrom(
        client.send('tasks.get', { id: randomUUID() })
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('Task not found');
    });
  });

  describe('tasks.update', () => {
    test('should update task successfully', async () => {
      const authorId = randomUUID();
      const task = await taskRepository.save({
        title: 'Original Title',
        description: 'Original Description',
        authorId,
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        assigneeIds: [],
      });

      const response = await firstValueFrom(
        client.send('tasks.update', {
          id: task.id,
          userId: authorId,
          updates: {
            title: 'Updated Title',
            priority: TaskPriority.HIGH,
            status: TaskStatus.IN_PROGRESS,
          },
        })
      );

      expect(response.success).toBe(true);
      expect(response.task.title).toBe('Updated Title');
      expect(response.task.priority).toBe(TaskPriority.HIGH);
      expect(response.task.status).toBe(TaskStatus.IN_PROGRESS);

      const updatedTask = await taskRepository.findOneBy({ id: task.id });
      expect(updatedTask?.title).toBe('Updated Title');
    });

    test('should return error if task not found or unauthorized', async () => {
      const response = await firstValueFrom(
        client.send('tasks.update', {
          id: randomUUID(),
          userId: randomUUID(),
          updates: { title: 'New Title' },
        })
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('Task not found');
    });

    test('should not allow update by different user', async () => {
      const task = await taskRepository.save({
        title: 'Protected Task',
        description: 'Description',
        authorId: randomUUID(),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeIds: [],
      });

      const response = await firstValueFrom(
        client.send('tasks.update', {
          id: task.id,
          userId: randomUUID(), // Different user
          updates: { title: 'Hacked Title' },
        })
      );

      expect(response.success).toBe(false);
    });
  });

  describe('tasks.delete', () => {
    test('should delete task successfully', async () => {
      const authorId = randomUUID();
      const task = await taskRepository.save({
        title: 'Task to Delete',
        description: 'Description',
        authorId,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeIds: [],
      });

      const response = await firstValueFrom(
        client.send('tasks.delete', {
          id: task.id,
          userId: authorId,
        })
      );

      expect(response.success).toBe(true);
      expect(response.message).toBe('Task deleted');

      const deletedTask = await taskRepository.findOneBy({ id: task.id });
      expect(deletedTask).toBeNull();
    });

    test('should return error if task not found', async () => {
      const response = await firstValueFrom(
        client.send('tasks.delete', {
          id: randomUUID(),
          userId: randomUUID(),
        })
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('Task not found or unauthorized');
    });
  });

  describe('tasks.comments.create', () => {
    test('should create comment on task', async () => {
      const task = await taskRepository.save({
        title: 'Task with Comment',
        description: 'Description',
        authorId: randomUUID(),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeIds: [],
      });

      const response = await firstValueFrom(
        client.send('tasks.comments.create', {
          taskId: task.id,
          authorId: randomUUID(),
          content: 'This is a test comment',
        })
      );

      expect(response.success).toBe(true);
      expect(response.comment).toMatchObject({
        id: expect.any(String),
        content: 'This is a test comment',
        taskId: task.id,
      });

      const comment = await commentRepository.findOneBy({ id: response.comment.id });
      expect(comment).toBeTruthy();
      expect(comment?.content).toBe('This is a test comment');
    });

    test('should return error if task not found', async () => {
      const response = await firstValueFrom(
        client.send('tasks.comments.create', {
          taskId: randomUUID(),
          authorId: randomUUID(),
          content: 'Comment on non-existent task',
        })
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('Task not found');
    });
  });

  describe('tasks.comments.fetch', () => {
    test('should fetch comments with pagination', async () => {
      const task = await taskRepository.save({
        title: 'Task with Many Comments',
        description: 'Description',
        authorId: randomUUID(),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeIds: [],
      });

      for (let i = 0; i < 5; i++) {
        await commentRepository.save({
          content: `Comment ${i}`,
          authorId: randomUUID(),
          taskId: task.id,
        });
      }

      const response = await firstValueFrom(
        client.send('tasks.comments.fetch', {
          taskId: task.id,
          page: 1,
          size: 3,
        })
      );

      expect(response.success).toBe(true);
      expect(response.comments).toBeInstanceOf(Array);
      expect(response.comments.length).toBeLessThanOrEqual(3);
      expect(response.total).toBeGreaterThanOrEqual(5);
    });

    test('should return error if task not found', async () => {
      const response = await firstValueFrom(
        client.send('tasks.comments.fetch', {
          taskId: randomUUID(),
          page: 1,
          size: 20,
        })
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('Task not found');
    });
  });
});