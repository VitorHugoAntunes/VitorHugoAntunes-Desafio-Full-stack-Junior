import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from '../entities/task.entity';
import { TaskHistory } from '../entities/task-history.entity';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class TasksRepository {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskHistory)
    private historyRepository: Repository<TaskHistory>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async createTask(data: {
    title: string;
    description: string;
    dueDate?: Date;
    priority?: TaskPriority;
    status?: TaskStatus;
    authorId: string;
    assigneeIds?: string[];
  }): Promise<Task> {
    const task = this.taskRepository.create({
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority ?? TaskPriority.MEDIUM,
      status: data.status ?? TaskStatus.TODO,
      authorId: data.authorId,
      assigneeIds: data.assigneeIds ?? [],
    });
    return this.taskRepository.save(task);
  }

  async findTaskById(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id } });
  }

  async findTaskByIdAndAuthor(id: string, authorId: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id, authorId } });
  }

  async fetchTasks(data: {
    page: number;
    size: number;
    search?: string;
    status?: string;
    priority?: string;
  }): Promise<{ tasks: Task[]; total: number }> {
    const { page, size, search, status, priority } = data;
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (status && status !== 'all') {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority && priority !== 'all') {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    queryBuilder
      .take(size)
      .skip((page - 1) * size)
      .orderBy('task.createdAt', 'DESC');

    const [tasks, total] = await queryBuilder.getManyAndCount();
    return { tasks, total };
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async updateTask(task: Task): Promise<Task> {
    return this.taskRepository.save(task);
  }

  async deleteTask(id: string): Promise<void> {
    await this.taskRepository.delete({ id });
  }

  async createTaskHistory(data: {
    taskId: string;
    userId: string;
    changes: Record<string, any>;
  }): Promise<TaskHistory> {
    const history = this.historyRepository.create({
      taskId: data.taskId,
      userId: data.userId,
      changes: data.changes,
    });
    return this.historyRepository.save(history);
  }

  async fetchTaskHistory(data: {
    taskId: string;
    page: number;
    size: number;
  }): Promise<{ history: TaskHistory[]; total: number }> {
    const { taskId, page, size } = data;
    const [history, total] = await this.historyRepository.findAndCount({
      where: { taskId },
      take: size,
      skip: (page - 1) * size,
      order: { createdAt: 'DESC' },
    });
    return { history, total };
  }

  async createComment(data: {
    taskId: string;
    authorId: string;
    content: string;
  }): Promise<Comment> {
    const comment = this.commentRepository.create({
      content: data.content,
      authorId: data.authorId,
      taskId: data.taskId,
    });
    return this.commentRepository.save(comment);
  }

  async fetchComments(data: {
    taskId: string;
    page: number;
    size: number;
  }): Promise<{ comments: Comment[]; total: number }> {
    const { taskId, page, size } = data;
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { taskId },
      take: size,
      skip: (page - 1) * size,
      order: { createdAt: 'DESC' },
    });
    return { comments, total };
  }
}