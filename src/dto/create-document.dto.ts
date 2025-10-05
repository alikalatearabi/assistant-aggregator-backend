import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsObject } from 'class-validator';
import { Types } from 'mongoose';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Original filename of the uploaded document',
    example: 'report.pdf',
  })
  @IsString()
  @IsNotEmpty()
  readonly filename: string;

  @ApiProperty({
    description: 'MinIO URL where the file is stored',
    example: 'http://localhost:9000/assistant-aggregator/documents/507f1f77bcf86cd799439011_report.pdf',
  })
  @IsString()
  @IsNotEmpty()
  readonly fileUrl: string;

  @ApiProperty({
    description: 'File extension/format',
    example: 'pdf',
  })
  @IsString()
  @IsNotEmpty()
  readonly extension: string;

  @ApiProperty({
    description: 'User ID who uploaded the document',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  readonly fileUploader: string | Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Elasticsearch document ID or address for raw text content',
    example: 'assistant_aggregator_documents_507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  readonly rawTextFileId?: string;

  @ApiPropertyOptional({
    description: 'Document metadata as JSON object',
    example: {
      size: 1024000,
      mimeType: 'application/pdf',
      pages: 10,
      language: 'en',
      tags: ['report', 'quarterly']
    },
  })
  @IsObject()
  @IsOptional()
  readonly metadata?: Record<string, any>;
}
