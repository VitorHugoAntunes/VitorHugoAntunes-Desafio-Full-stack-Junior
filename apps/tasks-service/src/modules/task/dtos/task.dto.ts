import { TaskPriority, TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  title: string;
  description: string;
  dueDate?: Date;
  priority?: TaskPriority;
  status?: TaskStatus;
  authorId: string;
  assigneeIds?: string[];
}

export class UpdateTaskDto {
  id: string;
  userId: string;
  updates: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: TaskPriority;
    status?: TaskStatus;
    assigneeIds?: string[];
  };
}

export class FetchTasksDto {
  page: number;
  size: number;
  search?: string;
  status?: string;
  priority?: string;
}

export class TaskIdDto {
  id: string;
}

export class DeleteTaskDto {
  id: string;
  userId: string;
}

export class CreateCommentDto {
  taskId: string;
  authorId: string;
  content: string;
}

export class FetchCommentsDto {
  taskId: string;
  page: number;
  size: number;
}

export class TaskHistoryDto {
  taskId: string;
  page: number;
  size: number;
}