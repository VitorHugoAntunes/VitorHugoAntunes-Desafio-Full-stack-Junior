import { Body, Controller, Post, Get, HttpCode, UsePipes, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthProxyService } from '../services/auth-proxy.service';
import { RegisterDto, LoginDto, RefreshDto } from '../dtos';
import { ClassValidationPipe } from '@/common/pipes/class-validation.pipe';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user-decorator';
import type { UserPayload } from '@/modules/auth/strategies/jwt.strategy';

@ApiTags('auth')
@Controller('/api/auth')
@UsePipes(ClassValidationPipe)
export class AuthProxyController {
  constructor(private readonly authProxyService: AuthProxyService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new user account with the provided credentials',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'User with same email already exists' })
  async register(@Body() body: RegisterDto) {
    return this.authProxyService.register(body);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Login user',
    description: 'Authenticates user and returns access and refresh tokens',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() body: LoginDto) {
    return this.authProxyService.login(body);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token',
  })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'New access token generated' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: RefreshDto) {
    return this.authProxyService.refresh(body.refresh_token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user',
    description: 'Returns the authenticated user information',
  })
  @ApiResponse({ status: 200, description: 'User information retrieved' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getCurrentUser(@CurrentUser() currentUser: UserPayload) {
    const response = await this.authProxyService.getUser(currentUser.sub);

    if (!response.found) {
      throw new Error('User not found');
    }

    return { user: response.user };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Returns a list of all users in the system',
  })
  @ApiResponse({ status: 200, description: 'List of users retrieved' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getUsers() {
    return this.authProxyService.getUsers();
  }

  @Post('get-users-by-ids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get users by IDs',
    description: 'Returns a list of users based on provided IDs',
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        userIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'List of users retrieved' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getUsersByIds(@Body() body: { userIds: string[] }) {
    return this.authProxyService.getUsersByIds(body.userIds);
  }
}