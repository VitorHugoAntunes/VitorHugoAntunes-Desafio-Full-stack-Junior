import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { ClassValidationPipe } from '../src/common/pipes/class-validation.pipe';

describe('API Gateway - Auth Flow (E2E)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    
    app.useGlobalPipes(new ClassValidationPipe());
    
    app.enableCors({
      origin: ['http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Authentication Flow', () => {
    test('should complete full auth flow: register -> login -> refresh', async () => {
      const email = `flow-${randomUUID()}@example.com`;
      const password = 'password123';

      const registerResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Flow Test User',
          email,
          password,
        });

      expect(registerResponse.statusCode).toBe(201);
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user).toHaveProperty('id');
      expect(registerResponse.body.user.email).toBe(email);

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email,
          password,
        });

      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body).toHaveProperty('access_token');
      expect(loginResponse.body).toHaveProperty('refresh_token');
      expect(loginResponse.body).toHaveProperty('user');

      const { refresh_token, access_token } = loginResponse.body;

      const refreshResponse = await request(server)
        .post('/api/auth/refresh')
        .send({
          refresh_token,
        });

      expect(refreshResponse.statusCode).toBe(200);
      expect(refreshResponse.body).toHaveProperty('access_token');
      expect(refreshResponse.body.access_token).toBeDefined();
      expect(typeof refreshResponse.body.access_token).toBe('string');

      const meResponse = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${access_token}`);

      expect(meResponse.statusCode).toBe(200);
      expect(meResponse.body).toHaveProperty('user');
      expect(meResponse.body.user.email).toBe(email);
    });

    test('should reject duplicate registration', async () => {
      const email = `duplicate-${randomUUID()}@example.com`;

      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email,
          password: 'password123',
        });

      const response = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email,
          password: 'password456',
        });

      expect(response.statusCode).toBe(409);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    test('should reject invalid credentials', async () => {
      const email = `invalid-${randomUUID()}@example.com`;

      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email,
          password: 'password123',
        });

      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email,
          password: 'wrongpassword',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Validation', () => {
    test('should validate email format on register', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'password123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation failed');
    });

    test('should validate required fields on register', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    test('should validate minimum password length', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '12345',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should validate email format on login', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('JWT Token', () => {
    test('should reject invalid JWT token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.statusCode).toBe(401);
    });

    test('should reject request without token', async () => {
      const response = await request(server)
        .get('/api/auth/me');

      expect(response.statusCode).toBe(401);
    });

    test('should reject expired refresh token', async () => {
      const response = await request(server)
        .post('/api/auth/refresh')
        .send({
          refresh_token: 'definitely-invalid-token',
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Get Users', () => {
    test('should get all users when authenticated', async () => {
      const email = `users-${randomUUID()}@example.com`;
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email,
          password: 'password123',
        });

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email,
          password: 'password123',
        });

      const { access_token } = loginResponse.body;

      const response = await request(server)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${access_token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });
});