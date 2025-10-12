import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class SubmitOcrResultDto {
  @ApiProperty({
    description: 'Document ID that was sent to OCR service',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  readonly documentId: string | Types.ObjectId;

  @ApiProperty({
    description: 'Extracted raw text from the document',
    example: 'This is the extracted text content from the document...',
  })
  @IsString()
  @IsNotEmpty()
  readonly extractedText: string;
}
