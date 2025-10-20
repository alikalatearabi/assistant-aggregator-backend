import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.schema';
import { Dataset } from './dataset.schema';

export type DocumentDocument = Document & MongoDocument;

@Schema({ _id: false })
export class DocumentMetadata {
  @ApiProperty({ description: 'Reference to User entity', example: '507f1f77bcf86cd799439012', type: String, required: false })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user_id?: Types.ObjectId | User;

  @ApiProperty({ description: 'Document external identifier', example: 'string2', required: false })
  @Prop()
  document_id?: string;

  @ApiProperty({ description: 'Page identifier', example: 'string111', required: false })
  @Prop()
  page_id?: string;

  @ApiProperty({ description: 'Title', example: 'string1', required: false })
  @Prop()
  title?: string;

  @ApiProperty({ description: 'Approved date', example: 'string1', required: false })
  @Prop()
  approved_date?: string;

  @ApiProperty({ description: 'Effective date', example: 'string1', required: false })
  @Prop()
  effective_date?: string;

  @ApiProperty({ description: 'Owner', example: 'string1', required: false })
  @Prop()
  owner?: string;

  @ApiProperty({ description: 'Username', example: 'string1', required: false })
  @Prop()
  username?: string;

  @ApiProperty({ description: 'Access level', example: 'string1', required: false })
  @Prop()
  access_level?: string;

  @ApiProperty({ description: 'OCR processing metadata', required: false, example: { processingStartedAt: '2024-01-01T00:00:00.000Z', processedAt: '2024-01-01T00:05:00.000Z', textLength: 1234 } })
  @Prop({ type: Object })
  ocr?: Record<string, any>;
}

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
    description: 'Reference to Dataset entity',
    example: '507f1f77bcf86cd799439013',
    type: String,
    required: false,
  })
  @Prop({ type: Types.ObjectId, ref: 'Dataset', required: false })
  dataset?: Types.ObjectId | Dataset;

  @ApiProperty({
    description: 'Original document ID that this page belongs to',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @Prop({ type: Types.ObjectId, required: false })
  originalDocumentId?: Types.ObjectId;

  @ApiProperty({
    description: 'Page number within the document',
    example: 1,
    required: false,
  })
  @Prop({ required: false })
  pageNumber?: number;

  @ApiProperty({
    description: 'Indicates if this is a page from a multi-page document',
    example: false,
    required: false,
  })
  @Prop({ default: false })
  isPageDocument?: boolean;

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
  raw_text: string;

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
  @Prop({ type: SchemaFactory.createForClass(DocumentMetadata), default: {} })
  metadata: DocumentMetadata;

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
