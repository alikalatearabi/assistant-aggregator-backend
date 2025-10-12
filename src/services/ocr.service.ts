import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OcrRequest {
  documentId: string;
  minioUrl: string;
}

export interface OcrResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendDocumentForOcr(ocrRequest: OcrRequest): Promise<OcrResponse> {
    const ocrApiUrl = this.configService.get<string>('OCR_API_URL') || 'https://api.example.com/ocr/process';
    
    try {
      this.logger.log(`Sending document for OCR processing: ${ocrRequest.documentId}`);
      
      const requestPayload = {
        document_id: ocrRequest.documentId,
        file_url: ocrRequest.minioUrl,
      };

      this.logger.debug(`OCR API Request payload:`, requestPayload);

      const response = await firstValueFrom(
        this.httpService.post(ocrApiUrl, requestPayload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.configService.get<string>('OCR_API_KEY') || 'mock-api-key'}`,
          },
          timeout: 10000, // 10 seconds timeout
        })
      );

      this.logger.log(`OCR API Response for document ${ocrRequest.documentId}:`, {
        status: response.status,
        data: response.data,
      });

      return {
        success: true,
        message: 'Document sent for OCR processing successfully',
        requestId: response.data?.requestId || response.data?.id,
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
