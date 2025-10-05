import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';

let mongod: MongoMemoryServer;

/**
 * Setup in-memory MongoDB for testing
 */
export const setupTestDatabase = async (): Promise<string> => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  return uri;
};

/**
 * Cleanup test database
 */
export const teardownTestDatabase = async (): Promise<void> => {
  if (mongod) {
    await mongod.stop();
  }
};

/**
 * Clear all collections in the test database
 */
export const clearTestDatabase = async (connection: Connection): Promise<void> => {
  const collections = connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Create test data helpers
 */
export const createTestUser = () => ({
  firstname: 'Test',
  lastname: 'User',
  nationalcode: '1234567890',
  personalcode: 'TEST001',
  email: 'test.user@example.com',
  organizationLevel: 'senior',
  password: 'testPassword123',
  role: 'user',
});

export const createTestDocument = (fileUploader: string) => ({
  filename: 'test-document.pdf',
  fileUrl: 'http://minio:9000/bucket/test-document.pdf',
  extension: 'pdf',
  fileUploader,
  rawTextFileId: 'elastic-doc-id-123',
  metadata: {
    size: 1024,
    uploadDate: new Date().toISOString(),
    tags: ['test'],
  },
});

export const createTestMessage = () => ({
  category: 'user_input',
  text: 'This is a test message',
  date: new Date().toISOString(),
  score: 0.7,
});

export const createTestChat = (user: string, messageHistory: string[] = []) => ({
  session: 'test-session-001',
  user,
  messageHistory,
});

/**
 * Wait for a specified amount of time
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate random test data
 */
export const generateRandomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateRandomEmail = (): string => {
  return `test.${generateRandomString(8)}@example.com`;
};

export const generateRandomNationalCode = (): string => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

/**
 * Test environment configuration
 */
export const getTestConfig = () => ({
  MONGODB_URI: 'mongodb://localhost:27017/assistant_aggregator_test',
  NODE_ENV: 'test',
  PORT: '3001',
  MINIO_ENDPOINT: 'localhost',
  MINIO_PORT: '9000',
  MINIO_ACCESS_KEY: 'minioadmin',
  MINIO_SECRET_KEY: 'minioadmin123',
  MINIO_USE_SSL: 'false',
  MINIO_BUCKET_NAME: 'test-bucket',
  ELASTICSEARCH_NODE: 'http://localhost:9200',
  ELASTICSEARCH_INDEX_PREFIX: 'test_assistant_aggregator',
});

/**
 * Custom matchers for testing
 */
export const expectValidObjectId = (id: string) => {
  expect(id).toMatch(/^[0-9a-fA-F]{24}$/);
};

export const expectValidISODate = (date: string) => {
  expect(new Date(date).toISOString()).toBe(date);
};

export const expectValidScore = (score: number) => {
  expect(score).toBeGreaterThanOrEqual(-1);
  expect(score).toBeLessThanOrEqual(1);
};

/**
 * Error testing helpers
 */
export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('message');
  if (field) {
    expect(response.body.message).toContain(field);
  }
};

export const expectNotFoundError = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('message');
};

export const expectConflictError = (response: any) => {
  expect(response.status).toBe(409);
  expect(response.body).toHaveProperty('message');
};
