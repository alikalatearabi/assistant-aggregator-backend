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
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { DocumentMetadataDto } from '../dto/document-metadata.dto';
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
  @ApiQuery({ name: 'metadataUserId', required: false, description: 'Filter by metadata.user_id (uploader)' })
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
  @ApiExcludeEndpoint()
  async getDocumentStats() {
    return this.documentService.getDocumentStats();
  }

  @Get('search')
  @ApiExcludeEndpoint()
  async searchDocuments(@Query('q') searchTerm: string): Promise<Document[]> {
    return this.documentService.searchDocuments(searchTerm);
  }

  @Get('uploader/:uploaderId')
  @ApiExcludeEndpoint()
  async findDocumentsByUploader(@Param('uploaderId') uploaderId: string): Promise<Document[]> {
    return this.documentService.findDocumentsByUploader(uploaderId);
  }

  @Get('extension/:extension')
  @ApiExcludeEndpoint()
  async findDocumentsByExtension(@Param('extension') extension: string): Promise<Document[]> {
    return this.documentService.findDocumentsByExtension(extension);
  }

  @Get(':id')
  @ApiExcludeEndpoint()
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
  @ApiExcludeEndpoint()
  async updateDocumentMetadata(
    @Param('id') id: string,
    @Body('metadata') metadata: DocumentMetadataDto,
  ): Promise<Document> {
    return this.documentService.updateDocumentMetadata(id, metadata as Record<string, any>);
  }

  @Patch(':id/raw-text')
  @ApiExcludeEndpoint()
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

  @Get(':id/presigned-url')
  @ApiOperation({
    summary: 'Get presigned URL for document',
    description: 'Returns a temporary signed URL to download the file from MinIO',
  })
  @ApiParam({ name: 'id', description: 'Document MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'expires', required: false, description: 'Expiry time in seconds (default 900, max 604800)' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL created',
    schema: { type: 'object', properties: { url: { type: 'string', example: 'https://minio.local/bucket/object?X-Amz-Expires=900&X-Amz-Signature=...' } } },
  })
  async getPresignedUrl(
    @Param('id') id: string,
    @Query('expires') expires?: string,
  ): Promise<{ url: string }> {
    const exp = expires ? parseInt(expires, 10) : undefined;
    return this.documentService.getPresignedUrlForDocument(id, exp);
  }
}
