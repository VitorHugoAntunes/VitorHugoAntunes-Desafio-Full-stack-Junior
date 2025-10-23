import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import type { Logger } from 'winston';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    @Inject('LOGGER')
    private readonly logger: Logger,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    this.logger.info('Registration attempt', { email: data.email });

    const existingUser = await this.usersRepository.userExists(data.email);
    if (existingUser) {
      this.logger.warn('Registration failed - email already exists', { email: data.email });
      throw new ConflictException('User with same e-mail address already exists.');
    }

    const hashedPassword = await hash(data.password, 8);
    const user = await this.usersRepository.createUser({
      ...data,
      password: hashedPassword,
    });

    this.logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    this.logger.info('Login attempt', { email: data.email });

    const user = await this.usersRepository.findByEmail(data.email);
    if (!user) {
      this.logger.warn('Login failed - user not found', { email: data.email });
      throw new UnauthorizedException('User credentials do not match.');
    }

    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn('Login failed - invalid password', { email: data.email });
      throw new UnauthorizedException('User credentials do not match.');
    }

    const accessToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    this.logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const accessToken = this.jwtService.sign({ sub: payload.sub }, { expiresIn: '15m' });
      
      this.logger.info('Token refreshed successfully', { userId: payload.sub });
      
      return { access_token: accessToken };
    } catch (error) {
      this.logger.warn('Token refresh failed', { error: error.message });
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersRepository.findById(payload.sub);
      
      if (!user) {
        this.logger.warn('Token validation failed - user not found', { userId: payload.sub });
        return { valid: false, error: 'User not found' };
      }

      this.logger.debug('Token validated successfully', { userId: user.id });

      return {
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      this.logger.warn('Token validation failed', { error: error.message });
      return { valid: false, error: 'Invalid token' };
    }
  }

  async getUserById(userId: string) {
    const user = await this.usersRepository.findById(userId);
    
    if (!user) {
      this.logger.debug('User not found', { userId });
      return { found: false };
    }

    this.logger.debug('User fetched successfully', { userId: user.id });

    return {
      found: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async getUsersByIds(userIds: string[]) {
    if (!userIds || userIds.length === 0) {
      return { users: [] };
    }

    const users = await this.usersRepository.findByIds(userIds);
    
    this.logger.debug('Users fetched by IDs', { count: users.length, requestedCount: userIds.length });
    
    return {
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
    };
  }

  async getAllUsers() {
    const users = await this.usersRepository.findAllUsers();

    this.logger.debug('All users fetched', { count: users.length });

    return { users };
  }
}