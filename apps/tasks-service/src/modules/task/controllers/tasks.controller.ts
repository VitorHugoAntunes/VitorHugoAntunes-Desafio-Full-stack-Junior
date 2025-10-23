import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TasksService } from '../services/tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  FetchTasksDto,
  TaskIdDto,
  DeleteTaskDto,
  CreateCommentDto,
  FetchCommentsDto,
  TaskHistoryDto,
} from '../dtos/task.dto';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @MessagePattern('tasks.create')
  async createTask(data: CreateTaskDto) {
    return this.tasksService.createTask(data);
  }

  @MessagePattern('tasks.get')
  async getTask(data: TaskIdDto) {
    return this.tasksService.getTask(data);
  }

  @MessagePattern('tasks.fetch')
  async fetchTasks(data: FetchTasksDto) {
    return this.tasksService.fetchTasks(data);
  }

  @MessagePattern('tasks.stats')
  async getTaskStats() {
    return this.tasksService.getTaskStats();
  }

  @MessagePattern('tasks.history')
  async getTaskHistory(data: TaskHistoryDto) {
    return this.tasksService.getTaskHistory(data);
  }

  @MessagePattern('tasks.update')
  async updateTask(data: UpdateTaskDto) {
    return this.tasksService.updateTask(data);
  }

  @MessagePattern('tasks.delete')
  async deleteTask(data: DeleteTaskDto) {
    return this.tasksService.deleteTask(data);
  }

  @MessagePattern('tasks.comments.create')
  async createComment(data: CreateCommentDto) {
    return this.tasksService.createComment(data);
  }

  @MessagePattern('tasks.comments.fetch')
  async fetchComments(data: FetchCommentsDto) {
    return this.tasksService.fetchComments(data);
  }
}