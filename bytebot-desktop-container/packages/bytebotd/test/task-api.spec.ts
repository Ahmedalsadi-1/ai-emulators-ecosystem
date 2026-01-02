import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Task API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Clean up database before each test
    await prisma.task.deleteMany();
    await prisma.message.deleteMany();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /tasks', () => {
    it('should create a new task', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          description: 'Test task creation',
          modelId: 'gpt-4',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.description).toBe('Test task creation');
          expect(res.body.modelId).toBe('gpt-4');
          expect(res.body.status).toBe('pending');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('description');
        });
    });

    it('should handle file uploads with tasks', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .field('description', 'Process this document')
        .field('modelId', 'claude-3')
        .attach('files', Buffer.from('test file content'), 'test.pdf')
        .expect(201)
        .expect((res) => {
          expect(res.body.description).toBe('Process this document');
          expect(res.body.files).toBeDefined();
        });
    });
  });

  describe('GET /tasks', () => {
    it('should return list of tasks', async () => {
      // Create test tasks
      await prisma.task.createMany({
        data: [
          { id: 'task-1', description: 'Task 1', status: 'pending', modelId: 'gpt-4' },
          { id: 'task-2', description: 'Task 2', status: 'completed', modelId: 'claude-3' },
        ],
      });

      return request(app.getHttpServer())
        .get('/tasks')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toHaveProperty('description');
          expect(res.body[0]).toHaveProperty('status');
        });
    });

    it('should filter tasks by status', async () => {
      await prisma.task.createMany({
        data: [
          { id: 'task-1', description: 'Pending task', status: 'pending', modelId: 'gpt-4' },
          { id: 'task-2', description: 'Completed task', status: 'completed', modelId: 'gpt-4' },
        ],
      });

      return request(app.getHttpServer())
        .get('/tasks?status=completed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].status).toBe('completed');
        });
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a specific task', async () => {
      const task = await prisma.task.create({
        data: {
          id: 'test-task-1',
          description: 'Test task',
          status: 'pending',
          modelId: 'gpt-4',
        },
      });

      return request(app.getHttpServer())
        .get(`/tasks/${task.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(task.id);
          expect(res.body.description).toBe('Test task');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/tasks/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update task status', async () => {
      const task = await prisma.task.create({
        data: {
          id: 'update-test-task',
          description: 'Task to update',
          status: 'pending',
          modelId: 'gpt-4',
        },
      });

      return request(app.getHttpServer())
        .put(`/tasks/${task.id}`)
        .send({ status: 'running' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('running');
          expect(res.body.updatedAt).not.toBe(task.updatedAt);
        });
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const task = await prisma.task.create({
        data: {
          id: 'delete-test-task',
          description: 'Task to delete',
          status: 'pending',
          modelId: 'gpt-4',
        },
      });

      await request(app.getHttpServer())
        .delete(`/tasks/${task.id}`)
        .expect(204);

      // Verify task is deleted
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask).toBeNull();
    });
  });
});