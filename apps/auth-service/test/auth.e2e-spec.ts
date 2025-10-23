import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { User } from '../src/modules/auth/entities/user.entity';

describe('Auth Service (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('[POST] /auth/register', () => {
    test('should create a new user', async () => {
      const email = `user-${randomUUID()}@example.com`;

      const response = await request(server)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email,
          password: 'password123',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        id: expect.any(String),
        name: 'John Doe',
        email,
      });
      expect(response.body.user).not.toHaveProperty('password');

      const user = await userRepository.findOneBy({ email });
      expect(user).toBeTruthy();
      expect(user?.name).toBe('John Doe');
      expect(user?.password).not.toBe('password123'); // Should be hashed
    });

    test('should fail if email already exists', async () => {
      const email = `existing-${randomUUID()}@example.com`;

      await userRepository.save({
        name: 'Existing User',
        email,
        password: await hash('123456', 8),
      });

      const response = await request(server)
        .post('/auth/register')
        .send({
          name: 'Another User',
          email,
          password: 'password123',
        });

      expect(response.statusCode).toBe(409);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    test('should fail validation for invalid email', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    test('should fail validation for missing fields', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          name: 'John Doe',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should fail validation for short password', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: '123',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should hash password before saving', async () => {
      const email = `hash-test-${randomUUID()}@example.com`;
      const plainPassword = 'mySecretPassword';

      await request(server)
        .post('/auth/register')
        .send({
          name: 'Hash Test User',
          email,
          password: plainPassword,
        });

      const user = await userRepository.findOneBy({ email });
      expect(user).toBeTruthy();
      expect(user?.password).not.toBe(plainPassword);

      expect(user?.password).toMatch(/^\$2[aby]\$.{56}$/);
    });
  });

  describe('[POST] /auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const email = `login-${randomUUID()}@example.com`;
      const password = 'password123';

      await userRepository.save({
        name: 'Login Test User',
        email,
        password: await hash(password, 8),
      });

      const response = await request(server)
        .post('/auth/login')
        .send({
          email,
          password,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('user');
      expect(typeof response.body.access_token).toBe('string');
      expect(typeof response.body.refresh_token).toBe('string');
      expect(response.body.user.email).toBe(email);
    });

    test('should fail with non-existent email', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('do not match');
    });

    test('should fail with wrong password', async () => {
      const email = `wrong-pass-${randomUUID()}@example.com`;

      await userRepository.save({
        name: 'Wrong Password User',
        email,
        password: await hash('correctPassword', 8),
      });

      const response = await request(server)
        .post('/auth/login')
        .send({
          email,
          password: 'wrongPassword',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toContain('do not match');
    });

    test('should fail validation for invalid email format', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should fail validation for missing password', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('[POST] /auth/refresh', () => {
    test('should refresh access token successfully', async () => {
      const email = `refresh-${randomUUID()}@example.com`;
      const password = 'password123';

      await userRepository.save({
        name: 'Refresh Test User',
        email,
        password: await hash(password, 8),
      });

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({ email, password });

      const { refresh_token } = loginResponse.body;

      const refreshResponse = await request(server)
        .post('/auth/refresh')
        .send({ refresh_token });

      expect(refreshResponse.statusCode).toBe(200);
      expect(refreshResponse.body).toHaveProperty('access_token');
      expect(typeof refreshResponse.body.access_token).toBe('string');
    });

    test('should fail with invalid refresh token', async () => {
      const response = await request(server)
        .post('/auth/refresh')
        .send({
          refresh_token: 'invalid-token',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toContain('Invalid refresh token');
    });

    test('should fail validation for missing refresh token', async () => {
      const response = await request(server)
        .post('/auth/refresh')
        .send({});

      expect(response.statusCode).toBe(400);
    });
  });

  describe('[GET] /auth/users', () => {
    test('should return list of users', async () => {
      const email1 = `list-user-1-${randomUUID()}@example.com`;
      const email2 = `list-user-2-${randomUUID()}@example.com`;

      await userRepository.save({
        name: 'User 1',
        email: email1,
        password: await hash('password', 8),
      });

      await userRepository.save({
        name: 'User 2',
        email: email2,
        password: await hash('password', 8),
      });

      const response = await request(server)
        .get('/auth/users');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
      
      response.body.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
      });
    });
  });

  describe('JWT Token Validation', () => {
    test('access token should contain user id', async () => {
      const email = `jwt-${randomUUID()}@example.com`;
      const password = 'password123';

      const user = await userRepository.save({
        name: 'JWT Test User',
        email,
        password: await hash(password, 8),
      });

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({ email, password });

      const { access_token } = loginResponse.body;

      const payload = JSON.parse(
        Buffer.from(access_token.split('.')[1], 'base64').toString()
      );

      expect(payload.sub).toBe(user.id);
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });

    test('tokens should have different expiration times', async () => {
      const email = `exp-${randomUUID()}@example.com`;
      const password = 'password123';

      await userRepository.save({
        name: 'Expiration Test User',
        email,
        password: await hash(password, 8),
      });

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({ email, password });

      const { access_token, refresh_token } = loginResponse.body;

      const accessPayload = JSON.parse(
        Buffer.from(access_token.split('.')[1], 'base64').toString()
      );
      const refreshPayload = JSON.parse(
        Buffer.from(refresh_token.split('.')[1], 'base64').toString()
      );

      const accessExpDuration = accessPayload.exp - accessPayload.iat;
      const refreshExpDuration = refreshPayload.exp - refreshPayload.iat;

      expect(accessExpDuration).toBeLessThan(1000);
      expect(refreshExpDuration).toBeGreaterThan(600000);
    });

    test('should use RS256 algorithm', async () => {
      const email = `algo-${randomUUID()}@example.com`;
      const password = 'password123';

      await userRepository.save({
        name: 'Algorithm Test User',
        email,
        password: await hash(password, 8),
      });

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({ email, password });

      const { access_token } = loginResponse.body;

      const header = JSON.parse(
        Buffer.from(access_token.split('.')[0], 'base64').toString()
      );

      expect(header.alg).toBe('RS256');
    });
  });

  describe('Security', () => {
    test('should not expose password in any response', async () => {
      const email = `security-${randomUUID()}@example.com`;
      
      const registerResponse = await request(server)
        .post('/auth/register')
        .send({
          name: 'Security Test',
          email,
          password: 'password123',
        });

      expect(registerResponse.body.user).not.toHaveProperty('password');

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email,
          password: 'password123',
        });

      expect(loginResponse.body.user).not.toHaveProperty('password');

      const usersResponse = await request(server)
        .get('/auth/users');

      usersResponse.body.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    test('should reject empty passwords', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should reject whitespace-only passwords', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '      ',
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    test('should handle case-sensitive emails', async () => {
      const email = `case-${randomUUID()}@example.com`;

      await request(server)
        .post('/auth/register')
        .send({
          name: 'Case Test',
          email: email.toLowerCase(),
          password: 'password123',
        });

      const response = await request(server)
        .post('/auth/login')
        .send({
          email: email.toUpperCase(),
          password: 'password123',
        });

      expect(response.statusCode).toBe(401);
    });

    test('should trim whitespace from name', async () => {
      const email = `trim-${randomUUID()}@example.com`;

      const response = await request(server)
        .post('/auth/register')
        .send({
          name: '  John Doe  ',
          email,
          password: 'password123',
        });

      expect(response.statusCode).toBe(201);
    });

    test('should handle special characters in name', async () => {
      const email = `special-${randomUUID()}@example.com`;

      const response = await request(server)
        .post('/auth/register')
        .send({
          name: 'José García-López',
          email,
          password: 'password123',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.user.name).toBe('José García-López');
    });

    test('should handle very long names', async () => {
      const email = `long-${randomUUID()}@example.com`;
      const longName = 'A'.repeat(255);

      const response = await request(server)
        .post('/auth/register')
        .send({
          name: longName,
          email,
          password: 'password123',
        });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent registration attempts with same email', async () => {
      const email = `concurrent-${randomUUID()}@example.com`;

      const promises = Array.from({ length: 5 }, () =>
        request(server)
          .post('/auth/register')
          .send({
            name: 'Concurrent Test',
            email,
            password: 'password123',
          })
      );

      const results = await Promise.all(promises);
      
      const successful = results.filter(r => r.statusCode === 201);
      const failed = results.filter(r => r.statusCode === 409);

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(4);
    });
  });
});