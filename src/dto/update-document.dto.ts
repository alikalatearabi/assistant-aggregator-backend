import { ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentMetadataDto } from './document-metadata.dto';

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

  // user id moved into metadata.user_id

  @ApiPropertyOptional({
    description: 'Elasticsearch document ID or address for raw text content',
    example: 'assistant_aggregator_documents_507f1f77bcf86cd799439011',
  })
  readonly rawTextFileId?: string;

  @ApiPropertyOptional({
    description: 'Document metadata as JSON object',
    example: {
      user_id: '507f1f77bcf86cd799439012',
      document_id: 'string2',
      page_id: 'string111',
      title: 'string1',
      approved_date: 'string1',
      effective_date: 'string1',
      owner: 'string1',
      username: 'string1',
      access_level: 'string1'
    },
  })
  @ValidateNested()
  @Type(() => DocumentMetadataDto)
  @IsOptional()
  readonly metadata?: DocumentMetadataDto;
}
