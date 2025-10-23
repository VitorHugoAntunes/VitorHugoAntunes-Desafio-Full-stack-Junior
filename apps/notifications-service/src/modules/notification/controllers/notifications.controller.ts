import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, EventPattern, ClientProxy } from '@nestjs/microservices';
import { NotificationsService } from '../services/notifications.service';
import {
  FetchNotificationsDto,
  MarkAsReadDto,
  MarkAllAsReadDto,
  UnreadCountDto,
  TaskCreatedEventDto,
  TaskUpdatedEventDto,
  TaskCommentCreatedEventDto,
} from '../dtos/notification.dto';

@Controller()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject('API_GATEWAY') private apiGatewayClient: ClientProxy,
  ) {}

  @EventPattern('task.created')
  async handleTaskCreated(data: TaskCreatedEventDto) {
    return this.notificationsService.handleTaskCreated(data);
  }

  @EventPattern('task.updated')
  async handleTaskUpdated(data: TaskUpdatedEventDto) {
    return this.notificationsService.handleTaskUpdated(data);
  }

  @EventPattern('task.comment.created')
  async handleCommentCreated(data: TaskCommentCreatedEventDto) {
    return this.notificationsService.handleCommentCreated(data);
  }

  @MessagePattern('notifications.fetch')
  async fetchNotifications(data: FetchNotificationsDto) {
    return this.notificationsService.fetchNotifications(data);
  }

  @MessagePattern('notifications.mark_as_read')
  async markAsRead(data: MarkAsReadDto) {
    return this.notificationsService.markAsRead(data);
  }

  @MessagePattern('notifications.mark_all_as_read')
  async markAllAsRead(data: MarkAllAsReadDto) {
    return this.notificationsService.markAllAsRead(data);
  }

  @MessagePattern('notifications.unread_count')
  async getUnreadCount(data: UnreadCountDto) {
    return this.notificationsService.getUnreadCount(data);
  }
}