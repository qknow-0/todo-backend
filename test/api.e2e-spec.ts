import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

jest.setTimeout(30000);

describe('API End-to-End Tests', () => {
  let app: INestApplication;
  let authToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJjMjg2OWE3LTA4NjYtNGVmYy04YTgzLTQyMTlmN2JiMDA4NCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBhc3N3b3JkSGFzaCI6ImE0NzhlMTRkOGY4ZDE4MDBhY2I2MGQzMjFiZmI0YTM2OjZlYWViODExNzRiYTBmZThiNzAwNmRlMzAyMmQwZjcxMThjNmJmZmJkMmZkZmQxMjQ2ODM3ODc1MjU0MDc0MTU1Y2IyNTEyMjZmNDhkNmFkNGRkYTk4N2JhZjQ3ZjBjNWUyODg5ODk4NjJkODcxMmY5ZTk3NWM4OTdmOWY2NWI4IiwibmFtZSI6IlRlc3QgVXNlciIsImF2YXRhclVybCI6bnVsbCwiY3JlYXRlZEF0IjoiMjAyNS0wOS0xN1QwOToxMzoxNy40OTJaIiwidXBkYXRlZEF0IjoiMjAyNS0wOS0xN1QwOToxMzoxNy40OTJaIiwibGFzdExvZ2luQXQiOm51bGwsImlhdCI6MTc1ODEwMDM5NywiZXhwIjoxNzU4MjgwMzk3fQ.P6JHYPJ-4KXxClDMRKn0LNQ0hXWX2lERCahgITwCPfw';
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      // console.log('response', response.body);
      // response {
      //   data: {
      //     user: {
      //       id: '2c2869a7-0866-4efc-8a83-4219f7bb0084',
      //       email: 'test@example.com',
      //       name: 'Test User',
      //       avatarUrl: null
      //     },
      //     accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJjMjg2OWE3LTA4NjYtNGVmYy04YTgzLTQyMTlmN2JiMDA4NCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBhc3N3b3JkSGFzaCI6ImE0NzhlMTRkOGY4ZDE4MDBhY2I2MGQzMjFiZmI0YTM2OjZlYWViODExNzRiYTBmZThiNzAwNmRlMzAyMmQwZjcxMThjNmJmZmJkMmZkZmQxMjQ2ODM3ODc1MjU0MDc0MTU1Y2IyNTEyMjZmNDhkNmFkNGRkYTk4N2JhZjQ3ZjBjNWUyODg5ODk4NjJkODcxMmY5ZTk3NWM4OTdmOWY2NWI4IiwibmFtZSI6IlRlc3QgVXNlciIsImF2YXRhclVybCI6bnVsbCwiY3JlYXRlZEF0IjoiMjAyNS0wOS0xN1QwOToxMzoxNy40OTJaIiwidXBkYXRlZEF0IjoiMjAyNS0wOS0xN1QwOToxMzoxNy40OTJaIiwibGFzdExvZ2luQXQiOm51bGwsImlhdCI6MTc1ODEwMDM5NywiZXhwIjoxNzU4MjgwMzk3fQ.P6JHYPJ-4KXxClDMRKn0LNQ0hXWX2lERCahgITwCPfw'
      //   },
      //   code: 200
      // }
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.name).toBe('Test User');

      authToken = response.body.data.accessToken;
      userId = response.body.data.user.id;
    });

    it('should login with registered user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject invalid login credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(200);

      // console.log('response', response.body);
      expect(response.body.code).toBe(1004);
    });
  });

  describe('Tasks API', () => {
    it('should create a new task', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          status: 'todo',
          priority: 'medium',
          estimatedHours: 5,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data.status).toBe('todo');
      // expect(response.body.data.createdBy.id).toBe(userId);

      taskId = response.body.id;
    });

    it('should get all tasks with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('meta');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(+response.body.data.meta.page).toBe(1);
      expect(+response.body.data.meta.limit).toBe(10);
    });

    it('should get a specific task by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId || '3be2f2a7-7de2-4f2a-8cb3-d70ce66132c7'}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // console.log('response', response.body);
      // expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Test Task');
    });

    it('should update a task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Task',
          status: 'in_progress',
          priority: 'high',
        })
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe('Updated Test Task');
      expect(response.body.status).toBe('in_progress');
      expect(response.body.priority).toBe('high');
    });

    it('should watch a task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/tasks/${taskId}/watch`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(taskId);
      expect(Array.isArray(response.body.data.watchers)).toBe(true);
    });

    it('should unwatch a task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}/watch`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(taskId);
    });

    it('should delete a task', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return error when task not found', async () => {
      await request(app.getHttpServer())
        .get('/tasks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthorized access', async () => {
      await request(app.getHttpServer()).get('/tasks').expect(401);
    });

    it('should return 400 for invalid task creation', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty body
        .expect(400);
    });
  });

  describe('Pagination', () => {
    beforeAll(async () => {
      // Create multiple tasks for pagination testing
      for (let i = 1; i <= 15; i++) {
        await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Task ${i}`,
            description: `Test task ${i}`,
            status: 'todo',
            priority: 'medium',
          });
      }
    });

    it('should return correct pagination metadata', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.meta.total).toBeGreaterThanOrEqual(15);
      expect(response.body.meta.totalPages).toBeGreaterThanOrEqual(3);
      expect(response.body.meta.hasNext).toBe(true);
      expect(response.body.meta.hasPrev).toBe(true);
      expect(response.body.data).toHaveLength(5);
    });

    it('should handle invalid pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/tasks?page=0&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get('/tasks?page=1&limit=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
