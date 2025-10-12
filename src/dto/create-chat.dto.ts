import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsArray, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class CreateChatDto {
  @ApiProperty({
    description: 'User ID who owns this chat session',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  readonly user: string | Types.ObjectId;

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
