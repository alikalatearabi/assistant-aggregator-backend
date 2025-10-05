import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../src/schemas/message.schema';

describe('Messages (e2e)', () => {
  let app: INestApplication;
  let messageModel: Model<Message>;

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

    messageModel = moduleFixture.get<Model<Message>>(getModelToken(Message.name));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await messageModel.deleteMany({});
  });

  describe('/messages (POST)', () => {
    it('should create a new message', () => {
      const createMessageDto = {
        category: 'user_input',
        text: 'This is a test message',
        date: new Date().toISOString(),
        score: 0.8,
      };

      return request(app.getHttpServer())
        .post('/messages')
        .send(createMessageDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.category).toBe(createMessageDto.category);
          expect(res.body.text).toBe(createMessageDto.text);
          expect(res.body.score).toBe(createMessageDto.score);
          expect(new Date(res.body.date)).toEqual(new Date(createMessageDto.date));
        });
    });

    it('should create a message with negative score', () => {
      const createMessageDto = {
        category: 'system_error',
        text: 'This is an error message',
        date: new Date().toISOString(),
        score: -1.0,
      };

      return request(app.getHttpServer())
        .post('/messages')
        .send(createMessageDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.score).toBe(-1.0);
        });
    });

    it('should create a message with positive score', () => {
      const createMessageDto = {
        category: 'assistant_response',
        text: 'This is a positive response',
        date: new Date().toISOString(),
        score: 1.0,
      };

      return request(app.getHttpServer())
        .post('/messages')
        .send(createMessageDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.score).toBe(1.0);
        });
    });

    it('should return 400 for invalid score range', () => {
      const invalidMessageDto = {
        category: 'user_input',
        text: 'Test message',
        date: new Date().toISOString(),
        score: 2.0, // Invalid: should be between -1 and 1
      };

      return request(app.getHttpServer())
        .post('/messages')
        .send(invalidMessageDto)
        .expect(400);
    });

    it('should return 400 for invalid category', () => {
      const invalidMessageDto = {
        category: 'invalid_category',
        text: 'Test message',
        date: new Date().toISOString(),
        score: 0.5,
      };

      return request(app.getHttpServer())
        .post('/messages')
        .send(invalidMessageDto)
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      const invalidMessageDto = {
        category: 'user_input',
        // Missing text, date, and score
      };

      return request(app.getHttpServer())
        .post('/messages')
        .send(invalidMessageDto)
        .expect(400);
    });
  });

  describe('/messages (GET)', () => {
    it('should return all messages', async () => {
      // Create test messages
      const messages = [
        {
          category: 'user_input',
          text: 'First test message',
          date: new Date().toISOString(),
          score: 0.5,
        },
        {
          category: 'assistant_response',
          text: 'Second test message',
          date: new Date().toISOString(),
          score: 0.8,
        },
      ];

      for (const message of messages) {
        await request(app.getHttpServer())
          .post('/messages')
          .send(message)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/messages')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
        });
    });

    it('should support pagination', async () => {
      // Create multiple messages
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/messages')
          .send({
            category: 'user_input',
            text: `Test message ${i}`,
            date: new Date().toISOString(),
            score: 0.1 * i,
          })
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/messages?page=1&limit=3')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(3);
        });
    });

    it('should support search', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .send({
          category: 'user_input',
          text: 'This is a unique test message',
          date: new Date().toISOString(),
          score: 0.5,
        })
        .expect(201);

      return request(app.getHttpServer())
        .get('/messages?search=unique')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].text).toContain('unique');
        });
    });

    it('should support category filtering', async () => {
      const messages = [
        {
          category: 'user_input',
          text: 'User message',
          date: new Date().toISOString(),
          score: 0.5,
        },
        {
          category: 'assistant_response',
          text: 'Assistant message',
          date: new Date().toISOString(),
          score: 0.8,
        },
      ];

      for (const message of messages) {
        await request(app.getHttpServer())
          .post('/messages')
          .send(message)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/messages?category=user_input')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].category).toBe('user_input');
        });
    });

    it('should support score range filtering', async () => {
      const messages = [
        {
          category: 'user_input',
          text: 'Low score message',
          date: new Date().toISOString(),
          score: -0.5,
        },
        {
          category: 'assistant_response',
          text: 'High score message',
          date: new Date().toISOString(),
          score: 0.8,
        },
      ];

      for (const message of messages) {
        await request(app.getHttpServer())
          .post('/messages')
          .send(message)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/messages?minScore=0&maxScore=1')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].score).toBeGreaterThanOrEqual(0);
        });
    });
  });

  describe('/messages/:id (GET)', () => {
    it('should return a message by id', async () => {
      const createMessageDto = {
        category: 'user_input',
        text: 'Test message for retrieval',
        date: new Date().toISOString(),
        score: 0.7,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/messages')
        .send(createMessageDto)
        .expect(201);

      const messageId = createResponse.body._id;

      return request(app.getHttpServer())
        .get(`/messages/${messageId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(messageId);
          expect(res.body.text).toBe(createMessageDto.text);
        });
    });

    it('should return 404 for non-existent message', () => {
      const fakeId = '507f1f77bcf86cd799439011';
      return request(app.getHttpServer())
        .get(`/messages/${fakeId}`)
        .expect(404);
    });
  });

  describe('/messages/category/:category (GET)', () => {
    it('should return messages by category', async () => {
      const messages = [
        {
          category: 'user_input',
          text: 'User message 1',
          date: new Date().toISOString(),
          score: 0.3,
        },
        {
          category: 'user_input',
          text: 'User message 2',
          date: new Date().toISOString(),
          score: 0.7,
        },
        {
          category: 'assistant_response',
          text: 'Assistant message',
          date: new Date().toISOString(),
          score: 0.9,
        },
      ];

      for (const message of messages) {
        await request(app.getHttpServer())
          .post('/messages')
          .send(message)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/messages/category/user_input')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0].category).toBe('user_input');
          expect(res.body[1].category).toBe('user_input');
        });
    });
  });

  describe('/messages/:id (PATCH)', () => {
    it('should update a message', async () => {
      const createMessageDto = {
        category: 'user_input',
        text: 'Original message',
        date: new Date().toISOString(),
        score: 0.5,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/messages')
        .send(createMessageDto)
        .expect(201);

      const messageId = createResponse.body._id;
      const updateDto = {
        text: 'Updated message text',
        score: 0.8,
      };

      return request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.text).toBe(updateDto.text);
          expect(res.body.score).toBe(updateDto.score);
          expect(res.body.category).toBe(createMessageDto.category); // Unchanged
        });
    });

    it('should return 400 for invalid score in update', async () => {
      const createMessageDto = {
        category: 'user_input',
        text: 'Test message',
        date: new Date().toISOString(),
        score: 0.5,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/messages')
        .send(createMessageDto)
        .expect(201);

      const messageId = createResponse.body._id;

      return request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .send({ score: 2.0 }) // Invalid score
        .expect(400);
    });
  });

  describe('/messages/:id (DELETE)', () => {
    it('should delete a message', async () => {
      const createMessageDto = {
        category: 'user_input',
        text: 'Message to be deleted',
        date: new Date().toISOString(),
        score: 0.5,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/messages')
        .send(createMessageDto)
        .expect(201);

      const messageId = createResponse.body._id;

      await request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .expect(200);

      // Verify message is deleted
      return request(app.getHttpServer())
        .get(`/messages/${messageId}`)
        .expect(404);
    });
  });

  describe('/messages/stats (GET)', () => {
    it('should return message statistics', async () => {
      const messages = [
        {
          category: 'user_input',
          text: 'Positive message',
          date: new Date().toISOString(),
          score: 0.8,
        },
        {
          category: 'assistant_response',
          text: 'Negative message',
          date: new Date().toISOString(),
          score: -0.6,
        },
        {
          category: 'system_error',
          text: 'Neutral message',
          date: new Date().toISOString(),
          score: 0.0,
        },
      ];

      for (const message of messages) {
        await request(app.getHttpServer())
          .post('/messages')
          .send(message)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/messages/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalMessages');
          expect(res.body).toHaveProperty('categoryStats');
          expect(res.body).toHaveProperty('sentimentStats');
          expect(res.body.totalMessages).toBe(3);
          expect(res.body.sentimentStats).toHaveProperty('positive');
          expect(res.body.sentimentStats).toHaveProperty('negative');
          expect(res.body.sentimentStats).toHaveProperty('neutral');
          expect(res.body.sentimentStats.positive).toBe(1);
          expect(res.body.sentimentStats.negative).toBe(1);
          expect(res.body.sentimentStats.neutral).toBe(1);
        });
    });
  });
});
