import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class DocumentMetadataDto {
  @ApiPropertyOptional({ description: 'User identifier related to the document (Mongo ObjectId)', example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Document identifier', example: 'string2' })
  @IsString()
  @IsOptional()
  document_id?: string;

  @ApiPropertyOptional({ description: 'Page identifier within the document', example: 'string111' })
  @IsString()
  @IsOptional()
  page_id?: string;

  @ApiPropertyOptional({ description: 'Document title', example: 'string1' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Approved date', example: 'string1' })
  @IsString()
  @IsOptional()
  approved_date?: string;

  @ApiPropertyOptional({ description: 'Effective date', example: 'string1' })
  @IsString()
  @IsOptional()
  effective_date?: string;

  @ApiPropertyOptional({ description: 'Owner of the document', example: 'string1' })
  @IsString()
  @IsOptional()
  owner?: string;
  
  @ApiPropertyOptional({ description: 'Username of the owner/uploader', example: 'jdoe' })
  @IsString()
  @IsOptional()
  username?: string;
  
  @ApiPropertyOptional({ description: 'Access level for the document', example: 'string1' })
  @IsString()
  @IsOptional()
  access_level?: string;
}
