import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.schema';

export type DocumentDocument = Document & MongoDocument;

@Schema({
  timestamps: true,
})
export class Document {
  @ApiProperty({
    description: 'Document ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'Original filename of the uploaded document',
    example: 'report.pdf',
  })
  @Prop({ required: true })
  filename: string;

  @ApiProperty({
    description: 'MinIO URL where the file is stored',
    example: 'http://localhost:9000/assistant-aggregator/documents/507f1f77bcf86cd799439011_report.pdf',
  })
  @Prop({ required: true })
  fileUrl: string;

  @ApiProperty({
    description: 'File extension/format',
    example: 'pdf',
  })
  @Prop({ required: true })
  extension: string;

  @ApiProperty({
    description: 'User who uploaded the document',
    type: String,
    example: '507f1f77bcf86cd799439012',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fileUploader: Types.ObjectId | User;

  @ApiProperty({
    description: 'Elasticsearch document ID or address for raw text content',
    example: 'assistant_aggregator_documents_507f1f77bcf86cd799439011',
  })
  @Prop({ required: false })
  rawTextFileId: string;

  @ApiProperty({
    description: 'Extracted raw text content from OCR processing',
    example: 'This is the extracted text content from the document...',
  })
  @Prop({ required: false })
  extractedText: string;

  @ApiProperty({
    description: 'OCR confidence score (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  @Prop({ type: Number, min: 0, max: 1, required: false })
  ocrConfidence: number;

  @ApiProperty({
    description: 'OCR processing status',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'completed',
  })
  @Prop({ 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  })
  ocrStatus: string;

  @ApiProperty({
    description: 'OCR processing metadata',
    example: {
      processingTime: 1500,
      pagesProcessed: 3,
      language: 'en',
      ocrEngine: 'tesseract-v5',
      processedAt: '2023-12-01T10:00:00.000Z'
    },
  })
  @Prop({ type: Object, default: {} })
  ocrMetadata: Record<string, any>;

  @ApiProperty({
    description: 'Document metadata as JSON object',
    example: {
      size: 1024000,
      mimeType: 'application/pdf',
      pages: 10,
      language: 'en',
      tags: ['report', 'quarterly']
    },
  })
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Document creation timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @ApiProperty({
    description: 'Document last update timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
