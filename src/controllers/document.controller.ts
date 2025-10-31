import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiExcludeEndpoint,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from '../services/document.service';
import { MinioService } from '../services/minio.service';
import { BadRequestException } from '@nestjs/common';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { DocumentMetadataDto } from '../dto/document-metadata.dto';
import { Document } from '../schemas/document.schema';

@ApiTags('documents')
@Controller('documents')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(
    private readonly documentService: DocumentService,
    private readonly minioService: MinioService,
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload and create a new document',
    description: 'Uploads a file and creates a document record; file is sent to OCR service afterward',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Document file to upload' },
        filename: { type: 'string', example: 'report.pdf' },
        extension: { type: 'string', example: 'pdf' },
        metadata: {
          type: 'object',
          additionalProperties: true,
          description: 'Optional metadata JSON (will be stored under metadata)'
        },
      },
      required: ['file', 'filename', 'extension'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document created successfully', type: Document })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  async createDocument(
    @UploadedFile() file: any,
    @Body() body: any,
  ): Promise<Document> {
    this.logger.log(`=== Starting document upload ===`);
    this.logger.log(`Request body keys: ${Object.keys(body)}`);
    this.logger.log(`File info: ${file ? `size=${file.size}, type=${file.mimetype}, originalname=${file.originalname}` : 'NO FILE'}`);

    // Validate required fields from body
    if (!file || !body?.filename || !body?.extension) {
      this.logger.error(`Validation failed - file: ${!!file}, filename: ${!!body?.filename}, extension: ${!!body?.extension}`);
      throw new BadRequestException('file, filename and extension are required');
    }

    this.logger.log(`Processing file: ${body.filename}.${body.extension}`);

    // Parse metadata if it's a JSON string
    let metadataParsed: any = undefined;
    if (typeof body?.metadata === 'string') {
      try {
        metadataParsed = JSON.parse(body.metadata);
        this.logger.log(`Parsed metadata from string: ${JSON.stringify(metadataParsed)}`);
      } catch (e) {
        this.logger.error(`Failed to parse metadata JSON: ${e.message}`);
        throw new BadRequestException('metadata must be a valid JSON string');
      }
    } else if (body?.metadata && typeof body.metadata === 'object') {
      metadataParsed = body.metadata;
      this.logger.log(`Using metadata object: ${JSON.stringify(metadataParsed)}`);
    }

    // Upload to MinIO and obtain a public URL
    const safeName = String(body.filename).replace(/\s+/g, '_');
    const objectName = `documents/${Date.now()}_${safeName}`;
    this.logger.log(`Generated object name: ${objectName}`);

    const fileUrl = await this.minioService.uploadAndGetUrl({
      buffer: file.buffer,
      objectName,
      contentType: file.mimetype,
    });
    this.logger.log(`Upload completed, fileUrl: ${fileUrl}`);

    // Build DTO expected by service
    const dto: CreateDocumentDto = {
      filename: body.filename,
      fileUrl,
      extension: body.extension,
      rawTextFileId: body.rawTextFileId,
      metadata: metadataParsed,
    } as any;

    this.logger.log(`Creating document with DTO: ${JSON.stringify(dto)}`);
    const result = await this.documentService.createDocument(dto);
    this.logger.log(`Document created successfully with ID: ${result._id}`);
    this.logger.log(`=== Document upload completed ===`);

    return result;
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

  @Get(':id/pages')
  @ApiOperation({ summary: 'Get all page documents for an original document' })
  @ApiParam({ name: 'id', description: 'Original document MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Page documents retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          filename: { type: 'string' },
          originalDocumentId: { type: 'string' },
          pageNumber: { type: 'number' },
          raw_text: { type: 'string' },
          ocrStatus: { type: 'string' }
        }
      }
    }
  })
  async getDocumentPages(@Param('id') id: string) {
    this.logger.log(`Request: Get pages for document ${id}`);
    return this.documentService.findPagesByOriginalDocument(id);
  }

  @Get('originals')
  @ApiOperation({ summary: 'Get all original documents (excluding page documents)' })
  @ApiResponse({
    status: 200,
    description: 'Original documents retrieved',
    schema: {
      type: 'array',
      items: { type: 'object' }
    }
  })
  async getOriginalDocuments() {
    this.logger.log('Request: Get all original documents');
    return this.documentService.findOriginalDocuments();
  }

  @Get('originals-with-page-counts')
  @ApiOperation({ summary: 'Get original documents with page counts (paginated)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Original documents with page counts',
    schema: {
      type: 'object',
      properties: {
        documents: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      }
    }
  })
  async getOriginalsWithPageCounts(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page, 10) : undefined;
    const l = limit ? parseInt(limit, 10) : undefined;
    this.logger.log(`Request: Get originals with page counts - page=${p || 1} limit=${l || 50}`);
    return this.documentService.findOriginalsWithPageCounts({ page: p, limit: l });
  }

  @Get('id/:id')
  @ApiExcludeEndpoint()
  async findDocumentById(@Param('id') id: string): Promise<Document> {
    return this.documentService.findDocumentById(id);
  }


  @Get(':id/download')
  @ApiOperation({ summary: 'Get temporary download link for document' })
  async getDownloadLink(@Param('id') id: string, @Query('expires') expires?: string) {
    const document = await this.documentService.findDocumentById(id);
  
    // Extract object key cleanly
    let objectName = document.objectKey
      ? document.objectKey
      : decodeURIComponent(document.fileUrl.split('/').slice(4).join('/'));
  
    const bucket = 'assistant-aggregator';
    if (objectName.startsWith(bucket + '/')) objectName = objectName.replace(bucket + '/', '');
    if (objectName.startsWith('documents/')) objectName = objectName.replace('documents/', '');
  
    const url = await this.minioService.getPresignedDownloadUrl(
      objectName,
      parseInt(expires || '600', 10),
    );
  
    return { url };
  }
  
  

}
