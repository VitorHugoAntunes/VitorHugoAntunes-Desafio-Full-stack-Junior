import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TasksProxyService {
  constructor(
    @Inject('TASKS_SERVICE')
    private tasksService: ClientProxy,
  ) {}

  async createTask(data: any) {
    return firstValueFrom(
      this.tasksService.send('tasks.create', data)
    );
  }

  async fetchTasks(data: { page: number; size: number; search?: string; status?: string; priority?: string }) {
    return firstValueFrom(
      this.tasksService.send('tasks.fetch', data)
    );
  }

  async getTask(id: string) {
    return firstValueFrom(
      this.tasksService.send('tasks.get', { id })
    );
  }

  async getTaskStats() {
    return firstValueFrom(
      this.tasksService.send('tasks.stats', {})
    );
  }

  async updateTask(data: { id: string; userId: string; updates: any }) {
    return firstValueFrom(
      this.tasksService.send('tasks.update', data)
    );
  }

  async deleteTask(data: { id: string; userId: string }) {
    return firstValueFrom(
      this.tasksService.send('tasks.delete', data)
    );
  }

  async getTaskHistory(data: { taskId: string; page: number; size: number }) {
    return firstValueFrom(
      this.tasksService.send('tasks.history', data)
    );
  }

  async createComment(data: { taskId: string; authorId: string; content: string }) {
    return firstValueFrom(
      this.tasksService.send('tasks.comments.create', data)
    );
  }

  async fetchComments(data: { taskId: string; page: number; size: number }) {
    return firstValueFrom(
      this.tasksService.send('tasks.comments.fetch', data)
    );
  }
}