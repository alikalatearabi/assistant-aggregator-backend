import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { Readable } from 'stream';

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
  }

  async getPresignedDownloadUrl(objectName: string, expiresSeconds = 600, bucket?: string): Promise<string> {
    const targetBucket = bucket || this.config.get<string>('MINIO_BUCKET') || 'assistant-aggregator';
    const expires = Math.max(1, Math.min(expiresSeconds, 7 * 24 * 60 * 60));
    this.logger.log(`Generating presigned download URL for ${objectName} in bucket ${targetBucket}`);
    const url = await this.client.presignedGetObject(targetBucket, objectName, expires);
    return url;
  }

  async getFileStream(objectName: string, bucket?: string): Promise<Readable> {
    const targetBucket = bucket || this.config.get<string>('MINIO_BUCKET') || 'assistant-aggregator';

    try {
      const stream = await this.client.getObject(targetBucket, objectName);
      this.logger.log(`Streaming file from bucket=${targetBucket}, object=${objectName}`);
      return stream;
    } catch (error) {
      this.logger.error(`Failed to stream file: ${error.message}`);
      if (error.code === 'NoSuchKey') {
        throw new NotFoundException('File not found in MinIO');
      }
      throw new BadRequestException('Failed to retrieve file');
    }
  }

  private getDefaultBucket(): string {
    return this.config.get<string>('MINIO_BUCKET') || 'assistant-aggregator';
  }

  private buildPublicUrl(bucket: string, objectName: string): string {
    // Hardcoded external server address for external API access    
    const serverExternalIp = (this.config.get<string>('MINIO_ENDPOINT') || '192.168.56.52')+':'+(this.config.get<string>('MINIO_PORT') || '9000')
    //const serverExternalIp = '185.149.192.130:9000';
    // Ensure each path segment is URL-encoded to support non-ASCII filenames
    const encodedObjectPath = objectName
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');

    const url = `http://${serverExternalIp}/${bucket}/${encodedObjectPath}`;

    this.logger.log(`Built public URL for external access: ${url}`);
    return url;
  }

  private async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(bucket, 'us-east-1');
      this.logger.log(`Created new bucket: ${bucket}`);
    }

    // Set public read policy for the bucket to allow external access
    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };

    try {
      await this.client.setBucketPolicy(bucket, JSON.stringify(publicReadPolicy));
      this.logger.log(`Set public read policy for bucket: ${bucket}`);
    } catch (error) {
      this.logger.error(`Failed to set bucket policy for ${bucket}:`, error.message);
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
