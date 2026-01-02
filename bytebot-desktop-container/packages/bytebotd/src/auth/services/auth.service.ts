import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private prisma: PrismaClient;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Authenticate user with credentials
   */
  async login(loginDto: LoginDto): Promise<AuthTokensDto> {
    const { username, password } = loginDto;

    // Find user by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.handleFailedLogin(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session
    const session = await this.createSession(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user, session);

    // Log successful login
    await this.logAuthEvent(user.id, 'login', 'success', {
      sessionId: session.id,
      ipAddress: 'TODO: get from request',
    });

    return tokens;
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthTokensDto> {
    const { username, email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        roles: ['user'],
        permissions: ['read', 'write'],
        isActive: true,
        isEmailVerified: false,
      },
    });

    // Create session
    const session = await this.createSession(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user, session);

    // Log user registration
    await this.logAuthEvent(user.id, 'register', 'success');

    return tokens;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokensDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as JwtPayload;

      // Check if refresh token is blacklisted
      const blacklisted = await this.prisma.refreshTokenBlacklist.findUnique({
        where: { tokenHash: this.hashToken(refreshToken) },
      });

      if (blacklisted) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Get user and session
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      const session = await this.prisma.session.findUnique({
        where: { id: payload.sid },
      });

      if (!user || !session || !session.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user, session);

      // Log token refresh
      await this.logAuthEvent(user.id, 'token_refresh', 'success', {
        sessionId: session.id,
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId: string, sessionId: string): Promise<void> {
    // Mark session as inactive
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    // Log logout event
    await this.logAuthEvent(userId, 'logout', 'success', {
      sessionId,
    });
  }

  /**
   * Validate JWT token and return user
   */
  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;

      // Check session validity
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sid },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired');
      }

      // Update session activity
      await this.prisma.session.update({
        where: { id: payload.sid },
        data: { lastActivity: new Date() },
      });

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        sessionId: payload.sid,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Revoke refresh token (for logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshTokenBlacklist.create({
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        reason: 'user_logout',
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        permissions: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private async createSession(userId: string): Promise<any> {
    const session = await this.prisma.session.create({
      data: {
        userId,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        lastActivity: new Date(),
      },
    });

    return session;
  }

  private async generateTokens(user: any, session: any): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      sid: session.id,
      roles: user.roles,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, sid: session.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN', '7d'),
      },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 15 * 60, // 15 minutes
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    return bcrypt.hash(password, saltRounds);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async handleFailedLogin(userId: string, currentAttempts: number): Promise<void> {
    const newAttempts = currentAttempts + 1;
    const maxAttempts = 5;
    let lockedUntil: Date | null = null;

    if (newAttempts >= maxAttempts) {
      // Lock account for 15 minutes
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil,
      },
    });

    // Log failed login attempt
    await this.logAuthEvent(userId, 'login_failed', 'failure', {
      attemptNumber: newAttempts,
      locked: lockedUntil !== null,
    });
  }

  private async logAuthEvent(
    userId: string,
    event: string,
    success: 'success' | 'failure',
    details?: any,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        event,
        action: event,
        details,
        success: success === 'success',
        severity: success === 'success' ? 'info' : 'warning',
      },
    });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}