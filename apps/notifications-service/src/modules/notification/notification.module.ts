import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { Notification } from './entities/notification.entity';
import { RABBITMQ_CONFIG, API_GATEWAY_CLIENT } from '../../config/rabbitmq.config';
import { NotificationsRepository } from './repositories/notification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    ClientsModule.register([
      {
        name: API_GATEWAY_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
          ...RABBITMQ_CONFIG,
          queue: 'api_gateway_queue',
        },
      },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}