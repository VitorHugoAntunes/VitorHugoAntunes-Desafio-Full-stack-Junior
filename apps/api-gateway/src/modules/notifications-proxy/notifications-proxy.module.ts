import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotificationsProxyGateway } from './gateways/notifications.gateway';
import { NotificationsProxyService } from './services/notifications-proxy.service';
import { EventsListenerController } from './controllers/events-listener.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
          queue: 'notifications_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [EventsListenerController],
  providers: [NotificationsProxyGateway, NotificationsProxyService],
  exports: [NotificationsProxyGateway, NotificationsProxyService],
})
export class NotificationsProxyModule {}