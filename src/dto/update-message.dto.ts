import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class UpdateMessageDto {
  @ApiPropertyOptional({
    description: 'Message category',
    example: 'feedback',
  })
  @IsString()
  @IsOptional()
  readonly category?: string;

  @ApiPropertyOptional({
    description: 'Message text content',
    example: 'Updated message content.',
  })
  @IsString()
  @IsOptional()
  readonly text?: string;

  @ApiPropertyOptional({
    description: 'Message date (ISO string)',
    example: '2023-12-01T10:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  readonly date?: string;

  @ApiPropertyOptional({
    description: 'Message sentiment score (between -1.0 and 1.0)',
    example: 0.85,
    minimum: -1.0,
    maximum: 1.0,
  })
  @IsNumber()
  @Min(-1.0)
  @Max(1.0)
  @IsOptional()
  readonly score?: number;
}
