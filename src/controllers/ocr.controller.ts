import { Controller, Post, Patch, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import { SubmitOcrResultDto } from '../dto/submit-ocr-result.dto';
import { ReportOcrErrorDto } from '../dto/report-ocr-error.dto';
import { Document } from '../schemas/document.schema';

@ApiTags('ocr')
@Controller('ocr')
export class OcrController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('submit')
  @ApiOperation({
    summary: 'Submit OCR analysis result',
    description: 'Endpoint for OCR service to submit extracted text and analysis results',
  })
  @ApiResponse({ status: 200, description: 'OCR result submitted successfully', type: Document })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or document ID' })
  async submitOcrResult(@Body() submitOcrResultDto: SubmitOcrResultDto): Promise<Document> {
    return this.documentService.submitOcrResult(
      submitOcrResultDto.documentId.toString(),
      submitOcrResultDto.raw_text,
      submitOcrResultDto.page,
    );
  }

  @Patch(':id/processing')
  @ApiOperation({
    summary: 'Mark document as being processed by OCR',
    description: 'Updates document status to indicate OCR processing has started',
  })
  @ApiParam({ name: 'id', description: 'Document MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Document marked as processing', type: Document })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async markOcrProcessing(@Param('id') id: string): Promise<Document> {
    return this.documentService.markOcrProcessing(id);
  }

  @Patch(':id/failed')
  @ApiOperation({
    summary: 'Mark document OCR processing as failed',
    description: 'Updates document status to indicate OCR processing has failed',
  })
  @ApiParam({ name: 'id', description: 'Document MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Document marked as failed', type: Document })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async markOcrFailed(@Param('id') id: string, @Body('error') error: string): Promise<Document> {
    return this.documentService.markOcrFailed(id, error);
  }

  @Post('error')
  @ApiOperation({
    summary: 'Report OCR error',
    description: 'Endpoint for OCR module to report an error with user, document, and optional page context',
  })
  @ApiResponse({ status: 200, description: 'OCR error recorded', type: Document })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async reportOcrError(@Body() body: ReportOcrErrorDto): Promise<Document> {
    return this.documentService.reportOcrError({
      userId: body.user_id,
      documentId: body.document_id,
      page: body.page,
      status: body.status,
      message: body.message,
    });
  }

  @Get('status/:status')
  @ApiOperation({
    summary: 'Get documents by OCR status',
    description: 'Retrieves documents filtered by their OCR processing status',
  })
  @ApiParam({
    name: 'status',
    description: 'OCR processing status',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'completed',
  })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully', type: [Document] })
  async getDocumentsByOcrStatus(@Param('status') status: string): Promise<Document[]> {
    return this.documentService.findDocumentsByOcrStatus(status);
  }
}