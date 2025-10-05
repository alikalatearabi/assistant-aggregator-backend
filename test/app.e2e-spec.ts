import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

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
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World! MongoDB with Mongoose is configured with enhanced User entity.');
    });
  });

  describe('API Documentation', () => {
    it('/api/docs (GET) - should serve Swagger documentation', () => {
      return request(app.getHttpServer())
        .get('/api/docs')
        .expect(301); // Redirect to /api/docs/
    });

    it('/api/docs/ (GET) - should serve Swagger UI', () => {
      return request(app.getHttpServer())
        .get('/api/docs/')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('swagger-ui');
        });
    });
  });

  describe('API Routes', () => {
    it('should have users routes', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200);
    });

    it('should have documents routes', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .expect(200);
    });

    it('should have messages routes', () => {
      return request(app.getHttpServer())
        .get('/messages')
        .expect(200);
    });

    it('should have chats routes', () => {
      return request(app.getHttpServer())
        .get('/chats')
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should handle CORS', () => {
      return request(app.getHttpServer())
        .options('/')
        .expect(204);
    });
  });
});
