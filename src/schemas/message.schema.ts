import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// Define the RetrieverResource schema
export class RetrieverResource {
  @ApiProperty({ description: 'Position in ranking', example: 1 })
  position: number;

  @ApiProperty({ description: 'Dataset ID', example: '001' })
  dataset_id: string;

  @ApiProperty({ description: 'Dataset name', example: 'وزارت' })
  dataset_name: string;

  @ApiProperty({ description: 'Document ID', example: '1221' })
  document_id: string;

  @ApiProperty({ description: 'Document name', example: 'آیین نامه نحوه تأسیس واحد های پژوهشی در دانشگاه ها' })
  document_name: string;

  @ApiProperty({ description: 'Segment ID', example: '6eb1f935-3646-43f6-a18b-ff935e6ed59f' })
  segment_id: string;

  @ApiProperty({ description: 'Similarity score', example: 0.6027078628540039 })
  score: number;

  @ApiProperty({ description: 'Content snippet', example: 'آیین نامه نحوه تأسیس واحد های پژوهشی در دانشگاه ها...' })
  content: string;
}

export type MessageDocument = Message & MongoDocument;

@Schema({
  timestamps: true,
})
export class Message {
  @ApiProperty({
    description: 'Message ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'Message category',
    example: 'support',
  })
  @Prop({ required: true })
  category: string;

  @ApiProperty({
    description: 'Message text content',
    example: 'This is a sample message content.',
  })
  @Prop({ required: true })
  text: string;

  @ApiProperty({
    description: 'Message date',
    example: '2023-12-01T10:00:00.000Z',
  })
  @Prop({ type: Date, required: true })
  date: Date;

  @ApiProperty({
    description: 'Message sentiment score (between -1.0 and 1.0)',
    example: 0.75,
    minimum: -1.0,
    maximum: 1.0,
  })
  @Prop({ 
    type: Number, 
    required: true,
    min: -1.0,
    max: 1.0,
    validate: {
      validator: function(value: number) {
        return value >= -1.0 && value <= 1.0;
      },
      message: 'Score must be between -1.0 and 1.0'
    }
  })
  score: number;

  @ApiProperty({
    description: 'Message creation timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @ApiProperty({
    description: 'Message last update timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @ApiProperty({
    description: 'Retriever resources (sources used to generate the answer)',
    type: [RetrieverResource],
    required: false,
  })
  @Prop({ type: Array, default: [] })
  retrieverResources?: RetrieverResource[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
