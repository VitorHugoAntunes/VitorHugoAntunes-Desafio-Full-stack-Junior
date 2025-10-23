import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(data: {
    userId: string;
    taskId: string;
    type: NotificationType;
    data: Record<string, any>;
    isRead?: boolean;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      taskId: data.taskId,
      type: data.type,
      data: data.data,
      isRead: data.isRead ?? false,
    });
    return this.notificationRepository.save(notification);
  }

  async fetchNotifications(data: {
    userId: string;
    page: number;
    size: number;
  }): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId: data.userId },
      order: { createdAt: 'DESC' },
      take: data.size,
      skip: (data.page - 1) * data.size,
    });
    return { notifications, total };
  }

  async markAsRead(data: {
    userId: string;
    notificationId: string;
  }): Promise<boolean> {
    const result = await this.notificationRepository.update(
      { id: data.notificationId, userId: data.userId },
      { isRead: true },
    );
    return result.affected ? result.affected > 0 : false;
  }

  async markAllAsRead(data: { userId: string }): Promise<void> {
    await this.notificationRepository.update(
      { userId: data.userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(data: { userId: string }): Promise<number> {
    return this.notificationRepository.count({
      where: { userId: data.userId, isRead: false },
    });
  }
}