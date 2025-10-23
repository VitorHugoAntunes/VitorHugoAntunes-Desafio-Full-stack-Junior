import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TasksProxyService } from './services/tasks-proxy.service';
import {
  CreateTaskProxyController,
  FetchTasksProxyController,
  GetTaskProxyController,
  UpdateTaskProxyController,
  DeleteTaskProxyController,
  CreateCommentProxyController,
  FetchCommentsProxyController,
  TaskHistoryProxyController,
  TaskStatsProxyController,
} from './controllers';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TASKS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
          queue: 'tasks_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [
    CreateTaskProxyController,
    FetchTasksProxyController,
    GetTaskProxyController,
    UpdateTaskProxyController,
    DeleteTaskProxyController,
    CreateCommentProxyController,
    FetchCommentsProxyController,
    TaskHistoryProxyController,
    TaskStatsProxyController,
  ],
  providers: [TasksProxyService],
  exports: [TasksProxyService],
})
export class TasksProxyModule {}