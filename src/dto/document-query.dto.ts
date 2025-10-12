import { ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by file extension',
    example: 'pdf',
  })
  readonly extension?: string;

  @ApiPropertyOptional({
    description: 'Filter by metadata.user_id (uploader)',
    example: '507f1f77bcf86cd799439012',
  })
  readonly metadataUserId?: string;

  @ApiPropertyOptional({
    description: 'Search in filename',
    example: 'report',
  })
  readonly filename?: string;

  @ApiPropertyOptional({
    description: 'Date from (ISO string)',
    example: '2023-01-01T00:00:00.000Z',
  })
  readonly dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Date to (ISO string)',
    example: '2023-12-31T23:59:59.999Z',
  })
  readonly dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  readonly page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  readonly limit?: number;
}
