import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WsAuthGuard } from '@/modules/notifications-proxy/guards/ws-auth.guard';
import { NotificationsProxyService } from '../services/notifications-proxy.service';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsProxyGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsProxyGateway.name);
  private userSockets = new Map<string, string>();

  constructor(
    private notificationsProxyService: NotificationsProxyService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client attempting to connect: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    } else {
      this.logger.log(`Anonymous client disconnected: ${client.id}`);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('authenticate')
  async handleAuthenticate(@ConnectedSocket() client: Socket) {
    const userId = client.data.user?.sub;

    console.log('Authenticating client:', client.id, 'for user:', userId);
    
    if (!userId) {
      this.logger.error(`Authentication failed: No user ID found for client ${client.id}`);
      return {
        event: 'error',
        data: { message: 'Authentication failed: No user ID' },
      };
    }

    this.logger.log(`User authenticated: ${userId} (socket: ${client.id})`);
    this.userSockets.set(userId, client.id);
    
    try {
      const notificationsResponse = await this.notificationsProxyService.fetchNotifications({
        userId,
        page: 1,
        size: 50,
      });

      if (!notificationsResponse.success) {
        throw new Error('Failed to fetch notifications');
      }

      const unreadResponse = await this.notificationsProxyService.getUnreadCount({ userId });
      const unreadCount = unreadResponse.success ? unreadResponse.count : 0;
      
      const unreadNotifications = notificationsResponse.notifications.filter(
        (n: any) => !n.isRead
      );

      this.logger.log(`Sending ${unreadNotifications.length} unread notifications to user ${userId}`);
      
      return {
        event: 'authenticated',
        data: {
          userId,
          unreadCount,
          totalCount: notificationsResponse.total,
          notifications: unreadNotifications,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching notifications for user ${userId}:`, error.message);
      return {
        event: 'error',
        data: { message: 'Failed to fetch notifications' },
      };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = client.data.user?.sub;
    
    if (!userId) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }

    this.logger.log(`Marking notification ${data.notificationId} as read for user ${userId}`);
    
    try {
      const response = await this.notificationsProxyService.markAsRead({
        userId,
        notificationId: data.notificationId,
      });

      if (response.success) {
        return { event: 'notification_read', data: { id: data.notificationId } };
      }

      return { event: 'error', data: { message: 'Failed to mark as read' } };
    } catch (error) {
      this.logger.error(`Error marking notification as read:`, error.message);
      return { event: 'error', data: { message: 'Failed to mark as read' } };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('mark_all_as_read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    const userId = client.data.user?.sub;
    
    if (!userId) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }

    this.logger.log(`Marking all notifications as read for user ${userId}`);
    
    try {
      const response = await this.notificationsProxyService.markAllAsRead({ userId });

      if (response.success) {
        return { event: 'all_notifications_read' };
      }

      return { event: 'error', data: { message: 'Failed to mark all as read' } };
    } catch (error) {
      this.logger.error(`Error marking all as read:`, error.message);
      return { event: 'error', data: { message: 'Failed to mark all as read' } };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { page?: number; size?: number },
  ) {
    const userId = client.data.user?.sub;
    
    if (!userId) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }

    const page = data.page || 1;
    const size = data.size || 20;

    this.logger.log(`Fetching notifications for user ${userId} (page: ${page}, size: ${size})`);

    try {
      const response = await this.notificationsProxyService.fetchNotifications({
        userId,
        page,
        size,
      });

      if (!response.success) {
        throw new Error('Failed to fetch notifications');
      }

      return {
        event: 'notifications_list',
        data: {
          notifications: response.notifications,
          total: response.total,
          page: response.page,
          size: response.size,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching notifications:`, error.message);
      return { event: 'error', data: { message: 'Failed to fetch notifications' } };
    }
  }

  sendToUser(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.logger.log(`📤 Sending notification to user ${userId} (socket: ${socketId})`);
      this.server.to(socketId).emit('notification', notification);
    } else {
      this.logger.warn(`User ${userId} not connected, cannot send notification`);
    }
  }

  sendToUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, notification);
    });
  }
}