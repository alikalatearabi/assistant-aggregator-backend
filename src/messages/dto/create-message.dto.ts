import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, Max, IsIn, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RetrieverResource } from '../schemas/message.schema';

export class RetrieverResourceDto implements RetrieverResource {
  @ApiProperty({ description: 'Position in ranking', example: 1 })
  @IsNumber()
  position: number;

  @ApiProperty({ description: 'Dataset ID', example: '001' })
  @IsString()
  dataset_id: string;

  @ApiProperty({ description: 'Dataset name', example: 'وزارت' })
  @IsString()
  dataset_name: string;

  @ApiProperty({ description: 'Document ID', example: '1221' })
  @IsString()
  document_id: string;

  @ApiProperty({ description: 'Document name', example: 'آیین نامه نحوه تأسیس واحد های پژوهشی در دانشگاه ها' })
  @IsString()
  document_name: string;

  @ApiProperty({ description: 'Segment ID', example: '6eb1f935-3646-43f6-a18b-ff935e6ed59f' })
  @IsString()
  segment_id: string;

  @ApiProperty({ description: 'Similarity score', example: 0.6027078628540039 })
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Content snippet', example: 'آیین نامه نحوه تأسیس واحد های پژوهشی در دانشگاه ها...' })
  @IsString()
  content: string;
}

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

  @ApiPropertyOptional({
    description: 'Retriever resources (sources used to generate the answer)',
    type: [RetrieverResourceDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetrieverResourceDto)
  readonly retrieverResources?: RetrieverResourceDto[];
}

