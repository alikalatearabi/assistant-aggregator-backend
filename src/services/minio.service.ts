import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private client: Client;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.config.get<string>('MINIO_PORT') || '9000', 10),
      useSSL: (this.config.get<string>('MINIO_USE_SSL') || 'false') === 'true',
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.config.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
    });
    
    // Log configuration on startup (without secrets)
    this.logger.log(`MinIO Configuration:`);
    this.logger.log(`- ENDPOINT: ${this.config.get<string>('MINIO_ENDPOINT') || 'localhost'}`);
    this.logger.log(`- PORT: ${this.config.get<string>('MINIO_PORT') || '9000'}`);
    this.logger.log(`- USE_SSL: ${this.config.get<string>('MINIO_USE_SSL') || 'false'}`);
    this.logger.log(`- BUCKET: ${this.config.get<string>('MINIO_BUCKET') || 'assistant-aggregator'}`);
    this.logger.log(`- EXTERNAL_URL: HARDCODED TO 185.149.192.130:9000 for external API access`);
  }

  async getPresignedUrl(bucket: string, objectName: string, expiresSeconds = 900): Promise<string> {
    // Ensure minimum and maximum expiry supported by MinIO (1 sec to 7 days for S3)
    const expires = Math.max(1, Math.min(expiresSeconds, 7 * 24 * 60 * 60));
    return this.client.presignedGetObject(bucket, objectName, expires);
  }

  private getDefaultBucket(): string {
    return this.config.get<string>('MINIO_BUCKET') || 'assistant-aggregator';
  }

  private buildPublicUrl(bucket: string, objectName: string): string {
    // Hardcoded external server address for external API access
    const serverExternalIp = '185.149.192.130:9000';
    const url = `http://${serverExternalIp}/${bucket}/${objectName}`;
    
    this.logger.log(`Built public URL for external access: ${url}`);
    return url;
  }

  private async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(bucket, 'us-east-1');
    }
  }

  async uploadAndGetUrl(params: {
    buffer: Buffer;
    objectName: string;
    contentType?: string;
    bucket?: string;
  }): Promise<string> {
    this.logger.log(`Starting upload: ${params.objectName}, size: ${params.buffer.length} bytes, type: ${params.contentType}`);
    
    const bucket = params.bucket || this.getDefaultBucket();
    this.logger.log(`Using bucket: ${bucket}`);
    
    await this.ensureBucket(bucket);
    this.logger.log(`Bucket ensured: ${bucket}`);
    
    await this.client.putObject(
      bucket,
      params.objectName,
      params.buffer,
      params.buffer.length,
      {
        'Content-Type': params.contentType || 'application/octet-stream',
      },
    );
    this.logger.log(`Upload completed: ${params.objectName}`);
    
    const url = this.buildPublicUrl(bucket, params.objectName);
    this.logger.log(`Final URL generated: ${url}`);
    return url;
  }
}
