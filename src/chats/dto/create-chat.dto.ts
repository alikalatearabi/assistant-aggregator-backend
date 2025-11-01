import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsArray, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateChatDto {
  @ApiProperty({
    description: 'User ID who owns this chat session',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  readonly user: string | Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Chat title (defaults to "گفتگوی جدید" if not provided)',
    example: 'گفتگوی جدید',
  })
  @IsString()
  @IsOptional()
  readonly title?: string;

  @ApiPropertyOptional({
    description: 'Array of message IDs for initial conversation history',
    type: [String],
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly conversationHistory?: string[] | Types.ObjectId[];
}

