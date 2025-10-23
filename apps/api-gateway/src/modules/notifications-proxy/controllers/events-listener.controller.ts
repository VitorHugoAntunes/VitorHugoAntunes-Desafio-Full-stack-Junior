import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { NotificationsProxyGateway } from '../gateways/notifications.gateway';

@Controller()
export class EventsListenerController {
  constructor(
    private notificationsGateway: NotificationsProxyGateway,
  ) {}

  @EventPattern('task.created')
  async handleTaskCreated(data: {
    id: string;
    title: string;
    authorId: string;
    assigneeIds: string[];
  }) {
    if (!data.assigneeIds || data.assigneeIds.length === 0) {
      return;
    }

    const assigneesToNotify = data.assigneeIds.filter(id => id !== data.authorId);

    if (assigneesToNotify.length === 0) {
      return;
    }
  }

  @EventPattern('notification.created')
  async handleNotificationCreated(data: {
    userId: string;
    notification: any;
  }) {

    this.notificationsGateway.sendToUser(data.userId, data.notification);
  }

  @EventPattern('notification.broadcast')
  async handleNotificationBroadcast(data: {
    userIds: string[];
    notification: any;
  }) {
    
    this.notificationsGateway.sendToUsers(data.userIds, data.notification);
  }
}
