import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsMongoId, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateChatDto {
  @ApiPropertyOptional({
    description: 'User ID who owns this chat session',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsOptional()
  readonly user?: string | Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Array of message IDs for conversation history',
    type: [String],
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014', '507f1f77bcf86cd799439015'],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly conversationHistory?: string[] | Types.ObjectId[];
}

