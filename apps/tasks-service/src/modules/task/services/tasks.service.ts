import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TasksRepository } from '../repositories/tasks.repository';
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
import { TaskStatus } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    private tasksRepository: TasksRepository,
    @Inject('NOTIFICATIONS_SERVICE')
    private notificationsClient: ClientProxy,
  ) {}

  async createTask(data: CreateTaskDto) {
    const savedTask = await this.tasksRepository.createTask(data);

    this.notificationsClient.emit('task.created', {
      id: savedTask.id,
      title: savedTask.title,
      authorId: savedTask.authorId,
      assigneeIds: savedTask.assigneeIds,
    });

    return {
      success: true,
      task: savedTask,
    };
  }

  async getTask(data: TaskIdDto) {
    const task = await this.tasksRepository.findTaskById(data.id);

    if (!task) {
      return {
        success: false,
        error: 'Task not found',
      };
    }

    return {
      success: true,
      task,
    };
  }

  async fetchTasks(data: FetchTasksDto) {
    const { tasks, total } = await this.tasksRepository.fetchTasks(data);

    return {
      success: true,
      tasks,
      total,
      page: data.page,
      size: data.size,
    };
  }

  async getTaskStats() {
    const tasks = await this.tasksRepository.getAllTasks();

    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
      inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      review: tasks.filter((t) => t.status === TaskStatus.REVIEW).length,
      done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
    };

    return {
      success: true,
      stats,
    };
  }

  async getTaskHistory(data: TaskHistoryDto) {
    const { history, total } = await this.tasksRepository.fetchTaskHistory(data);

    return {
      success: true,
      history,
      total,
    };
  }

  async updateTask(data: UpdateTaskDto) {
    const task = await this.tasksRepository.findTaskById(data.id);

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.authorId !== data.userId) {
      return { success: false, error: 'Unauthorized to update this task' };
    }

    const previousStatus = task.status;
    const previousAssigneeIds = [...(task.assigneeIds || [])];
    const changedFields: Record<string, any> = {};

    if (data.updates.title !== undefined && data.updates.title !== task.title) {
      changedFields.title = { from: task.title, to: data.updates.title };
    }
    if (
      data.updates.description !== undefined &&
      data.updates.description !== task.description
    ) {
      changedFields.description = {
        from: task.description,
        to: data.updates.description,
      };
    }
    if (
      data.updates.priority !== undefined &&
      data.updates.priority !== task.priority
    ) {
      changedFields.priority = { from: task.priority, to: data.updates.priority };
    }
    if (
      data.updates.status !== undefined &&
      data.updates.status !== task.status
    ) {
      changedFields.status = { from: task.status, to: data.updates.status };
    }
    if (data.updates.dueDate !== undefined) {
      const newDate = data.updates.dueDate
        ? new Date(data.updates.dueDate).toISOString()
        : null;
      const oldDate = task.dueDate ? new Date(task.dueDate).toISOString() : null;
      if (newDate !== oldDate) {
        changedFields.dueDate = { from: oldDate, to: newDate };
      }
    }
    if (data.updates.assigneeIds !== undefined) {
      const oldIds = (task.assigneeIds || []).sort().join(',');
      const newIds = (data.updates.assigneeIds || []).sort().join(',');
      if (oldIds !== newIds) {
        changedFields.assigneeIds = {
          from: task.assigneeIds || [],
          to: data.updates.assigneeIds || [],
        };
      }
    }

    if (Object.keys(changedFields).length === 0) {
      return {
        success: true,
        task,
        message: 'No changes detected',
      };
    }

    Object.assign(task, data.updates);
    const updatedTask = await this.tasksRepository.updateTask(task);
    await this.tasksRepository.createTaskHistory({
      taskId: task.id,
      userId: data.userId,
      changes: changedFields,
    });

    this.notificationsClient.emit('task.updated', {
      id: updatedTask.id,
      title: updatedTask.title,
      authorId: updatedTask.authorId,
      assigneeIds: updatedTask.assigneeIds,
      previousAssigneeIds,
      status: updatedTask.status,
      previousStatus,
      updatedBy: data.userId,
    });

    return {
      success: true,
      task: updatedTask,
    };
  }

  async deleteTask(data: DeleteTaskDto) {
    const task = await this.tasksRepository.findTaskByIdAndAuthor(data.id, data.userId);

    if (!task) {
      return { success: false, error: 'Task not found or unauthorized' };
    }

    await this.tasksRepository.deleteTask(data.id);
    this.notificationsClient.emit('task.deleted', { taskId: data.id });

    return {
      success: true,
      message: 'Task deleted',
    };
  }

  async createComment(data: CreateCommentDto) {
    const task = await this.tasksRepository.findTaskById(data.taskId);

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const savedComment = await this.tasksRepository.createComment(data);

    this.notificationsClient.emit('task.comment.created', {
      taskId: data.taskId,
      comment: savedComment,
      taskTitle: task.title,
      taskAuthorId: task.authorId,
      taskAssigneeIds: task.assigneeIds,
    });

    return {
      success: true,
      comment: savedComment,
    };
  }

  async fetchComments(data: FetchCommentsDto) {
    const task = await this.tasksRepository.findTaskById(data.taskId);

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const { comments, total } = await this.tasksRepository.fetchComments(data);

    return {
      success: true,
      comments,
      total,
    };
  }
}