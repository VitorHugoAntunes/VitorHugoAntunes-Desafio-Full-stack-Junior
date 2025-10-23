import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);

    this.logger.log(`Attempting to authenticate WebSocket connection: ${client.id}`);

    if (!token) {
      this.logger.error(`No token found for client: ${client.id}`);
      throw new WsException('Unauthorized - No token provided');
    }

    try {
      this.logger.log(`Verifying token for client: ${client.id}`);
      const payload = await this.jwtService.verifyAsync(token);
      
      this.logger.log(`Token verified for user: ${payload.sub}`);
      client.data.user = payload;
      
      return true;
    } catch (error) {
      this.logger.error(`Token verification failed for client ${client.id}:`, error.message);
      throw new WsException('Unauthorized - Invalid token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    
    this.logger.log(`Checking authorization header: ${authHeader ? 'Found' : 'Not found'}`);
    
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        this.logger.log(`Token extracted from Authorization header`);
        return token;
      }
    }

    const queryToken = client.handshake.auth?.token || client.handshake.query?.token;
    
    if (queryToken) {
      this.logger.log(`Token extracted from query/auth params`);
      return queryToken as string;
    }

    this.logger.error(`No token found in handshake for client: ${client.id}`);
    return undefined;
  }
}