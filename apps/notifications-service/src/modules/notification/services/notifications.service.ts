import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsRepository } from '../repositories/notification.repository';
import {
  FetchNotificationsDto,
  MarkAsReadDto,
  MarkAllAsReadDto,
  UnreadCountDto,
  TaskCreatedEventDto,
  TaskUpdatedEventDto,
  TaskCommentCreatedEventDto,
} from '../dtos/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private notificationsRepository: NotificationsRepository,
    @Inject('API_GATEWAY') private apiGatewayClient: ClientProxy,
  ) {}

  async handleTaskCreated(data: TaskCreatedEventDto) {
    if (!data.assigneeIds?.length) {
      return;
    }

    const assigneesToNotify = data.assigneeIds.filter(
      (id) => id !== data.authorId,
    );

    if (!assigneesToNotify.length) {
      return;
    }

    for (const userId of assigneesToNotify) {
      const notification = await this.notificationsRepository.createNotification({
        userId,
        taskId: data.id,
        type: NotificationType.TASK_ASSIGNED,
        data: {
          taskTitle: data.title,
          assignedBy: data.authorId,
        },
      });

      this.apiGatewayClient.emit('notification.created', {
        userId,
        notification,
      });
    }
  }

  async handleTaskUpdated(data: TaskUpdatedEventDto) {
    if (data.status && data.previousStatus && data.status !== data.previousStatus) {
      const usersToNotify = new Set<string>([
        ...(data.assigneeIds || []),
        data.authorId,
      ]);

      if (data.updatedBy) {
        usersToNotify.delete(data.updatedBy);
      }

      const usersArray = Array.from(usersToNotify);

      if (usersArray.length) {
        for (const userId of usersArray) {
          const notification =
            await this.notificationsRepository.createNotification({
              userId,
              taskId: data.id,
              type: NotificationType.TASK_STATUS_CHANGED,
              data: {
                taskTitle: data.title,
                previousStatus: data.previousStatus,
                newStatus: data.status,
              },
            });

          this.apiGatewayClient.emit('notification.created', {
            userId,
            notification,
          });
        }
      }
    }

    const previousIds = new Set(data.previousAssigneeIds || []);
    const currentIds = new Set(data.assigneeIds || []);
    const newAssignees = [...currentIds].filter(
      (id) => !previousIds.has(id) && id !== data.authorId,
    );

    if (newAssignees.length) {
      for (const userId of newAssignees) {
        const notification =
          await this.notificationsRepository.createNotification({
            userId,
            taskId: data.id,
            type: NotificationType.TASK_ASSIGNED,
            data: {
              taskTitle: data.title,
              assignedBy: data.updatedBy || data.authorId,
            },
          });

        this.apiGatewayClient.emit('notification.created', {
          userId,
          notification,
        });
      }
    }
  }

  async handleCommentCreated(data: TaskCommentCreatedEventDto) {
    const usersToNotify = new Set<string>([
      ...(data.taskAssigneeIds || []),
      ...(data.taskAuthorId ? [data.taskAuthorId] : []),
    ]);

    usersToNotify.delete(data.comment.authorId);

    const usersArray = Array.from(usersToNotify);

    if (!usersArray.length) {
      return;
    }

    for (const userId of usersArray) {
      const notification = await this.notificationsRepository.createNotification({
        userId,
        taskId: data.taskId,
        type: NotificationType.TASK_COMMENT_ADDED,
        data: {
          taskTitle: data.taskTitle,
          commentAuthor: data.comment.authorId,
          commentPreview: data.comment.content.substring(0, 100),
        },
      });

      this.apiGatewayClient.emit('notification.created', {
        userId,
        notification,
      });
    }
  }

  async fetchNotifications(data: FetchNotificationsDto) {
    const { notifications, total } =
      await this.notificationsRepository.fetchNotifications(data);

    return {
      success: true,
      notifications,
      total,
      page: data.page,
      size: data.size,
    };
  }

  async markAsRead(data: MarkAsReadDto) {
    const success = await this.notificationsRepository.markAsRead(data);

    return {
      success,
    };
  }

  async markAllAsRead(data: MarkAllAsReadDto) {
    await this.notificationsRepository.markAllAsRead(data);

    return {
      success: true,
    };
  }

  async getUnreadCount(data: UnreadCountDto) {
    const count = await this.notificationsRepository.getUnreadCount(data);

    return {
      success: true,
      count,
    };
  }
}