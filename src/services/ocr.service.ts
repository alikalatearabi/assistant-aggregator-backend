import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData = require('form-data');

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
  ) {}

  async sendDocumentForOcr(ocrRequest: OcrRequest): Promise<OcrResponse> {
    const baseUrl = this.configService.get<string>('OCR_API_URL_BASE') || 'http://78.39.182.65:8000';
    const authUrl = `${baseUrl}/authorize`;
    const filesUrl = `${baseUrl}/files`;
    
    try {
      this.logger.log(`Sending document for OCR processing: ${ocrRequest.documentId}`);
      
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
          timeout: 10000,
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
          timeout: 10000, // 10 seconds timeout
        })
      );

      this.logger.log(`OCR Files Response for document ${ocrRequest.documentId}:`, {
        status: response.status,
        data: response.data,
      });

      return {
        success: true,
        message: 'Document sent for OCR processing successfully',
        requestId: response.data?.requestId || response.data?.id,
        accessToken,
        refreshToken,
      };

    } catch (error) {
      this.logger.error(`Failed to send document for OCR processing: ${ocrRequest.documentId}`, {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Don't throw the error - we want document creation to succeed even if OCR fails
      return {
        success: false,
        message: `Failed to send document for OCR: ${error.message}`,
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
