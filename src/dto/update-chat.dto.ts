import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateChatDto {
  @ApiPropertyOptional({
    description: 'Chat session identifier',
    example: 'session_2023_12_01_user_123_updated',
  })
  @IsString()
  @IsOptional()
  readonly session?: string;

  @ApiPropertyOptional({
    description: 'User ID who owns this chat session',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsOptional()
  readonly user?: string | Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Array of message IDs for message history',
    type: [String],
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014', '507f1f77bcf86cd799439015'],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly messageHistory?: string[] | Types.ObjectId[];
}
