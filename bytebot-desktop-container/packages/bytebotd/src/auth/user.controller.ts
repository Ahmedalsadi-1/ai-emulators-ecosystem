import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './services/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles, Permissions } from './decorators/auth.decorators';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current user profile
   */
  @Get('profile')
  async getProfile(@Request() req: any) {
    const { user } = req;
    return this.userService.getUserById(user.id);
  }

  /**
   * Update current user profile
   */
  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const { user } = req;
    return this.userService.updateProfile(user.id, updateProfileDto);
  }

  /**
   * Update current user password
   */
  @Put('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(@Request() req: any, @Body() updatePasswordDto: UpdatePasswordDto) {
    const { user } = req;
    await this.userService.updatePassword(user.id, updatePasswordDto);
    return { message: 'Password updated successfully' };
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @Permissions('users:read')
  async getUser(@Param('id') userId: string) {
    return this.userService.getUserById(userId);
  }

  /**
   * Create new user (admin only)
   */
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  /**
   * Update user (admin only)
   */
  @Put(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async updateUser(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(userId, updateUserDto);
  }

  /**
   * Delete user (admin only)
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') userId: string) {
    await this.userService.deleteUser(userId);
    return { message: 'User deleted successfully' };
  }

  /**
   * Get all users (admin only)
   */
  @Get()
  @Roles('admin')
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.userService.getAllUsers(pageNum, limitNum);
  }

  /**
   * Search users (admin only)
   */
  @Get('search')
  @Roles('admin')
  async searchUsers(
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    if (!query || query.trim().length < 2) {
      return { users: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.userService.searchUsers(query.trim(), pageNum, limitNum);
  }

  /**
   * Get user statistics (admin only)
   */
  @Get('stats/summary')
  @Roles('admin')
  async getUserStats() {
    return this.userService.getUserStats();
  }
}