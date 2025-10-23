import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import { AuthService } from '../services/auth.service';
import { UsersRepository } from '../repositories/users.repository';

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn(),
}));

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let usersRepository: UsersRepository;
  let jwtService: JwtService;
  let logger: any;

  beforeEach(() => {
    usersRepository = {
      userExists: vi.fn(),
      createUser: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAllUsers: vi.fn(),
    } as any;

    jwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    } as any;

    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    authService = new AuthService(usersRepository, jwtService, logger);
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'uuid-123',
        name: dto.name,
        email: dto.email,
        password: 'hashed-password',
      };

      (usersRepository.userExists as any).mockResolvedValue(false);
      (usersRepository.createUser as any).mockResolvedValue(mockUser);

      const result = await authService.register(dto);

      expect(usersRepository.userExists).toHaveBeenCalledWith(dto.email);
      expect(hash).toHaveBeenCalledWith(dto.password, 8);
      expect(usersRepository.createUser).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: 'hashed-password',
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
      expect(logger.info).toHaveBeenCalledWith('Registration attempt', { email: dto.email });
      expect(logger.info).toHaveBeenCalledWith('User registered successfully', { 
        userId: mockUser.id, 
        email: mockUser.email 
      });
    });

    test('should throw ConflictException if email already exists', async () => {
      const dto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      };

      (usersRepository.userExists as any).mockResolvedValue(true);

      await expect(authService.register(dto)).rejects.toThrow(ConflictException);
      expect(usersRepository.createUser).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Registration failed - email already exists', { 
        email: dto.email 
      });
    });
  });

  describe('login', () => {
    test('should login successfully with valid credentials', async () => {
      const dto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'uuid-123',
        name: 'John Doe',
        email: dto.email,
        password: 'hashed-password',
      };

      (usersRepository.findByEmail as any).mockResolvedValue(mockUser);
      (compare as any).mockResolvedValue(true);
      (jwtService.sign as any)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.login(dto);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(compare).toHaveBeenCalledWith(dto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id }, { expiresIn: '15m' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id }, { expiresIn: '7d' });
      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
      expect(logger.info).toHaveBeenCalledWith('User logged in successfully', {
        userId: mockUser.id,
        email: mockUser.email,
      });
    });

    test('should throw UnauthorizedException if user not found', async () => {
      const dto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (usersRepository.findByEmail as any).mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Login failed - user not found', {
        email: dto.email,
      });
    });

    test('should throw UnauthorizedException if password is invalid', async () => {
      const dto = {
        email: 'john@example.com',
        password: 'wrong-password',
      };

      const mockUser = {
        id: 'uuid-123',
        email: dto.email,
        password: 'hashed-password',
      };

      (usersRepository.findByEmail as any).mockResolvedValue(mockUser);
      (compare as any).mockResolvedValue(false);

      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Login failed - invalid password', {
        email: dto.email,
      });
    });
  });

  describe('refreshToken', () => {
    test('should refresh access token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 'uuid-123' };

      (jwtService.verify as any).mockReturnValue(payload);
      (jwtService.sign as any).mockReturnValue('new-access-token');

      const result = await authService.refreshToken(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: payload.sub },
        { expiresIn: '15m' }
      );
      expect(result).toEqual({
        access_token: 'new-access-token',
      });
      expect(logger.info).toHaveBeenCalledWith('Token refreshed successfully', {
        userId: payload.sub,
      });
    });

    test('should throw UnauthorizedException if refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';

      (jwtService.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Token refresh failed', expect.any(Object));
    });
  });

  describe('validateToken', () => {
    test('should validate token and return user', async () => {
      const token = 'valid-token';
      const payload = { sub: 'uuid-123' };
      const mockUser = {
        id: 'uuid-123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed',
      };

      (jwtService.verify as any).mockReturnValue(payload);
      (usersRepository.findById as any).mockResolvedValue(mockUser);

      const result = await authService.validateToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(usersRepository.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        valid: true,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });

    test('should return invalid if token verification fails', async () => {
      const token = 'invalid-token';

      (jwtService.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.validateToken(token);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid token',
      });
    });

    test('should return invalid if user not found', async () => {
      const token = 'valid-token';
      const payload = { sub: 'uuid-123' };

      (jwtService.verify as any).mockReturnValue(payload);
      (usersRepository.findById as any).mockResolvedValue(null);

      const result = await authService.validateToken(token);

      expect(result).toEqual({
        valid: false,
        error: 'User not found',
      });
    });
  });

  describe('getUserById', () => {
    test('should return user if found', async () => {
      const userId = 'uuid-123';
      const mockUser = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed',
      };

      (usersRepository.findById as any).mockResolvedValue(mockUser);

      const result = await authService.getUserById(userId);

      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        found: true,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });

    test('should return not found if user does not exist', async () => {
      const userId = 'nonexistent-id';

      (usersRepository.findById as any).mockResolvedValue(null);

      const result = await authService.getUserById(userId);

      expect(result).toEqual({ found: false });
    });
  });

  describe('getUsersByIds', () => {
    test('should return users for given IDs', async () => {
      const userIds = ['uuid-1', 'uuid-2'];
      const mockUsers = [
        { id: 'uuid-1', name: 'User 1', email: 'user1@example.com', password: 'hash' },
        { id: 'uuid-2', name: 'User 2', email: 'user2@example.com', password: 'hash' },
      ];

      (usersRepository.findByIds as any).mockResolvedValue(mockUsers);

      const result = await authService.getUsersByIds(userIds);

      expect(usersRepository.findByIds).toHaveBeenCalledWith(userIds);
      expect(result).toEqual({
        users: [
          { id: 'uuid-1', name: 'User 1', email: 'user1@example.com' },
          { id: 'uuid-2', name: 'User 2', email: 'user2@example.com' },
        ],
      });
    });

    test('should return empty array if no IDs provided', async () => {
      const result = await authService.getUsersByIds([]);

      expect(usersRepository.findByIds).not.toHaveBeenCalled();
      expect(result).toEqual({ users: [] });
    });
  });

  describe('getAllUsers', () => {
    test('should return all users', async () => {
      const mockUsers = [
        { id: 'uuid-1', name: 'User 1', email: 'user1@example.com' },
        { id: 'uuid-2', name: 'User 2', email: 'user2@example.com' },
      ];

      (usersRepository.findAllUsers as any).mockResolvedValue(mockUsers);

      const result = await authService.getAllUsers();

      expect(usersRepository.findAllUsers).toHaveBeenCalled();
      expect(result).toEqual({ users: mockUsers });
    });
  });
});