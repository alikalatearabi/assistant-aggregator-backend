import { ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Original filename of the uploaded document',
    example: 'updated_report.pdf',
  })
  readonly filename?: string;

  @ApiPropertyOptional({
    description: 'MinIO URL where the file is stored',
    example: 'http://localhost:9000/assistant-aggregator/documents/507f1f77bcf86cd799439011_updated_report.pdf',
  })
  readonly fileUrl?: string;

  @ApiPropertyOptional({
    description: 'File extension/format',
    example: 'pdf',
  })
  readonly extension?: string;

  @ApiPropertyOptional({
    description: 'User ID who uploaded the document',
    example: '507f1f77bcf86cd799439012',
  })
  readonly fileUploader?: string | Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Elasticsearch document ID or address for raw text content',
    example: 'assistant_aggregator_documents_507f1f77bcf86cd799439011',
  })
  readonly rawTextFileId?: string;

  @ApiPropertyOptional({
    description: 'Document metadata as JSON object',
    example: {
      size: 1024000,
      mimeType: 'application/pdf',
      pages: 10,
      language: 'en',
      tags: ['report', 'quarterly', 'updated']
    },
  })
  readonly metadata?: Record<string, any>;
}
