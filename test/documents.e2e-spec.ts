import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from '../src/schemas/document.schema';
import { User } from '../src/schemas/user.schema';

describe('Documents (e2e)', () => {
  let app: INestApplication;
  let documentModel: Model<Document>;
  let userModel: Model<User>;
  let testUser: any;

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

    documentModel = moduleFixture.get<Model<Document>>(getModelToken(Document.name));
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await documentModel.deleteMany({});
    await userModel.deleteMany({});

    // Create a test user for document tests
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
  });

  describe('/documents (POST)', () => {
    it('should create a new document', () => {
      const createDocumentDto = {
        filename: 'test-document.pdf',
        fileUrl: 'http://minio:9000/bucket/test-document.pdf',
        extension: 'pdf',
        fileUploader: testUser._id,
        rawTextFileId: 'elastic-doc-id-123',
        metadata: {
          size: 1024,
          uploadDate: new Date().toISOString(),
          tags: ['important', 'test'],
        },
      };

      return request(app.getHttpServer())
        .post('/documents')
        .send(createDocumentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.filename).toBe(createDocumentDto.filename);
          expect(res.body.fileUrl).toBe(createDocumentDto.fileUrl);
          expect(res.body.extension).toBe(createDocumentDto.extension);
          expect(res.body.fileUploader).toBe(createDocumentDto.fileUploader);
          expect(res.body.rawTextFileId).toBe(createDocumentDto.rawTextFileId);
          expect(res.body.metadata).toEqual(createDocumentDto.metadata);
        });
    });

    it('should return 400 for invalid input', () => {
      const invalidDocumentDto = {
        filename: 'test-document.pdf',
        // Missing required fields
      };

      return request(app.getHttpServer())
        .post('/documents')
        .send(invalidDocumentDto)
        .expect(400);
    });

    it('should return 400 for invalid fileUploader ID', () => {
      const invalidDocumentDto = {
        filename: 'test-document.pdf',
        fileUrl: 'http://minio:9000/bucket/test-document.pdf',
        extension: 'pdf',
        fileUploader: 'invalid-id',
        rawTextFileId: 'elastic-doc-id-123',
        metadata: {},
      };

      return request(app.getHttpServer())
        .post('/documents')
        .send(invalidDocumentDto)
        .expect(400);
    });
  });

  describe('/documents (GET)', () => {
    it('should return all documents', async () => {
      // Create test documents
      const documents = [
        {
          filename: 'document1.pdf',
          fileUrl: 'http://minio:9000/bucket/document1.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-1',
          metadata: { type: 'report' },
        },
        {
          filename: 'document2.docx',
          fileUrl: 'http://minio:9000/bucket/document2.docx',
          extension: 'docx',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-2',
          metadata: { type: 'memo' },
        },
      ];

      for (const doc of documents) {
        await request(app.getHttpServer())
          .post('/documents')
          .send(doc)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/documents')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toHaveProperty('fileUploader');
          expect(res.body[0].fileUploader).toHaveProperty('firstname');
        });
    });

    it('should support pagination', async () => {
      // Create multiple documents
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/documents')
          .send({
            filename: `document${i}.pdf`,
            fileUrl: `http://minio:9000/bucket/document${i}.pdf`,
            extension: 'pdf',
            fileUploader: testUser._id,
            rawTextFileId: `elastic-doc-${i}`,
            metadata: {},
          })
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/documents?page=1&limit=3')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(3);
        });
    });

    it('should support search', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .send({
          filename: 'important-report.pdf',
          fileUrl: 'http://minio:9000/bucket/important-report.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-important',
          metadata: {},
        })
        .expect(201);

      return request(app.getHttpServer())
        .get('/documents?search=important')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].filename).toContain('important');
        });
    });
  });

  describe('/documents/:id (GET)', () => {
    it('should return a document by id', async () => {
      const createDocumentDto = {
        filename: 'test-document.pdf',
        fileUrl: 'http://minio:9000/bucket/test-document.pdf',
        extension: 'pdf',
        fileUploader: testUser._id,
        rawTextFileId: 'elastic-doc-id-123',
        metadata: { type: 'test' },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/documents')
        .send(createDocumentDto)
        .expect(201);

      const documentId = createResponse.body._id;

      return request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(documentId);
          expect(res.body.filename).toBe(createDocumentDto.filename);
          expect(res.body.fileUploader).toHaveProperty('firstname');
        });
    });

    it('should return 404 for non-existent document', () => {
      const fakeId = '507f1f77bcf86cd799439011';
      return request(app.getHttpServer())
        .get(`/documents/${fakeId}`)
        .expect(404);
    });
  });

  describe('/documents/uploader/:uploaderId (GET)', () => {
    it('should return documents by uploader', async () => {
      const documents = [
        {
          filename: 'document1.pdf',
          fileUrl: 'http://minio:9000/bucket/document1.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-1',
          metadata: {},
        },
        {
          filename: 'document2.pdf',
          fileUrl: 'http://minio:9000/bucket/document2.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-2',
          metadata: {},
        },
      ];

      for (const doc of documents) {
        await request(app.getHttpServer())
          .post('/documents')
          .send(doc)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get(`/documents/uploader/${testUser._id}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0].fileUploader._id).toBe(testUser._id);
        });
    });
  });

  describe('/documents/extension/:extension (GET)', () => {
    it('should return documents by extension', async () => {
      const documents = [
        {
          filename: 'document1.pdf',
          fileUrl: 'http://minio:9000/bucket/document1.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-1',
          metadata: {},
        },
        {
          filename: 'document2.docx',
          fileUrl: 'http://minio:9000/bucket/document2.docx',
          extension: 'docx',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-2',
          metadata: {},
        },
      ];

      for (const doc of documents) {
        await request(app.getHttpServer())
          .post('/documents')
          .send(doc)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/documents/extension/pdf')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].extension).toBe('pdf');
        });
    });
  });

  describe('/documents/:id (PATCH)', () => {
    it('should update a document', async () => {
      const createDocumentDto = {
        filename: 'test-document.pdf',
        fileUrl: 'http://minio:9000/bucket/test-document.pdf',
        extension: 'pdf',
        fileUploader: testUser._id,
        rawTextFileId: 'elastic-doc-id-123',
        metadata: { type: 'test' },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/documents')
        .send(createDocumentDto)
        .expect(201);

      const documentId = createResponse.body._id;
      const updateDto = {
        filename: 'updated-document.pdf',
        metadata: { type: 'updated', version: 2 },
      };

      return request(app.getHttpServer())
        .patch(`/documents/${documentId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.filename).toBe(updateDto.filename);
          expect(res.body.metadata).toEqual(updateDto.metadata);
          expect(res.body.extension).toBe(createDocumentDto.extension); // Unchanged
        });
    });
  });

  describe('/documents/:id (DELETE)', () => {
    it('should delete a document', async () => {
      const createDocumentDto = {
        filename: 'test-document.pdf',
        fileUrl: 'http://minio:9000/bucket/test-document.pdf',
        extension: 'pdf',
        fileUploader: testUser._id,
        rawTextFileId: 'elastic-doc-id-123',
        metadata: {},
      };

      const createResponse = await request(app.getHttpServer())
        .post('/documents')
        .send(createDocumentDto)
        .expect(201);

      const documentId = createResponse.body._id;

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .expect(200);

      // Verify document is deleted
      return request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .expect(404);
    });
  });

  describe('/documents/stats (GET)', () => {
    it('should return document statistics', async () => {
      const documents = [
        {
          filename: 'document1.pdf',
          fileUrl: 'http://minio:9000/bucket/document1.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-1',
          metadata: {},
        },
        {
          filename: 'document2.docx',
          fileUrl: 'http://minio:9000/bucket/document2.docx',
          extension: 'docx',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-2',
          metadata: {},
        },
        {
          filename: 'document3.pdf',
          fileUrl: 'http://minio:9000/bucket/document3.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          rawTextFileId: 'elastic-doc-3',
          metadata: {},
        },
      ];

      for (const doc of documents) {
        await request(app.getHttpServer())
          .post('/documents')
          .send(doc)
          .expect(201);
      }

      return request(app.getHttpServer())
        .get('/documents/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalDocuments');
          expect(res.body).toHaveProperty('extensionStats');
          expect(res.body).toHaveProperty('uploaderStats');
          expect(res.body.totalDocuments).toBe(3);
          expect(res.body.extensionStats).toEqual([
            { extension: 'pdf', count: 2 },
            { extension: 'docx', count: 1 },
          ]);
        });
    });
  });

  describe('OCR Endpoints', () => {
    describe('POST /documents/ocr/submit', () => {
      it('should submit OCR result successfully', async () => {
        const createDocumentDto = {
          filename: 'test-document.pdf',
          fileUrl: 'http://minio:9000/bucket/test-document.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          metadata: { type: 'test' },
        };

        const createResponse = await request(app.getHttpServer())
          .post('/documents')
          .send(createDocumentDto)
          .expect(201);

        const documentId = createResponse.body._id;

        const ocrResultDto = {
          documentId: documentId,
          extractedText: 'This is the extracted text from the PDF document.',
        };

        return request(app.getHttpServer())
          .post('/documents/ocr/submit')
          .send(ocrResultDto)
          .expect(200)
          .expect((res) => {
            expect(res.body._id).toBe(documentId);
            expect(res.body.extractedText).toBe(ocrResultDto.extractedText);
            expect(res.body.ocrStatus).toBe('completed');
            expect(res.body.ocrMetadata).toHaveProperty('processedAt');
            expect(res.body.ocrMetadata).toHaveProperty('textLength');
            expect(res.body.ocrMetadata.textLength).toBe(ocrResultDto.extractedText.length);
            expect(res.body.ocrMetadata.processingCompletedBy).toBe('ocr-service');
          });
      });

      it('should return 404 for non-existent document', () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const ocrResultDto = {
          documentId: fakeId,
          extractedText: 'Some extracted text',
        };

        return request(app.getHttpServer())
          .post('/documents/ocr/submit')
          .send(ocrResultDto)
          .expect(404);
      });

      it('should return 400 for invalid document ID', () => {
        const ocrResultDto = {
          documentId: 'invalid-id',
          extractedText: 'Some extracted text',
        };

        return request(app.getHttpServer())
          .post('/documents/ocr/submit')
          .send(ocrResultDto)
          .expect(400);
      });

      it('should return 400 for missing required fields', () => {
        const ocrResultDto = {
          documentId: '507f1f77bcf86cd799439011',
          // Missing extractedText
        };

        return request(app.getHttpServer())
          .post('/documents/ocr/submit')
          .send(ocrResultDto)
          .expect(400);
      });

      it('should return 400 for empty extracted text', () => {
        const ocrResultDto = {
          documentId: '507f1f77bcf86cd799439011',
          extractedText: '', // Empty text should be invalid
        };

        return request(app.getHttpServer())
          .post('/documents/ocr/submit')
          .send(ocrResultDto)
          .expect(400);
      });
    });

    describe('PATCH /documents/:id/ocr/processing', () => {
      it('should mark document as processing', async () => {
        const createDocumentDto = {
          filename: 'processing-test.pdf',
          fileUrl: 'http://minio:9000/bucket/processing-test.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          metadata: {},
        };

        const createResponse = await request(app.getHttpServer())
          .post('/documents')
          .send(createDocumentDto)
          .expect(201);

        const documentId = createResponse.body._id;

        return request(app.getHttpServer())
          .patch(`/documents/${documentId}/ocr/processing`)
          .expect(200)
          .expect((res) => {
            expect(res.body._id).toBe(documentId);
            expect(res.body.ocrStatus).toBe('processing');
            expect(res.body.ocrMetadata).toHaveProperty('processingStartedAt');
          });
      });

      it('should return 404 for non-existent document', () => {
        const fakeId = '507f1f77bcf86cd799439011';
        return request(app.getHttpServer())
          .patch(`/documents/${fakeId}/ocr/processing`)
          .expect(404);
      });
    });

    describe('PATCH /documents/:id/ocr/failed', () => {
      it('should mark document OCR as failed', async () => {
        const createDocumentDto = {
          filename: 'failed-test.pdf',
          fileUrl: 'http://minio:9000/bucket/failed-test.pdf',
          extension: 'pdf',
          fileUploader: testUser._id,
          metadata: {},
        };

        const createResponse = await request(app.getHttpServer())
          .post('/documents')
          .send(createDocumentDto)
          .expect(201);

        const documentId = createResponse.body._id;
        const errorMessage = 'OCR processing failed: Unable to extract text from corrupted file';

        return request(app.getHttpServer())
          .patch(`/documents/${documentId}/ocr/failed`)
          .send({ error: errorMessage })
          .expect(200)
          .expect((res) => {
            expect(res.body._id).toBe(documentId);
            expect(res.body.ocrStatus).toBe('failed');
            expect(res.body.ocrMetadata.error).toBe(errorMessage);
            expect(res.body.ocrMetadata).toHaveProperty('failedAt');
          });
      });
    });

    describe('GET /documents/ocr/status/:status', () => {
      it('should return documents by OCR status', async () => {
        // Create documents with different OCR statuses
        const document1 = await request(app.getHttpServer())
          .post('/documents')
          .send({
            filename: 'pending-doc.pdf',
            fileUrl: 'http://minio:9000/bucket/pending-doc.pdf',
            extension: 'pdf',
            fileUploader: testUser._id,
            metadata: {},
          })
          .expect(201);

        const document2 = await request(app.getHttpServer())
          .post('/documents')
          .send({
            filename: 'completed-doc.pdf',
            fileUrl: 'http://minio:9000/bucket/completed-doc.pdf',
            extension: 'pdf',
            fileUploader: testUser._id,
            metadata: {},
          })
          .expect(201);

        // Mark one as completed
        await request(app.getHttpServer())
          .post('/documents/ocr/submit')
          .send({
            documentId: document2.body._id,
            extractedText: 'Completed document text',
          })
          .expect(200);

        return request(app.getHttpServer())
          .get('/documents/ocr/status/pending')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].ocrStatus).toBe('pending');
          });
      });

      it('should return 400 for invalid OCR status', () => {
        return request(app.getHttpServer())
          .get('/documents/ocr/status/invalid-status')
          .expect(400);
      });
    });
  });
});
