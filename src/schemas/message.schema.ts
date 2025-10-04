import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

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
}

export const MessageSchema = SchemaFactory.createForClass(Message);
