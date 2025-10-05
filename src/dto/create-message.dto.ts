import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, Max, IsIn } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Message category',
    example: 'user_input',
    enum: ['user_input', 'assistant_response', 'system_error', 'system_info'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['user_input', 'assistant_response', 'system_error', 'system_info'])
  readonly category: string;

  @ApiProperty({
    description: 'Message text content',
    example: 'This is a sample message content.',
  })
  @IsString()
  @IsNotEmpty()
  readonly text: string;

  @ApiProperty({
    description: 'Message date (ISO string)',
    example: '2023-12-01T10:00:00.000Z',
  })
  @IsDateString()
  readonly date: string;

  @ApiProperty({
    description: 'Message sentiment score (between -1.0 and 1.0)',
    example: 0.75,
    minimum: -1.0,
    maximum: 1.0,
  })
  @IsNumber()
  @Min(-1.0)
  @Max(1.0)
  readonly score: number;
}
