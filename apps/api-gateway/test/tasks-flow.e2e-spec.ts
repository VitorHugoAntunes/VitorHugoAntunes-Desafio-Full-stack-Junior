import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { ClassValidationPipe } from '../src/common/pipes/class-validation.pipe';

describe('API Gateway - Tasks Flow (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ClassValidationPipe());
    
    app.enableCors({
      origin: ['http://localhost:5173'],
      credentials: true,
    });

    await app.init();
    server = app.getHttpServer();

    const email = `tasks-user-${randomUUID()}@example.com`;
    const registerResponse = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Tasks Test User',
        email,
        password: 'password123',
      });

      
    userId = registerResponse.body.user.id;

    const loginResponse = await request(server)
      .post('/api/auth/login')
      .send({
        email,
        password: 'password123',
      });

    accessToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Tasks CRUD Flow', () => {
    test('should complete full CRUD: create -> fetch -> get -> update -> delete', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Test Task',
          description: 'Test Description',
          priority: 'HIGH',
          status: 'TODO',
        });

      expect(createResponse.statusCode).toBe(201);
      expect(createResponse.body).toHaveProperty('task');
      expect(createResponse.body.task).toHaveProperty('id');
      
      const taskId = createResponse.body.task.id;
      expect(createResponse.body.task.title).toBe('E2E Test Task');
      expect(createResponse.body.task.authorId).toBe(userId);

      const fetchResponse = await request(server)
        .get('/api/tasks?page=1&size=20')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(fetchResponse.statusCode).toBe(200);
      expect(fetchResponse.body).toHaveProperty('tasks');
      expect(Array.isArray(fetchResponse.body.tasks)).toBe(true);
      expect(fetchResponse.body).toHaveProperty('total');
      expect(fetchResponse.body).toHaveProperty('page', 1);
      expect(fetchResponse.body).toHaveProperty('size', 20);

      const getResponse = await request(server)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.body.id).toBe(taskId);
      expect(getResponse.body.title).toBe('E2E Test Task');

      const updateResponse = await request(server)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Task Title',
          status: 'IN_PROGRESS',
        });

      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.body).toHaveProperty('task');
      expect(updateResponse.body.task.title).toBe('Updated Task Title');
      expect(updateResponse.body.task.status).toBe('IN_PROGRESS');

      const deleteResponse = await request(server)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toHaveProperty('message', 'Task deleted');

      const getDeletedResponse = await request(server)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getDeletedResponse.statusCode).toBe(404);
    });
  });

  describe('Task Comments Flow', () => {
    test('should create and fetch comments', async () => {
      const createTaskResponse = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Task with Comments',
          description: 'Description',
        });

      const taskId = createTaskResponse.body.task.id;

      const createCommentResponse = await request(server)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test comment',
        });

      expect(createCommentResponse.statusCode).toBe(201);
      expect(createCommentResponse.body).toHaveProperty('comment');
      expect(createCommentResponse.body.comment).toHaveProperty('id');
      expect(createCommentResponse.body.comment.content).toBe('This is a test comment');

      const fetchCommentsResponse = await request(server)
        .get(`/api/tasks/${taskId}/comments?page=1&size=20`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(fetchCommentsResponse.statusCode).toBe(200);
      expect(fetchCommentsResponse.body).toHaveProperty('comments');
      expect(Array.isArray(fetchCommentsResponse.body.comments)).toBe(true);
      expect(fetchCommentsResponse.body.comments.length).toBeGreaterThan(0);
      expect(fetchCommentsResponse.body).toHaveProperty('total');
    });

    test('should fail to create comment on non-existent task', async () => {
      const response = await request(server)
        .post(`/api/tasks/${randomUUID()}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Comment on non-existent task',
        });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Task History', () => {
    test('should track task history on updates', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Task for History',
          description: 'Description',
          status: 'TODO',
        });

      const taskId = createResponse.body.task.id;

      await request(server)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'IN_PROGRESS',
        });

      const historyResponse = await request(server)
        .get(`/api/tasks/${taskId}/history?page=1&size=10`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(historyResponse.statusCode).toBe(200);
      expect(historyResponse.body).toHaveProperty('history');
      expect(Array.isArray(historyResponse.body.history)).toBe(true);
      expect(historyResponse.body).toHaveProperty('total');
    });
  });

  describe('Task Statistics', () => {
    test('should get task statistics', async () => {
      const response = await request(server)
        .get('/api/stats/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('todo');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('review');
      expect(response.body).toHaveProperty('done');
    });
  });

  describe('Authorization', () => {
    test('should reject requests without token', async () => {
      const response = await request(server)
        .get('/api/tasks');

      expect(response.statusCode).toBe(401);
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(server)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.statusCode).toBe(401);
    });

    test('should only allow task author to update task', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Private Task',
          description: 'Description',
        });

      const taskId = createResponse.body.task.id;

      const email2 = `other-user-${randomUUID()}@example.com`;
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: email2,
          password: 'password123',
        });

      const loginResponse2 = await request(server)
        .post('/api/auth/login')
        .send({
          email: email2,
          password: 'password123',
        });

      const otherToken = loginResponse2.body.access_token;

      const updateResponse = await request(server)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Trying to update',
        });

      expect(updateResponse.statusCode).toBe(401);
    });

    test('should only allow task author to delete task', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Task to protect',
          description: 'Description',
        });

      const taskId = createResponse.body.task.id;
      const email2 = `delete-user-${randomUUID()}@example.com`;
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Delete User',
          email: email2,
          password: 'password123',
        });

      const loginResponse2 = await request(server)
        .post('/api/auth/login')
        .send({
          email: email2,
          password: 'password123',
        });

      const otherToken = loginResponse2.body.access_token;

      const deleteResponse = await request(server)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(deleteResponse.statusCode).toBe(404);
    });
  });

  describe('Pagination', () => {
    test('should paginate tasks correctly', async () => {
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: `Pagination Task ${i}`,
            description: `Description ${i}`,
          });
      }

      const response = await request(server)
        .get('/api/tasks?page=1&size=3')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.tasks.length).toBeLessThanOrEqual(3);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('size', 3);
    });

    test('should paginate comments correctly', async () => {
      const taskResponse = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Task for comment pagination',
          description: 'Description',
        });

      const taskId = taskResponse.body.task.id;

      for (let i = 0; i < 5; i++) {
        await request(server)
          .post(`/api/tasks/${taskId}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: `Comment ${i}`,
          });
      }

      const response = await request(server)
        .get(`/api/tasks/${taskId}/comments?page=1&size=2`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.comments.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('Validation', () => {
    test('should validate task creation fields', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          priority: 'INVALID_PRIORITY',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should validate task update fields', async () => {
      const createResponse = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Valid Task',
          description: 'Description',
        });

      const taskId = createResponse.body.task.id;

      const response = await request(server)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'INVALID_STATUS',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should validate UUID format in params', async () => {
      const response = await request(server)
        .get('/api/tasks/not-a-uuid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Filters', () => {
    test('should filter tasks by status', async () => {
      await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'TODO Task',
          description: 'Description',
          status: 'TODO',
        });

      await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Done Task',
          description: 'Description',
          status: 'DONE',
        });

      const response = await request(server)
        .get('/api/tasks?status=TODO')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.tasks.every((t: any) => t.status === 'TODO')).toBe(true);
    });

    test('should filter tasks by priority', async () => {
      await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'High Priority Task',
          description: 'Description',
          priority: 'HIGH',
        });

      const response = await request(server)
        .get('/api/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.tasks.length).toBeGreaterThan(0);
    });

    test('should search tasks by title or description', async () => {
      await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Searchable Task',
          description: 'Unique description for search',
        });

      const response = await request(server)
        .get('/api/tasks?search=Searchable')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.tasks.length).toBeGreaterThan(0);
    });
  });
});