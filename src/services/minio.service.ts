import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class MinioService {
  private client: Client;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.config.get<string>('MINIO_PORT') || '9000', 10),
      useSSL: (this.config.get<string>('MINIO_USE_SSL') || 'false') === 'true',
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.config.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
    });
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
    const host = this.config.get<string>('MINIO_ENDPOINT') || 'localhost';
    const port = parseInt(this.config.get<string>('MINIO_PORT') || '9000', 10);
    const useSSL = (this.config.get<string>('MINIO_USE_SSL') || 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';
    return `${protocol}://${host}:${port}/${bucket}/${objectName}`;
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
    const bucket = params.bucket || this.getDefaultBucket();
    await this.ensureBucket(bucket);
    await this.client.putObject(
      bucket,
      params.objectName,
      params.buffer,
      params.buffer.length,
      {
        'Content-Type': params.contentType || 'application/octet-stream',
      },
    );
    return this.buildPublicUrl(bucket, params.objectName);
  }
}
