import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat } from '../src/schemas/chat.schema';
import { User } from '../src/schemas/user.schema';
import { Message } from '../src/schemas/message.schema';

describe('Chats (e2e)', () => {
  let app: INestApplication;
  let chatModel: Model<Chat>;
  let userModel: Model<User>;
  let messageModel: Model<Message>;
  let testUser: any;
  let testMessages: any[] = [];

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

    chatModel = moduleFixture.get<Model<Chat>>(getModelToken(Chat.name));
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    messageModel = moduleFixture.get<Model<Message>>(getModelToken(Message.name));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await chatModel.deleteMany({});
    await userModel.deleteMany({});
    await messageModel.deleteMany({});

    // Create a test user for chat tests
    const createUserResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        firstname: 'Test',
        lastname: 'User',
        nationalcode: '1234567890',
        personalcode: 'TEST001',
        email: 'test.user@example.com',
        organizationLevel: 'senior',
        password: 'testPassword123',
        role: 'user',
      })
      .expect(201);

    testUser = createUserResponse.body;

    // Create test messages
    testMessages = [];
    const messageData = [
      {
        category: 'user_input',
        text: 'Hello, how are you?',
        date: new Date().toISOString(),
        score: 0.7,
      },
      {
        category: 'assistant_response',
        text: 'I am doing well, thank you!',
        date: new Date().toISOString(),
        score: 0.8,
      },
    ];

    for (const msgData of messageData) {
      const msgResponse = await request(app.getHttpServer())
        .post('/messages')
        .send(msgData)
        .expect(201);
      testMessages.push(msgResponse.body);
    }
  });

  describe('/chats (POST)', () => {
    it('should create a new chat', () => {
      const createChatDto = {
        session: 'test-session-001',
        user: testUser._id,
        messageHistory: [testMessages[0]._id],
      };

      return request(app.getHttpServer())
        .post('/chats')
        .send(createChatDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.session).toBe(createChatDto.session);
          expect(res.body.user).toBe(createChatDto.user);
          expect(res.body.messageHistory).toHaveLength(1);
          expect(res.body.messageHistory[0]).toBe(testMessages[0]._id);
        });
    });

    it('should create a chat with empty message history', () => {
      const createChatDto = {
        session: 'empty-session-001',
        user: testUser._id,
        messageHistory: [],
      };

      return request(app.getHttpServer())
        .post('/chats')
        .send(createChatDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.session).toBe(createChatDto.session);
          expect(res.body.messageHistory).toHaveLength(0);
        });
    });

    it('should return 400 for invalid user ID', () => {
      const invalidChatDto = {
        session: 'test-session-002',
        user: 'invalid-user-id',
        messageHistory: [],
      };

      return request(app.getHttpServer())
        .post('/chats')
        .send(invalidChatDto)
        .expect(400);
    });

    it('should return 400 for invalid message ID in history', () => {
      const invalidChatDto = {
        session: 'test-session-003',
        user: testUser._id,
        messageHistory: ['invalid-message-id'],
      };

      return request(app.getHttpServer())
        .post('/chats')
        .send(invalidChatDto)
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      const invalidChatDto = {
        session: 'test-session-004',
        // Missing user and messageHistory
      };

      return request(app.getHttpServer())
        .post('/chats')
        .send(invalidChatDto)
        .expect(400);
    });
  });

  describe('/chats (GET)', () => {
    it('should return all chats with populated data', async () => {
      // Create test chats
      const chats = [
        {
          session: 'session-001',
          user: testUser._id,
          messageHistory: [testMessages[0]._id],
        },
        {
          session: 'session-002',
          user: testUser._id,
          messageHistory: [testMessages[1]._id],
        },
      ];

      for (const chat of chats) {
        await request(app.getHttpServer())
          .post('/chats')
          .send(chat)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/chats')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toHaveProperty('user');
          expect(res.body[0].user).toHaveProperty('firstname');
          expect(res.body[0]).toHaveProperty('messageHistory');
          expect(res.body[0].messageHistory[0]).toHaveProperty('text');
        });
    });

    it('should support pagination', async () => {
      // Create multiple chats
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/chats')
          .send({
            session: `session-${i}`,
            user: testUser._id,
            messageHistory: [],
          })
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/chats?page=1&limit=3')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(3);
        });
    });

    it('should support search', async () => {
      await request(app.getHttpServer())
        .post('/chats')
        .send({
          session: 'unique-search-session',
          user: testUser._id,
          messageHistory: [],
        })
        .expect(201);

      return request(app.getHttpServer())
        .get('/chats?search=unique-search')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].session).toContain('unique-search');
        });
    });

    it('should support user filtering', async () => {
      // Create another user
      const anotherUserResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          firstname: 'Another',
          lastname: 'User',
          nationalcode: '0987654321',
          personalcode: 'TEST002',
          email: 'another.user@example.com',
          organizationLevel: 'junior',
          password: 'anotherPassword123',
          role: 'user',
        })
        .expect(201);

      const anotherUser = anotherUserResponse.body;

      // Create chats for both users
      await request(app.getHttpServer())
        .post('/chats')
        .send({
          session: 'session-user1',
          user: testUser._id,
          messageHistory: [],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/chats')
        .send({
          session: 'session-user2',
          user: anotherUser._id,
          messageHistory: [],
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/chats?userId=${testUser._id}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].user._id).toBe(testUser._id);
        });
    });
  });

  describe('/chats/:id (GET)', () => {
    it('should return a chat by id with populated data', async () => {
      const createChatDto = {
        session: 'test-session-get',
        user: testUser._id,
        messageHistory: testMessages.map(msg => msg._id),
      };

      const createResponse = await request(app.getHttpServer())
        .post('/chats')
        .send(createChatDto)
        .expect(201);

      const chatId = createResponse.body._id;

      return request(app.getHttpServer())
        .get(`/chats/${chatId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(chatId);
          expect(res.body.session).toBe(createChatDto.session);
          expect(res.body.user).toHaveProperty('firstname');
          expect(res.body.messageHistory).toHaveLength(2);
          expect(res.body.messageHistory[0]).toHaveProperty('text');
          expect(res.body.messageHistory[1]).toHaveProperty('text');
        });
    });

    it('should return 404 for non-existent chat', () => {
      const fakeId = '507f1f77bcf86cd799439011';
      return request(app.getHttpServer())
        .get(`/chats/${fakeId}`)
        .expect(404);
    });
  });

  describe('/chats/user/:userId (GET)', () => {
    it('should return chats by user', async () => {
      const chats = [
        {
          session: 'user-session-1',
          user: testUser._id,
          messageHistory: [testMessages[0]._id],
        },
        {
          session: 'user-session-2',
          user: testUser._id,
          messageHistory: [testMessages[1]._id],
        },
      ];

      for (const chat of chats) {
        await request(app.getHttpServer())
          .post('/chats')
          .send(chat)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get(`/chats/user/${testUser._id}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0].user._id).toBe(testUser._id);
          expect(res.body[1].user._id).toBe(testUser._id);
        });
    });
  });

  describe('/chats/session/:session (GET)', () => {
    it('should return chats by session', async () => {
      const sessionName = 'specific-session-test';
      
      await request(app.getHttpServer())
        .post('/chats')
        .send({
          session: sessionName,
          user: testUser._id,
          messageHistory: [testMessages[0]._id],
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/chats/session/${sessionName}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].session).toBe(sessionName);
        });
    });
  });

  describe('/chats/:id (PATCH)', () => {
    it('should update a chat', async () => {
      const createChatDto = {
        session: 'original-session',
        user: testUser._id,
        messageHistory: [testMessages[0]._id],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/chats')
        .send(createChatDto)
        .expect(201);

      const chatId = createResponse.body._id;
      const updateDto = {
        session: 'updated-session',
        messageHistory: testMessages.map(msg => msg._id),
      };

      return request(app.getHttpServer())
        .patch(`/chats/${chatId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.session).toBe(updateDto.session);
          expect(res.body.messageHistory).toHaveLength(2);
          expect(res.body.user._id).toBe(testUser._id); // Unchanged
        });
    });
  });

  describe('/chats/:id/messages (POST)', () => {
    it('should add a message to chat history', async () => {
      const createChatDto = {
        session: 'add-message-session',
        user: testUser._id,
        messageHistory: [testMessages[0]._id],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/chats')
        .send(createChatDto)
        .expect(201);

      const chatId = createResponse.body._id;

      return request(app.getHttpServer())
        .post(`/chats/${chatId}/messages`)
        .send({ messageId: testMessages[1]._id })
        .expect(200)
        .expect((res) => {
          expect(res.body.messageHistory).toHaveLength(2);
          expect(res.body.messageHistory).toContain(testMessages[1]._id);
        });
    });

    it('should return 400 for invalid message ID', async () => {
      const createChatDto = {
        session: 'add-invalid-message-session',
        user: testUser._id,
        messageHistory: [],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/chats')
        .send(createChatDto)
        .expect(201);

      const chatId = createResponse.body._id;

      return request(app.getHttpServer())
        .post(`/chats/${chatId}/messages`)
        .send({ messageId: 'invalid-message-id' })
        .expect(400);
    });
  });

  describe('/chats/:id (DELETE)', () => {
    it('should delete a chat', async () => {
      const createChatDto = {
        session: 'delete-test-session',
        user: testUser._id,
        messageHistory: [testMessages[0]._id],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/chats')
        .send(createChatDto)
        .expect(201);

      const chatId = createResponse.body._id;

      await request(app.getHttpServer())
        .delete(`/chats/${chatId}`)
        .expect(200);

      // Verify chat is deleted
      return request(app.getHttpServer())
        .get(`/chats/${chatId}`)
        .expect(404);
    });
  });

  describe('/chats/stats (GET)', () => {
    it('should return chat statistics', async () => {
      // Create chats with different characteristics
      const chats = [
        {
          session: 'stats-session-1',
          user: testUser._id,
          messageHistory: [testMessages[0]._id],
        },
        {
          session: 'stats-session-2',
          user: testUser._id,
          messageHistory: testMessages.map(msg => msg._id),
        },
        {
          session: 'stats-session-3',
          user: testUser._id,
          messageHistory: [],
        },
      ];

      for (const chat of chats) {
        await request(app.getHttpServer())
          .post('/chats')
          .send(chat)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/chats/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalChats');
          expect(res.body).toHaveProperty('userStats');
          expect(res.body).toHaveProperty('averageMessagesPerChat');
          expect(res.body.totalChats).toBe(3);
          expect(res.body.averageMessagesPerChat).toBeCloseTo(1, 1); // (1+2+0)/3 = 1
          expect(Array.isArray(res.body.userStats)).toBe(true);
          expect(res.body.userStats[0]).toHaveProperty('user');
          expect(res.body.userStats[0]).toHaveProperty('chatCount');
        });
    });
  });
});
