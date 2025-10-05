import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../src/schemas/user.schema';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same validation pipe as in main.ts
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await userModel.deleteMany({});
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      const timestamp = Date.now();
      const createUserDto = {
        firstname: 'John',
        lastname: 'Doe',
        nationalcode: `123456${timestamp.toString().slice(-4)}`,
        personalcode: `EMP${timestamp.toString().slice(-3)}`,
        email: `john.doe.${timestamp}@example.com`,
        organizationLevel: 'senior',
        password: 'securePassword123',
        role: 'user',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.firstname).toBe(createUserDto.firstname);
          expect(res.body.lastname).toBe(createUserDto.lastname);
          expect(res.body.email).toBe(createUserDto.email);
          expect(res.body.organizationLevel).toBe(createUserDto.organizationLevel);
          expect(res.body.role).toBe(createUserDto.role);
          expect(res.body).not.toHaveProperty('password'); // Password should be excluded
        });
    });

    it('should return 409 for duplicate email', async () => {
      const createUserDto = {
        firstname: 'John',
        lastname: 'Doe',
        nationalcode: '1234567890',
        personalcode: 'EMP001',
        email: 'john.doe@example.com',
        organizationLevel: 'senior',
        password: 'securePassword123',
        role: 'user',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Try to create duplicate
      return request(app.getHttpServer())
        .post('/users')
        .send({
          ...createUserDto,
          nationalcode: '0987654321',
          personalcode: 'EMP002',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should return 400 for invalid input', () => {
      const invalidUserDto = {
        firstname: 'John',
        // Missing required fields
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(invalidUserDto)
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return all users', async () => {
      // Create test users
      const users = [
        {
          firstname: 'John',
          lastname: 'Doe',
          nationalcode: '1234567890',
          personalcode: 'EMP001',
          email: 'john.doe@example.com',
          organizationLevel: 'senior',
          password: 'password123',
          role: 'user',
        },
        {
          firstname: 'Jane',
          lastname: 'Smith',
          nationalcode: '0987654321',
          personalcode: 'EMP002',
          email: 'jane.smith@example.com',
          organizationLevel: 'manager',
          password: 'password456',
          role: 'manager',
        },
      ];

      for (const user of users) {
        await request(app.getHttpServer())
          .post('/users')
          .send(user)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).not.toHaveProperty('password');
          expect(res.body[1]).not.toHaveProperty('password');
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by id', async () => {
      const createUserDto = {
        firstname: 'John',
        lastname: 'Doe',
        nationalcode: '1234567890',
        personalcode: 'EMP001',
        email: 'john.doe@example.com',
        organizationLevel: 'senior',
        password: 'securePassword123',
        role: 'user',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body._id;

      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(userId);
          expect(res.body.firstname).toBe(createUserDto.firstname);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 404 for non-existent user', () => {
      const fakeId = '507f1f77bcf86cd799439011';
      return request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .expect(404);
    });

    it('should return 400 for invalid id format', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id')
        .expect(400);
    });
  });

  describe('/users/email/:email (GET)', () => {
    it('should return a user by email', async () => {
      const createUserDto = {
        firstname: 'John',
        lastname: 'Doe',
        nationalcode: '1234567890',
        personalcode: 'EMP001',
        email: 'john.doe@example.com',
        organizationLevel: 'senior',
        password: 'securePassword123',
        role: 'user',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      return request(app.getHttpServer())
        .get(`/users/email/${createUserDto.email}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(createUserDto.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });
  });

  describe('/users/role/:role (GET)', () => {
    it('should return users by role', async () => {
      const users = [
        {
          firstname: 'John',
          lastname: 'Doe',
          nationalcode: '1234567890',
          personalcode: 'EMP001',
          email: 'john.doe@example.com',
          organizationLevel: 'senior',
          password: 'password123',
          role: 'manager',
        },
        {
          firstname: 'Jane',
          lastname: 'Smith',
          nationalcode: '0987654321',
          personalcode: 'EMP002',
          email: 'jane.smith@example.com',
          organizationLevel: 'junior',
          password: 'password456',
          role: 'user',
        },
      ];

      for (const user of users) {
        await request(app.getHttpServer())
          .post('/users')
          .send(user)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/users/role/manager')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].role).toBe('manager');
        });
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user', async () => {
      const createUserDto = {
        firstname: 'John',
        lastname: 'Doe',
        nationalcode: '1234567890',
        personalcode: 'EMP001',
        email: 'john.doe@example.com',
        organizationLevel: 'senior',
        password: 'securePassword123',
        role: 'user',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body._id;
      const updateDto = {
        firstname: 'John Updated',
        organizationLevel: 'lead',
      };

      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.firstname).toBe(updateDto.firstname);
          expect(res.body.organizationLevel).toBe(updateDto.organizationLevel);
          expect(res.body.lastname).toBe(createUserDto.lastname); // Unchanged
        });
    });
  });

  describe('/users/:id/role (PATCH)', () => {
    it('should change user role', async () => {
      const createUserDto = {
        firstname: 'John',
        lastname: 'Doe',
        nationalcode: '1234567890',
        personalcode: 'EMP001',
        email: 'john.doe@example.com',
        organizationLevel: 'senior',
        password: 'securePassword123',
        role: 'user',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body._id;

      return request(app.getHttpServer())
        .patch(`/users/${userId}/role`)
        .send({ role: 'manager' })
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toBe('manager');
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete a user', async () => {
      const createUserDto = {
        firstname: 'John',
        lastname: 'Doe',
        nationalcode: '1234567890',
        personalcode: 'EMP001',
        email: 'john.doe@example.com',
        organizationLevel: 'senior',
        password: 'securePassword123',
        role: 'user',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const userId = createResponse.body._id;

      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(200);

      // Verify user is deleted
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(404);
    });
  });
});
