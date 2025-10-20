import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsMongoId, IsDateString, IsNumber, Min } from 'class-validator';

export class ChatQueryDto {

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsOptional()
  readonly user?: string;

  @ApiPropertyOptional({
    description: 'Date from (ISO string)',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  readonly dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Date to (ISO string)',
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  readonly dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  readonly page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  readonly limit?: number;
}
