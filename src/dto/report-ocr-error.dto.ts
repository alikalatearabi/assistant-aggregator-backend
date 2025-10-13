import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator';

export class ReportOcrErrorDto {
  @ApiProperty({ description: 'User identifier', example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  user_id: string;

  @ApiProperty({ description: 'Document identifier', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  document_id: string;

  @ApiPropertyOptional({ description: 'Page number within the document', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'OCR status (error state)', example: 'failed', enum: ['failed'] })
  @IsIn(['failed'])
  status: string;

  @ApiProperty({ description: 'Error message from OCR module', example: 'Unable to extract text from page 1' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
