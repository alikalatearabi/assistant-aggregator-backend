import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData = require('form-data');
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema';

export interface OcrRequest {
  documentId: string;
  minioUrl: string;
}

export interface OcrResponse {
  success: boolean;
  message: string;
  requestId?: string;
  accessToken?: string;
  refreshToken?: string;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(Document.name) private readonly documentModel: Model<DocumentDocument>,
  ) {}

  async sendDocumentForOcr(ocrRequest: OcrRequest): Promise<OcrResponse> {
    const baseUrl = this.configService.get<string>('OCR_API_URL_BASE') || 'http://78.39.182.65:8000';
    const authUrl = `${baseUrl}/authorize`;
    const filesUrl = `${baseUrl}/files`;
    
    try {
      this.logger.log(`Sending document for OCR processing: ${ocrRequest.documentId}`);

      // Best-effort: mark document OCR status as 'processing' in DB before sending
      try {
        if (Types.ObjectId.isValid(ocrRequest.documentId)) {
          const updated = await this.documentModel.findByIdAndUpdate(
            ocrRequest.documentId,
            {
              $set: {
                ocrStatus: 'processing',
                'ocrMetadata.processingStartedAt': new Date().toISOString(),
                'metadata.ocr.processingStartedAt': new Date().toISOString(),
              }
            },
            { new: true },
          ).exec();

          if (updated) {
            this.logger.log(`Document ${ocrRequest.documentId} marked as OCR processing (started)`);
            console.log(`🟡 Document ${ocrRequest.documentId} marked as OCR processing`);
          } else {
            this.logger.warn(`Mark processing: no document found with id ${ocrRequest.documentId}`);
            console.log(`⚠️  Could not find document ${ocrRequest.documentId} to mark as processing`);
          }
        }
      } catch (markErr) {
        this.logger.warn(`Failed to mark document ${ocrRequest.documentId} as processing: ${markErr?.message || markErr}`);
      }
      
      const username = this.configService.get<string>('OCR_USERNAME') || 'user1';
      const password = this.configService.get<string>('OCR_PASSWORD') || 'pass1';
      
      // Create URL-encoded form data for OCR auth
      const authPayload = new URLSearchParams();
      authPayload.append('username', username);
      authPayload.append('password', password);

      this.logger.debug(`OCR Auth Request payload:`, { username, password: '[REDACTED]' });

      const authResponse = await firstValueFrom(
        this.httpService.post(authUrl, authPayload.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );

      const accessToken = authResponse.data?.access_token || authResponse.data?.accessToken;
      const refreshToken = authResponse.data?.refresh_token || authResponse.data?.refreshToken;

      if (!accessToken) {
        throw new Error('OCR authorization failed: access_token not present in response');
      }

      // 2) Submit file with bearer token - using multipart/form-data
      const formData = new FormData();
      formData.append('job_id', ocrRequest.documentId);
      formData.append('url', ocrRequest.minioUrl);

      this.logger.debug(`OCR Files Request payload:`, {
        job_id: ocrRequest.documentId,
        url: ocrRequest.minioUrl,
      });

      const response = await firstValueFrom(
        this.httpService.post(filesUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${accessToken}`,
          },
        })
      );

      this.logger.log(`OCR Files Response for document ${ocrRequest.documentId}:`, {
        status: response.status,
        data: response.data,
      });

      console.log(`🟢 OCR processing started successfully for document ${ocrRequest.documentId}`);
      console.log(`   Response status: ${response.status}`);
      console.log(`   Request ID: ${response.data?.requestId || response.data?.id || 'N/A'}`);

      return {
        success: true,
        message: 'Document sent for OCR processing successfully',
        requestId: response.data?.requestId || response.data?.id,
        accessToken,
        refreshToken,
      };

    } catch (error) {
      const statusCode = error?.response?.status;
      const responseBody = error?.response?.data || error?.response;
      const errMsg = error?.message || String(error);

      // Build a concise stored error message
      const storedError = statusCode
        ? `HTTP ${statusCode}: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`
        : errMsg;

      // Enhanced console logging for OCR errors
      console.log(`🔴 OCR ERROR for document ${ocrRequest.documentId}:`);
      console.log(`   Status Code: ${statusCode || 'N/A'}`);
      console.log(`   Error Message: ${errMsg}`);
      console.log(`   Response Body:`, responseBody);
      console.log(`   Stored Error: ${storedError}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);

      this.logger.error(`Failed to send document for OCR processing: ${ocrRequest.documentId}`, {
        error: errMsg,
        stack: error?.stack,
        response: responseBody,
        status: statusCode,
      });

      // Attempt to mark the document as failed in the database (best-effort)
      try {
        if (Types.ObjectId.isValid(ocrRequest.documentId)) {
          const updated = await this.documentModel.findByIdAndUpdate(
            ocrRequest.documentId,
            {
              $set: {
                ocrStatus: 'failed',
                'ocrMetadata.error': storedError,
                'ocrMetadata.httpStatus': statusCode,
                'ocrMetadata.response': responseBody,
                'ocrMetadata.failedAt': new Date().toISOString(),
                'metadata.ocr.error': storedError,
                'metadata.ocr.httpStatus': statusCode,
                'metadata.ocr.response': responseBody,
                'metadata.ocr.failedAt': new Date().toISOString(),
              }
            },
            { new: true },
          ).exec();

          if (updated) {
            this.logger.log(`Document ${ocrRequest.documentId} marked as OCR failed`);
            console.log(`✅ Document ${ocrRequest.documentId} successfully marked as OCR failed in database`);
          } else {
            this.logger.warn(`Mark failed: no document found with id ${ocrRequest.documentId}`);
            console.log(`⚠️  Could not find document ${ocrRequest.documentId} to mark as OCR failed`);
          }
        } else {
          this.logger.warn(`Cannot mark OCR failed: invalid document id ${ocrRequest.documentId}`);
        }
      } catch (dbErr) {
        this.logger.error(`Failed to mark document ${ocrRequest.documentId} as OCR failed: ${dbErr?.message || dbErr}`);
      }

      // Don't throw the error - we want document creation to succeed even if OCR fails
      return {
        success: false,
        message: `Failed to send document for OCR: ${errMsg}`,
      };
    }
  }

  async sendDocumentForOcrAsync(ocrRequest: OcrRequest): Promise<void> {
    // Fire and forget - don't wait for the response
    setImmediate(async () => {
      try {
        await this.sendDocumentForOcr(ocrRequest);
      } catch (error) {
        this.logger.error(`Async OCR processing failed for document ${ocrRequest.documentId}:`, error);
      }
    });
  }
}
