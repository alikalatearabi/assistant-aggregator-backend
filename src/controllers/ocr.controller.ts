import { Controller, Post, Patch, Body, Param, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import { SubmitOcrResultDto } from '../dto/submit-ocr-result.dto';
import { ReportOcrErrorDto } from '../dto/report-ocr-error.dto';
import { Document } from '../schemas/document.schema';

@ApiTags('ocr')
@Controller('ocr')
export class OcrController {
  private readonly logger = new Logger(OcrController.name);

  constructor(private readonly documentService: DocumentService) {}

  @Post('submit')
  @ApiOperation({
    summary: 'Submit OCR analysis result',
    description: 'Endpoint for OCR service to submit extracted text and analysis results',
  })
  @ApiResponse({ status: 200, description: 'OCR result submitted successfully', type: Document })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or document ID' })
  async submitOcrResult(@Body() submitOcrResultDto: SubmitOcrResultDto): Promise<any> {
    this.logger.log(`OCR Submit - Received payload for document: ${submitOcrResultDto.documentId}`);
    this.logger.debug(`OCR Submit - Full payload:`, {
      documentId: submitOcrResultDto.documentId,
      raw_text_length: submitOcrResultDto.raw_text?.length || 0,
      raw_text_preview: submitOcrResultDto.raw_text?.substring(0, 100) + '...',
      page: submitOcrResultDto.page,
      has_page: submitOcrResultDto.page !== undefined,
    });

    // If a page number is provided, create a page document separately
    if (submitOcrResultDto.page && Number.isInteger(submitOcrResultDto.page) && submitOcrResultDto.page > 0) {
      const pageDoc = await this.documentService.createPageDocument(
        submitOcrResultDto.documentId.toString(),
        submitOcrResultDto.page,
        submitOcrResultDto.raw_text,
        { processedBy: 'ocr-service' },
      );

      this.logger.log(`OCR Submit - Successfully stored page ${submitOcrResultDto.page} for document: ${submitOcrResultDto.documentId}`);
      return pageDoc;
    }

    // No page provided: treat this as a full-document OCR result (complete)
    const result = await this.documentService.submitOcrResult(
      submitOcrResultDto.documentId.toString(),
      submitOcrResultDto.raw_text,
    );

    this.logger.log(`OCR Submit - Successfully processed for document: ${submitOcrResultDto.documentId}`);
    return result;
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


  @Post('error')
  @ApiOperation({
    summary: 'Report OCR error',
    description: 'Endpoint for OCR module to report an error for a document with optional page context',
  })
  @ApiResponse({ status: 200, description: 'OCR error recorded', type: Document })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async reportOcrError(@Body() body: ReportOcrErrorDto): Promise<Document> {
    return this.documentService.reportOcrError({
      documentId: body.document_id,
      error: body.message,
      page: body.page,
      status: body.status,
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

  @Patch(':id/reset')
  @ApiOperation({
    summary: 'Reset OCR data for a document',
    description: 'Clears all OCR data and resets status to pending for reprocessing',
  })
  @ApiParam({ name: 'id', description: 'Document MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'OCR data reset successfully', type: Document })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async resetOcrData(@Param('id') id: string): Promise<Document> {
    this.logger.log(`OCR Reset - Resetting OCR data for document: ${id}`);
    return this.documentService.resetOcrData(id);
  }
}