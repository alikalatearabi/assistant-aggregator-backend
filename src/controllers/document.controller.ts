import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { SubmitOcrResultDto } from '../dto/submit-ocr-result.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { Document } from '../schemas/document.schema';

@ApiTags('documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new document',
    description: 'Creates a new document record with file information and metadata',
  })
  @ApiResponse({
    status: 201,
    description: 'Document created successfully',
    type: Document,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  async createDocument(@Body() createDocumentDto: CreateDocumentDto): Promise<Document> {
    return this.documentService.createDocument(createDocumentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all documents with pagination and filtering',
    description: 'Retrieves documents with optional filtering and pagination',
  })
  @ApiQuery({ name: 'extension', required: false, description: 'Filter by file extension' })
  @ApiQuery({ name: 'fileUploader', required: false, description: 'Filter by uploader user ID' })
  @ApiQuery({ name: 'filename', required: false, description: 'Search in filename' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        documents: { type: 'array', items: { $ref: '#/components/schemas/Document' } },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  async findAllDocuments(@Query() query: DocumentQueryDto) {
    return this.documentService.findAllDocuments(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get document statistics',
    description: 'Retrieves various statistics about documents in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Document statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalDocuments: { type: 'number', example: 150 },
        documentsByExtension: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: 'pdf' },
              count: { type: 'number', example: 45 },
            },
          },
        },
        documentsByUploader: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
              count: { type: 'number', example: 12 },
            },
          },
        },
        recentDocuments: { type: 'number', example: 8 },
      },
    },
  })
  async getDocumentStats() {
    return this.documentService.getDocumentStats();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search documents',
    description: 'Search documents by filename, extension, or metadata',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [Document],
  })
  async searchDocuments(@Query('q') searchTerm: string): Promise<Document[]> {
    return this.documentService.searchDocuments(searchTerm);
  }

  @Get('uploader/:uploaderId')
  @ApiOperation({
    summary: 'Get documents by uploader',
    description: 'Retrieves all documents uploaded by a specific user',
  })
  @ApiParam({
    name: 'uploaderId',
    description: 'User ID of the uploader',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: [Document],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid uploader ID',
  })
  async findDocumentsByUploader(@Param('uploaderId') uploaderId: string): Promise<Document[]> {
    return this.documentService.findDocumentsByUploader(uploaderId);
  }

  @Get('extension/:extension')
  @ApiOperation({
    summary: 'Get documents by extension',
    description: 'Retrieves all documents with a specific file extension',
  })
  @ApiParam({
    name: 'extension',
    description: 'File extension',
    example: 'pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: [Document],
  })
  async findDocumentsByExtension(@Param('extension') extension: string): Promise<Document[]> {
    return this.documentService.findDocumentsByExtension(extension);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieves a specific document by its MongoDB ObjectId',
  })
  @ApiParam({
    name: 'id',
    description: 'Document MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Document found successfully',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid document ID',
  })
  async findDocumentById(@Param('id') id: string): Promise<Document> {
    return this.documentService.findDocumentById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update document',
    description: 'Updates document information with the provided data',
  })
  @ApiParam({
    name: 'id',
    description: 'Document MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    return this.documentService.updateDocument(id, updateDocumentDto);
  }

  @Patch(':id/metadata')
  @ApiOperation({
    summary: 'Update document metadata',
    description: 'Updates only the metadata field of a document',
  })
  @ApiParam({
    name: 'id',
    description: 'Document MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        metadata: {
          type: 'object',
          example: {
            size: 1024000,
            mimeType: 'application/pdf',
            pages: 10,
            language: 'en',
            tags: ['report', 'quarterly', 'updated'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document metadata updated successfully',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async updateDocumentMetadata(
    @Param('id') id: string,
    @Body('metadata') metadata: Record<string, any>,
  ): Promise<Document> {
    return this.documentService.updateDocumentMetadata(id, metadata);
  }

  @Patch(':id/raw-text')
  @ApiOperation({
    summary: 'Update document raw text file ID',
    description: 'Updates the Elasticsearch document ID for raw text content',
  })
  @ApiParam({
    name: 'id',
    description: 'Document MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rawTextFileId: {
          type: 'string',
          example: 'assistant_aggregator_documents_507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document raw text file ID updated successfully',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async updateRawTextFileId(
    @Param('id') id: string,
    @Body('rawTextFileId') rawTextFileId: string,
  ): Promise<Document> {
    return this.documentService.updateRawTextFileId(id, rawTextFileId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete document',
    description: 'Permanently removes a document from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'Document MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid document ID',
  })
  async deleteDocument(@Param('id') id: string): Promise<Document> {
    return this.documentService.deleteDocument(id);
  }

  @Post('ocr/submit')
  @ApiOperation({
    summary: 'Submit OCR analysis result',
    description: 'Endpoint for OCR service to submit extracted text and analysis results',
  })
  @ApiResponse({
    status: 200,
    description: 'OCR result submitted successfully',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or document ID',
  })
  async submitOcrResult(
    @Body() submitOcrResultDto: SubmitOcrResultDto,
  ): Promise<Document> {
    return this.documentService.submitOcrResult(
      submitOcrResultDto.documentId.toString(),
      submitOcrResultDto.extractedText
    );
  }

  @Patch(':id/ocr/processing')
  @ApiOperation({
    summary: 'Mark document as being processed by OCR',
    description: 'Updates document status to indicate OCR processing has started',
  })
  @ApiParam({
    name: 'id',
    description: 'Document MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Document marked as processing',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async markOcrProcessing(@Param('id') id: string): Promise<Document> {
    return this.documentService.markOcrProcessing(id);
  }

  @Patch(':id/ocr/failed')
  @ApiOperation({
    summary: 'Mark document OCR processing as failed',
    description: 'Updates document status to indicate OCR processing has failed',
  })
  @ApiParam({
    name: 'id',
    description: 'Document MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          example: 'OCR processing failed: Unable to extract text from image',
        },
      },
      required: ['error'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document marked as failed',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async markOcrFailed(
    @Param('id') id: string,
    @Body('error') error: string,
  ): Promise<Document> {
    return this.documentService.markOcrFailed(id, error);
  }

  @Get('ocr/status/:status')
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
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: [Document],
  })
  async getDocumentsByOcrStatus(@Param('status') status: string): Promise<Document[]> {
    return this.documentService.findDocumentsByOcrStatus(status);
  }
}
