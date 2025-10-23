import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from '../repositories/notification.repository';
import { NotificationType } from '../entities/notification.entity';

describe('NotificationsService (Unit)', () => {
  let notificationsService: NotificationsService;
  let notificationsRepository: NotificationsRepository;
  let apiGatewayClient: ClientProxy;

  beforeEach(() => {
    notificationsRepository = {
      createNotification: vi.fn(),
      fetchNotifications: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      getUnreadCount: vi.fn(),
    } as any;

    apiGatewayClient = {
      emit: vi.fn().mockReturnValue(of({})),
    } as any;

    notificationsService = new NotificationsService(
      notificationsRepository,
      apiGatewayClient,
    );
  });

  describe('handleTaskCreated', () => {
    test('should create notifications for assignees (excluding author)', async () => {
      const taskData = {
        id: 'task-1',
        title: 'Test Task',
        authorId: 'user-1',
        assigneeIds: ['user-2', 'user-3'],
      };

      const mockNotification = {
        id: 'notif-1',
        userId: 'user-2',
        taskId: 'task-1',
        type: NotificationType.TASK_ASSIGNED,
        data: {
          taskTitle: 'Test Task',
          assignedBy: 'user-1',
        },
        isRead: false,
        createdAt: new Date(),
      };

      (notificationsRepository.createNotification as any).mockResolvedValue(mockNotification);

      await notificationsService.handleTaskCreated(taskData);

      expect(notificationsRepository.createNotification).toHaveBeenCalledTimes(2);
      
      expect(apiGatewayClient.emit).toHaveBeenCalledTimes(2);
      expect(apiGatewayClient.emit).toHaveBeenCalledWith('notification.created', {
        userId: 'user-2',
        notification: mockNotification,
      });
    });

    test('should not create notifications if no assignees', async () => {
      const taskData = {
        id: 'task-1',
        title: 'Test Task',
        authorId: 'user-1',
        assigneeIds: [],
      };

      await notificationsService.handleTaskCreated(taskData);

      expect(notificationsRepository.createNotification).not.toHaveBeenCalled();
      expect(apiGatewayClient.emit).not.toHaveBeenCalled();
    });

    test('should not notify author if they are the only assignee', async () => {
      const taskData = {
        id: 'task-1',
        title: 'Test Task',
        authorId: 'user-1',
        assigneeIds: ['user-1'],
      };

      await notificationsService.handleTaskCreated(taskData);

      expect(notificationsRepository.createNotification).not.toHaveBeenCalled();
      expect(apiGatewayClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleTaskUpdated', () => {
    test('should create status change notification for all users except updater', async () => {
      const taskData = {
        id: 'task-1',
        title: 'Test Task',
        authorId: 'user-1',
        assigneeIds: ['user-2', 'user-3'],
        previousAssigneeIds: ['user-2', 'user-3'],
        status: 'IN_PROGRESS',
        previousStatus: 'TODO',
        updatedBy: 'user-2',
      };

      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        taskId: 'task-1',
        type: NotificationType.TASK_STATUS_CHANGED,
        data: {
          taskTitle: 'Test Task',
          previousStatus: 'TODO',
          newStatus: 'IN_PROGRESS',
        },
        isRead: false,
        createdAt: new Date(),
      };

      (notificationsRepository.createNotification as any).mockResolvedValue(mockNotification);

      await notificationsService.handleTaskUpdated(taskData);

      expect(notificationsRepository.createNotification).toHaveBeenCalledTimes(2);
      expect(apiGatewayClient.emit).toHaveBeenCalledTimes(2);
    });

    test('should create notifications for new assignees', async () => {
      const taskData = {
        id: 'task-1',
        title: 'Test Task',
        authorId: 'user-1',
        assigneeIds: ['user-2', 'user-3', 'user-4'],
        previousAssigneeIds: ['user-2'],
        updatedBy: 'user-1',
      };

      const mockNotification = {
        id: 'notif-1',
        userId: 'user-3',
        taskId: 'task-1',
        type: NotificationType.TASK_ASSIGNED,
        data: {
          taskTitle: 'Test Task',
          assignedBy: 'user-1',
        },
        isRead: false,
        createdAt: new Date(),
      };

      (notificationsRepository.createNotification as any).mockResolvedValue(mockNotification);

      await notificationsService.handleTaskUpdated(taskData);

      expect(notificationsRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-3',
          type: NotificationType.TASK_ASSIGNED,
        })
      );
      expect(notificationsRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-4',
          type: NotificationType.TASK_ASSIGNED,
        })
      );
    });

    test('should not create notifications if status unchanged', async () => {
      const taskData = {
        id: 'task-1',
        title: 'Test Task',
        authorId: 'user-1',
        assigneeIds: ['user-2'],
        previousAssigneeIds: ['user-2'],
        status: 'TODO',
        previousStatus: 'TODO',
        updatedBy: 'user-1',
      };

      await notificationsService.handleTaskUpdated(taskData);

      expect(notificationsRepository.createNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleCommentCreated', () => {
    test('should notify task author and assignees (excluding comment author)', async () => {
      const commentData = {
        taskId: 'task-1',
        comment: {
          id: 'comment-1',
          content: 'This is a test comment',
          authorId: 'user-2',
        },
        taskTitle: 'Test Task',
        taskAuthorId: 'user-1',
        taskAssigneeIds: ['user-2', 'user-3'],
      };

      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        taskId: 'task-1',
        type: NotificationType.TASK_COMMENT_ADDED,
        data: {
          taskTitle: 'Test Task',
          commentAuthor: 'user-2',
          commentPreview: 'This is a test comment',
        },
        isRead: false,
        createdAt: new Date(),
      };

      (notificationsRepository.createNotification as any).mockResolvedValue(mockNotification);

      await notificationsService.handleCommentCreated(commentData);
      
      expect(notificationsRepository.createNotification).toHaveBeenCalledTimes(2);
      expect(apiGatewayClient.emit).toHaveBeenCalledTimes(2);
    });

    test('should not notify if comment author is the only user', async () => {
      const commentData = {
        taskId: 'task-1',
        comment: {
          id: 'comment-1',
          content: 'Test comment',
          authorId: 'user-1',
        },
        taskTitle: 'Test Task',
        taskAuthorId: 'user-1',
        taskAssigneeIds: ['user-1'],
      };

      await notificationsService.handleCommentCreated(commentData);

      expect(notificationsRepository.createNotification).not.toHaveBeenCalled();
      expect(apiGatewayClient.emit).not.toHaveBeenCalled();
    });

    test('should truncate long comment previews', async () => {
      const longComment = 'A'.repeat(150);
      const commentData = {
        taskId: 'task-1',
        comment: {
          id: 'comment-1',
          content: longComment,
          authorId: 'user-2',
        },
        taskTitle: 'Test Task',
        taskAuthorId: 'user-1',
        taskAssigneeIds: [],
      };

      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        taskId: 'task-1',
        type: NotificationType.TASK_COMMENT_ADDED,
        data: {
          taskTitle: 'Test Task',
          commentAuthor: 'user-2',
          commentPreview: longComment.substring(0, 100),
        },
        isRead: false,
        createdAt: new Date(),
      };

      (notificationsRepository.createNotification as any).mockResolvedValue(mockNotification);

      await notificationsService.handleCommentCreated(commentData);

      expect(notificationsRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commentPreview: expect.stringContaining('A'.repeat(100)),
          }),
        })
      );
    });
  });

  describe('fetchNotifications', () => {
    test('should fetch notifications with pagination', async () => {
      const fetchData = {
        userId: 'user-1',
        page: 1,
        size: 20,
      };

      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          taskId: 'task-1',
          type: NotificationType.TASK_ASSIGNED,
          data: {},
          isRead: false,
          createdAt: new Date(),
        },
      ];

      (notificationsRepository.fetchNotifications as any).mockResolvedValue({
        notifications: mockNotifications,
        total: 10,
      });

      const result = await notificationsService.fetchNotifications(fetchData);

      expect(notificationsRepository.fetchNotifications).toHaveBeenCalledWith(fetchData);
      expect(result).toEqual({
        success: true,
        notifications: mockNotifications,
        total: 10,
        page: 1,
        size: 20,
      });
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read', async () => {
      const readData = {
        userId: 'user-1',
        notificationId: 'notif-1',
      };

      (notificationsRepository.markAsRead as any).mockResolvedValue(true);

      const result = await notificationsService.markAsRead(readData);

      expect(notificationsRepository.markAsRead).toHaveBeenCalledWith(readData);
      expect(result).toEqual({ success: true });
    });
  });

  describe('markAllAsRead', () => {
    test('should mark all notifications as read', async () => {
      const readData = {
        userId: 'user-1',
      };

      (notificationsRepository.markAllAsRead as any).mockResolvedValue(undefined);

      const result = await notificationsService.markAllAsRead(readData);

      expect(notificationsRepository.markAllAsRead).toHaveBeenCalledWith(readData);
      expect(result).toEqual({ success: true });
    });
  });

  describe('getUnreadCount', () => {
    test('should get unread count', async () => {
      const countData = {
        userId: 'user-1',
      };

      (notificationsRepository.getUnreadCount as any).mockResolvedValue(5);

      const result = await notificationsService.getUnreadCount(countData);

      expect(notificationsRepository.getUnreadCount).toHaveBeenCalledWith(countData);
      expect(result).toEqual({ success: true, count: 5 });
    });
  });
});