import { Body, Controller, Post, Get, HttpCode } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from '../services/auth.service';
import { ZodValidationPipe } from '../../../pipes/zod-validation-pipe';
import { registerSchema, loginSchema, refreshSchema } from '../dtos/auth.dto';
import type { RegisterDto, LoginDto, RefreshDto } from '../dtos/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body(new ZodValidationPipe(loginSchema)) body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshDto) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @Get('users')
  async getUsers() {
    return this.authService.getAllUsers();
  }

  @MessagePattern('auth.validate_token')
  async validateToken(data: { token: string }) {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern('auth.get_user')
  async getUser(data: { userId: string }) {
    return this.authService.getUserById(data.userId);
  }

  @MessagePattern('auth.get_users_by_ids')
  async getUsersByIds(data: { userIds: string[] }) {
    return this.authService.getUsersByIds(data.userIds);
  }

  @MessagePattern('auth.get_all_users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}