import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export class TestDatabaseManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test_db',
    });
  }

  async setup(): Promise<void> {
    try {
      // Create test database if it doesn't exist
      await this.createTestDatabase();

      // Run migrations
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: this.getTestDatabaseUrl() },
      });

      // Seed with test data
      await this.seedTestData();
    } catch (error) {
      console.error('Failed to setup test database:', error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      await this.dropTestDatabase();
    } catch (error) {
      console.error('Failed to teardown test database:', error);
    }
  }

  async cleanup(): Promise<void> {
    // Clean up test data between tests
    await this.prisma.task.deleteMany();
    await this.prisma.message.deleteMany();
    await this.prisma.model.deleteMany();
  }

  private async createTestDatabase(): Promise<void> {
    const dbName = this.getTestDatabaseName();
    const adminUrl = this.getAdminDatabaseUrl();

    const adminPrisma = new PrismaClient({ datasourceUrl: adminUrl });

    try {
      await adminPrisma.$executeRaw`CREATE DATABASE IF NOT EXISTS ${dbName}`;
    } catch (error) {
      // Database might already exist, ignore
    } finally {
      await adminPrisma.$disconnect();
    }
  }

  private async dropTestDatabase(): Promise<void> {
    const dbName = this.getTestDatabaseName();
    const adminUrl = this.getAdminDatabaseUrl();

    const adminPrisma = new PrismaClient({ datasourceUrl: adminUrl });

    try {
      await adminPrisma.$executeRaw`DROP DATABASE IF EXISTS ${dbName}`;
    } catch (error) {
      // Database might not exist, ignore
    } finally {
      await adminPrisma.$disconnect();
    }
  }

  private async seedTestData(): Promise<void> {
    // Create test models
    await this.prisma.model.createMany({
      data: [
        { name: 'gpt-4', provider: 'openai', version: '4.0' },
        { name: 'claude-3', provider: 'anthropic', version: '3.0' },
        { name: 'gemini-pro', provider: 'google', version: '1.0' },
      ],
    });

    // Create test tasks
    await this.prisma.task.createMany({
      data: [
        {
          id: 'test-task-1',
          description: 'Test task 1',
          status: 'pending',
          modelId: 'gpt-4',
        },
        {
          id: 'test-task-2',
          description: 'Test task 2',
          status: 'completed',
          modelId: 'claude-3',
        },
      ],
    });
  }

  private getTestDatabaseUrl(): string {
    return process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test_db';
  }

  private getAdminDatabaseUrl(): string {
    return process.env.DATABASE_URL_ADMIN || 'postgresql://postgres:postgres@localhost:5432/postgres';
  }

  private getTestDatabaseName(): string {
    return 'test_db';
  }
}

export const testDbManager = new TestDatabaseManager();