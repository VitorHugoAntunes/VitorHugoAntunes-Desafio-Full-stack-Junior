import { describe, test, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { Notification, NotificationType } from '../src/modules/notification/entities/notification.entity';

describe('Notifications Service - Message Patterns (E2E)', () => {
  let app: INestApplication;
  let client: ClientProxy;
  let notificationRepository: Repository<Notification>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'NOTIFICATIONS_SERVICE',
            transport: Transport.RMQ,
            options: {
              urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
              queue: 'notifications_queue_test',
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
        queue: 'notifications_queue_test',
        queueOptions: {
          durable: true,
        },
      },
    });

    await app.startAllMicroservices();
    await app.init();

    client = app.get('NOTIFICATIONS_SERVICE');
    await client.connect();

    notificationRepository = moduleRef.get<Repository<Notification>>(
      getRepositoryToken(Notification)
    );
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  beforeEach(async () => {
    await notificationRepository.clear();
  });

  describe('notifications.fetch', () => {
    test('should fetch notifications with pagination', async () => {
      const userId = randomUUID();
      const taskId = randomUUID();

      for (let i = 0; i < 5; i++) {
        await notificationRepository.save({
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: `Task ${i}` },
          isRead: i % 2 === 0,
        });
      }

      const response = await firstValueFrom(
        client.send('notifications.fetch', {
          userId,
          page: 1,
          size: 3,
        })
      );

      expect(response.success).toBe(true);
      expect(response.notifications).toBeInstanceOf(Array);
      expect(response.notifications.length).toBeLessThanOrEqual(3);
      expect(response.total).toBeGreaterThanOrEqual(5);
      expect(response.page).toBe(1);
      expect(response.size).toBe(3);
    });

    test('should return empty array for user with no notifications', async () => {
      const response = await firstValueFrom(
        client.send('notifications.fetch', {
          userId: randomUUID(),
          page: 1,
          size: 20,
        })
      );

      expect(response.success).toBe(true);
      expect(response.notifications).toEqual([]);
      expect(response.total).toBe(0);
    });

    test('should handle page 2 correctly', async () => {
      const userId = randomUUID();
      const taskId = randomUUID();

      for (let i = 0; i < 15; i++) {
        await notificationRepository.save({
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: `Task ${i}` },
          isRead: false,
        });
      }

      const response = await firstValueFrom(
        client.send('notifications.fetch', {
          userId,
          page: 2,
          size: 10,
        })
      );

      expect(response.success).toBe(true);
      expect(response.notifications.length).toBe(5);
      expect(response.page).toBe(2);
      expect(response.total).toBe(15);
    });
  });

  describe('notifications.mark_as_read', () => {
    test('should mark notification as read', async () => {
      const userId = randomUUID();
      const notification = await notificationRepository.save({
        userId,
        taskId: randomUUID(),
        type: NotificationType.TASK_ASSIGNED,
        data: { taskTitle: 'Test Task' },
        isRead: false,
      });

      const response = await firstValueFrom(
        client.send('notifications.mark_as_read', {
          userId,
          notificationId: notification.id,
        })
      );

      expect(response.success).toBe(true);

      const updated = await notificationRepository.findOneBy({ id: notification.id });
      expect(updated?.isRead).toBe(true);
    });

    test('should not mark notification of different user', async () => {
      const notification = await notificationRepository.save({
        userId: randomUUID(),
        taskId: randomUUID(),
        type: NotificationType.TASK_ASSIGNED,
        data: { taskTitle: 'Test Task' },
        isRead: false,
      });

      const response = await firstValueFrom(
        client.send('notifications.mark_as_read', {
          userId: randomUUID(), // Different user
          notificationId: notification.id,
        })
      );

      expect(response.success).toBe(false);

      const unchanged = await notificationRepository.findOneBy({ id: notification.id });
      expect(unchanged?.isRead).toBe(false);
    });

    test('should handle non-existent notification', async () => {
      const response = await firstValueFrom(
        client.send('notifications.mark_as_read', {
          userId: randomUUID(),
          notificationId: randomUUID(),
        })
      );

      expect(response.success).toBe(false);
    });
  });

  describe('notifications.mark_all_as_read', () => {
    test('should mark all user notifications as read', async () => {
      const userId = randomUUID();
      const taskId = randomUUID();

      await notificationRepository.save([
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 1' },
          isRead: false,
        },
        {
          userId,
          taskId,
          type: NotificationType.TASK_STATUS_CHANGED,
          data: { taskTitle: 'Task 2' },
          isRead: false,
        },
        {
          userId,
          taskId,
          type: NotificationType.TASK_COMMENT_ADDED,
          data: { taskTitle: 'Task 3' },
          isRead: false,
        },
      ]);

      const response = await firstValueFrom(
        client.send('notifications.mark_all_as_read', { userId })
      );

      expect(response.success).toBe(true);

      const notifications = await notificationRepository.find({ where: { userId } });
      expect(notifications.every(n => n.isRead)).toBe(true);
    });

    test('should only mark notifications for specific user', async () => {
      const user1 = randomUUID();
      const user2 = randomUUID();
      const taskId = randomUUID();

      await notificationRepository.save([
        {
          userId: user1,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 1' },
          isRead: false,
        },
        {
          userId: user2,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 2' },
          isRead: false,
        },
      ]);

      await firstValueFrom(
        client.send('notifications.mark_all_as_read', { userId: user1 })
      );

      const user1Notifications = await notificationRepository.find({ where: { userId: user1 } });
      expect(user1Notifications.every(n => n.isRead)).toBe(true);

      const user2Notifications = await notificationRepository.find({ where: { userId: user2 } });
      expect(user2Notifications.every(n => !n.isRead)).toBe(true);
    });

    test('should not affect already read notifications', async () => {
      const userId = randomUUID();
      const taskId = randomUUID();

      await notificationRepository.save([
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 1' },
          isRead: true,
        },
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 2' },
          isRead: false,
        },
      ]);

      const response = await firstValueFrom(
        client.send('notifications.mark_all_as_read', { userId })
      );

      expect(response.success).toBe(true);

      const notifications = await notificationRepository.find({ where: { userId } });
      expect(notifications).toHaveLength(2);
      expect(notifications.every(n => n.isRead)).toBe(true);
    });
  });

  describe('notifications.unread_count', () => {
    test('should return correct unread count', async () => {
      const userId = randomUUID();
      const taskId = randomUUID();

      await notificationRepository.save([
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 1' },
          isRead: false,
        },
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 2' },
          isRead: false,
        },
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 3' },
          isRead: false,
        },
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 4' },
          isRead: true,
        },
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 5' },
          isRead: true,
        },
      ]);

      const response = await firstValueFrom(
        client.send('notifications.unread_count', { userId })
      );

      expect(response.success).toBe(true);
      expect(response.count).toBe(3);
    });

    test('should return 0 when all notifications are read', async () => {
      const userId = randomUUID();
      const taskId = randomUUID();

      await notificationRepository.save([
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 1' },
          isRead: true,
        },
        {
          userId,
          taskId,
          type: NotificationType.TASK_ASSIGNED,
          data: { taskTitle: 'Task 2' },
          isRead: true,
        },
      ]);

      const response = await firstValueFrom(
        client.send('notifications.unread_count', { userId })
      );

      expect(response.success).toBe(true);
      expect(response.count).toBe(0);
    });
  });

  describe('Event Patterns - task.created', () => {
    test('should create notifications when task is created with assignees', async () => {
      const authorId = randomUUID();
      const assignee1 = randomUUID();
      const assignee2 = randomUUID();
      const taskId = randomUUID();

      client.emit('task.created', {
        id: taskId,
        title: 'New Task',
        authorId,
        assigneeIds: [assignee1, assignee2],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const notifications = await notificationRepository.find({
        where: { taskId },
      });

      expect(notifications).toHaveLength(2);
      expect(notifications.map(n => n.userId).sort()).toEqual([assignee1, assignee2].sort());
      expect(notifications.every(n => n.type === NotificationType.TASK_ASSIGNED)).toBe(true);
      expect(notifications.every(n => !n.isRead)).toBe(true);
    });

    test('should not notify author if they are assignee', async () => {
      const authorId = randomUUID();
      const taskId = randomUUID();

      client.emit('task.created', {
        id: taskId,
        title: 'Self Assigned Task',
        authorId,
        assigneeIds: [authorId],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const notifications = await notificationRepository.find({
        where: { taskId },
      });

      expect(notifications).toHaveLength(0);
    });

    test('should not create notifications if no assignees', async () => {
      const taskId = randomUUID();

      client.emit('task.created', {
        id: taskId,
        title: 'Task Without Assignees',
        authorId: randomUUID(),
        assigneeIds: [],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const notifications = await notificationRepository.find({
        where: { taskId },
      });

      expect(notifications).toHaveLength(0);
    });
  });

  describe('Event Patterns - task.updated', () => {
    test('should create notifications for status change', async () => {
      const authorId = randomUUID();
      const assignee = randomUUID();
      const updater = randomUUID();
      const taskId = randomUUID();

      client.emit('task.updated', {
        id: taskId,
        title: 'Updated Task',
        authorId,
        assigneeIds: [assignee],
        previousAssigneeIds: [assignee],
        status: 'IN_PROGRESS',
        previousStatus: 'TODO',
        updatedBy: updater,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const notifications = await notificationRepository.find({
        where: { taskId, type: NotificationType.TASK_STATUS_CHANGED },
      });

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.some(n => n.userId === authorId)).toBe(true);
      expect(notifications.some(n => n.userId === assignee)).toBe(true);
      expect(notifications.every(n => n.userId !== updater)).toBe(true);
    });

    test('should create notifications for new assignees', async () => {
      const authorId = randomUUID();
      const oldAssignee = randomUUID();
      const newAssignee = randomUUID();
      const taskId = randomUUID();

      client.emit('task.updated', {
        id: taskId,
        title: 'Task with New Assignee',
        authorId,
        assigneeIds: [oldAssignee, newAssignee],
        previousAssigneeIds: [oldAssignee],
        updatedBy: authorId,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const assignmentNotifications = await notificationRepository.find({
        where: { taskId, type: NotificationType.TASK_ASSIGNED },
      });

      expect(assignmentNotifications).toHaveLength(1);
      expect(assignmentNotifications[0].userId).toBe(newAssignee);
    });

    test('should not create notifications if no changes', async () => {
      const taskId = randomUUID();

      client.emit('task.updated', {
        id: taskId,
        title: 'Unchanged Task',
        authorId: randomUUID(),
        assigneeIds: [randomUUID()],
        previousAssigneeIds: [randomUUID()],
        status: 'TODO',
        previousStatus: 'TODO',
        updatedBy: randomUUID(),
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusNotifications = await notificationRepository.find({
        where: { taskId, type: NotificationType.TASK_STATUS_CHANGED },
      });

      expect(statusNotifications).toHaveLength(0);
    });
  });

  describe('Event Patterns - task.comment.created', () => {
    test('should notify task author and assignees about new comment', async () => {
      const taskId = randomUUID();
      const authorId = randomUUID();
      const commentAuthorId = randomUUID();
      const assignee1 = randomUUID();
      const assignee2 = randomUUID();

      client.emit('task.comment.created', {
        taskId,
        comment: {
          id: randomUUID(),
          content: 'This is a test comment',
          authorId: commentAuthorId,
        },
        taskTitle: 'Test Task',
        taskAuthorId: authorId,
        taskAssigneeIds: [assignee1, assignee2],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const notifications = await notificationRepository.find({
        where: { taskId, type: NotificationType.TASK_COMMENT_ADDED },
      });

      expect(notifications).toHaveLength(3);
      expect(notifications.map(n => n.userId).sort()).toEqual(
        [authorId, assignee1, assignee2].sort()
      );
      expect(notifications.every(n => n.userId !== commentAuthorId)).toBe(true);
    });

    test('should not notify comment author', async () => {
      const taskId = randomUUID();
      const commentAuthorId = randomUUID();

      client.emit('task.comment.created', {
        taskId,
        comment: {
          id: randomUUID(),
          content: 'My own comment',
          authorId: commentAuthorId,
        },
        taskTitle: 'Test Task',
        taskAuthorId: commentAuthorId,
        taskAssigneeIds: [commentAuthorId],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const notifications = await notificationRepository.find({
        where: { taskId, type: NotificationType.TASK_COMMENT_ADDED },
      });

      expect(notifications).toHaveLength(0);
    });
  });

  describe('Notification Types', () => {
    test('should correctly store TASK_ASSIGNED type', async () => {
      const userId = randomUUID();
      const notification = await notificationRepository.save({
        userId,
        taskId: randomUUID(),
        type: NotificationType.TASK_ASSIGNED,
        data: { taskTitle: 'Test', assignedBy: randomUUID() },
        isRead: false,
      });

      const stored = await notificationRepository.findOneBy({ id: notification.id });
      expect(stored?.type).toBe(NotificationType.TASK_ASSIGNED);
    });

    test('should correctly store TASK_STATUS_CHANGED type', async () => {
      const userId = randomUUID();
      const notification = await notificationRepository.save({
        userId,
        taskId: randomUUID(),
        type: NotificationType.TASK_STATUS_CHANGED,
        data: { 
          taskTitle: 'Test', 
          previousStatus: 'TODO', 
          newStatus: 'IN_PROGRESS' 
        },
        isRead: false,
      });

      const stored = await notificationRepository.findOneBy({ id: notification.id });
      expect(stored?.type).toBe(NotificationType.TASK_STATUS_CHANGED);
    });

    test('should correctly store TASK_COMMENT_ADDED type', async () => {
      const userId = randomUUID();
      const notification = await notificationRepository.save({
        userId,
        taskId: randomUUID(),
        type: NotificationType.TASK_COMMENT_ADDED,
        data: { 
          taskTitle: 'Test', 
          commentAuthor: randomUUID(),
          commentPreview: 'Preview text'
        },
        isRead: false,
      });

      const stored = await notificationRepository.findOneBy({ id: notification.id });
      expect(stored?.type).toBe(NotificationType.TASK_COMMENT_ADDED);
    });
  });
});