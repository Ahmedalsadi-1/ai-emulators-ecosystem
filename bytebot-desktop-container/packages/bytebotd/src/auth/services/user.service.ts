import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  private prisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new user (admin function)
   */
  async createUser(createUserDto: CreateUserDto): Promise<any> {
    const { username, email, password, firstName, lastName, roles, permissions } = createUserDto;

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
      throw new ConflictException('User already exists with this username or email');
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
        roles: JSON.stringify(roles || ['user']),
        permissions: JSON.stringify(permissions || ['read', 'write']),
        isActive: true,
        isEmailVerified: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Parse JSON strings back to arrays for response
    return {
      ...user,
      roles: JSON.parse(user.roles),
      permissions: JSON.parse(user.permissions),
    };
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
        avatar: true,
        roles: true,
        permissions: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Parse JSON strings back to arrays
    return {
      ...user,
      roles: JSON.parse(user.roles),
      permissions: JSON.parse(user.permissions),
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
    };
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        roles: true,
        permissions: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Parse JSON strings back to arrays
    return {
      ...user,
      roles: JSON.parse(user.roles),
      permissions: JSON.parse(user.permissions),
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any> {
    const { firstName, lastName, avatar, preferences } = updateProfileDto;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        avatar,
        preferences: preferences ? JSON.stringify(preferences) : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        preferences: true,
        updatedAt: true,
      },
    });

    return {
      ...user,
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
    };
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = updatePasswordDto;

    // Get current user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log password change
    await this.logSecurityEvent(userId, 'password_changed', 'Password updated successfully');
  }

  /**
   * Update user (admin function)
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<any> {
    const { firstName, lastName, email, roles, permissions, isActive } = updateUserDto;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email is already taken by another user');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        roles: roles ? JSON.stringify(roles) : undefined,
        permissions: permissions ? JSON.stringify(permissions) : undefined,
        isActive,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        permissions: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Parse JSON strings back to arrays
    return {
      ...user,
      roles: JSON.parse(user.roles),
      permissions: JSON.parse(user.permissions),
    };
  }

  /**
   * Delete user (admin function)
   */
  async deleteUser(userId: string): Promise<void> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by deactivating (or hard delete if preferred)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Log user deletion
    await this.logSecurityEvent(userId, 'user_deleted', 'User account deactivated');
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where: { isActive: true },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
          permissions: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: { isActive: true },
      }),
    ]);

    // Parse JSON strings back to arrays
    const parsedUsers = users.map(user => ({
      ...user,
      roles: JSON.parse(user.roles),
      permissions: JSON.parse(user.permissions),
    }));

    return {
      users: parsedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search users by username or email
   */
  async searchUsers(query: string, page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where: {
          isActive: true,
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
          permissions: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    // Parse JSON strings back to arrays
    const parsedUsers = users.map(user => ({
      ...user,
      roles: JSON.parse(user.roles),
      permissions: JSON.parse(user.permissions),
    }));

    return {
      users: parsedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<any> {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isEmailVerified: true } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      recentUsers,
      inactiveUsers: totalUsers - activeUsers,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    return bcrypt.hash(password, saltRounds);
  }

  private async logSecurityEvent(userId: string, event: string, details: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        event,
        action: event,
        details: JSON.stringify({ message: details }),
        severity: 'info',
      },
    });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}