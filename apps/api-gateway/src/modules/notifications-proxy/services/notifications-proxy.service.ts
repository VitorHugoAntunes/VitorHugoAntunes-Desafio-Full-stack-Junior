import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationsProxyService {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE')
    private notificationsService: ClientProxy,
  ) {}

  async fetchNotifications(data: { userId: string; page: number; size: number }) {
    return firstValueFrom(
      this.notificationsService.send('notifications.fetch', data)
    );
  }

  async markAsRead(data: { userId: string; notificationId: string }) {
    return firstValueFrom(
      this.notificationsService.send('notifications.mark_as_read', data)
    );
  }

  async markAllAsRead(data: { userId: string }) {
    return firstValueFrom(
      this.notificationsService.send('notifications.mark_all_as_read', data)
    );
  }

  async getUnreadCount(data: { userId: string }) {
    return firstValueFrom(
      this.notificationsService.send('notifications.unread_count', data)
    );
  }
}