import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthProxyService {
  private readonly authServiceUrl: string;

  constructor(
    @Inject('AUTH_SERVICE')
    private authService: ClientProxy,
  ) {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3334';
  }

  async register(data: { name: string; email: string; password: string }) {
    const response = await fetch(`${this.authServiceUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async login(data: { email: string; password: string }) {
    const response = await fetch(`${this.authServiceUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async refresh(refreshToken: string) {
    const response = await fetch(`${this.authServiceUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async getUsers() {
    const response = await fetch(`${this.authServiceUrl}/auth/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async validateToken(token: string) {
    return firstValueFrom(
      this.authService.send('auth.validate_token', { token })
    );
  }

  async getUser(userId: string) {
    return firstValueFrom(
      this.authService.send('auth.get_user', { userId })
    );
  }

  async getUsersByIds(userIds: string[]) {
    return firstValueFrom(
      this.authService.send('auth.get_users_by_ids', { userIds })
    );
  }
}