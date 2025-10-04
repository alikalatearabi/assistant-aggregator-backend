import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class AddMessageToChatDto {
  @ApiProperty({
    description: 'Message ID to add to chat history',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  readonly messageId: string;
}
