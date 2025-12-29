import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Public, Roles } from './auth.decorators';
import type { AuthRole } from './auth.types';

type LoginRequest = {
  username: string;
  password: string;
};

type CreateUserRequest = {
  username: string;
  password: string;
  role?: AuthRole;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginRequest) {
    const { username, password } = body;
    if (!username || !password) {
      throw new UnauthorizedException('Username and password are required.');
    }

    const user = this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const { token, payload } = this.authService.issueToken(user);
    this.authService.updateLastLogin(user.username);

    return {
      token,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      user: {
        username: payload.sub,
        role: payload.role,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: Request) {
    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing token.');
    }

    this.authService.revokeToken(token);
    return { success: true };
  }

  @Get('me')
  async me(@Req() request: Request & { user?: { sub: string; role: AuthRole } }) {
    if (!request.user) {
      throw new UnauthorizedException('Missing token.');
    }

    return {
      username: request.user.sub,
      role: request.user.role,
    };
  }

  @Roles('admin')
  @Get('users')
  async listUsers() {
    return {
      users: this.authService.listUsers(),
    };
  }

  @Roles('admin')
  @Post('users')
  async createUser(@Body() body: CreateUserRequest) {
    if (!body.username || !body.password) {
      throw new UnauthorizedException('Username and password are required.');
    }

    const user = this.authService.createUser({
      username: body.username,
      password: body.password,
      role: body.role,
    });

    return { user };
  }

  @Roles('admin')
  @Delete('users/:username')
  async deleteUser(@Param('username') username: string) {
    this.authService.deleteUser(username);
    return { success: true };
  }
}

function extractToken(request: Request): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const tokenHeader = request.headers['x-bytebot-token'];
  if (typeof tokenHeader === 'string' && tokenHeader.trim()) {
    return tokenHeader.trim();
  }

  return null;
}
