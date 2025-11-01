import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class MessageQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'support',
  })
  @IsString()
  @IsOptional()
  readonly category?: string;

  @ApiPropertyOptional({
    description: 'Search in message text',
    example: 'sample',
  })
  @IsString()
  @IsOptional()
  readonly text?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum score',
    example: 0.0,
    minimum: -1.0,
    maximum: 1.0,
  })
  @IsNumber()
  @Min(-1.0)
  @Max(1.0)
  @IsOptional()
  readonly minScore?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum score',
    example: 1.0,
    minimum: -1.0,
    maximum: 1.0,
  })
  @IsNumber()
  @Min(-1.0)
  @Max(1.0)
  @IsOptional()
  readonly maxScore?: number;

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
  @Max(100)
  @IsOptional()
  readonly limit?: number;
}

