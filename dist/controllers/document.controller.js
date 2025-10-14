"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const document_service_1 = require("../services/document.service");
const create_document_dto_1 = require("../dto/create-document.dto");
const update_document_dto_1 = require("../dto/update-document.dto");
const document_query_dto_1 = require("../dto/document-query.dto");
const document_metadata_dto_1 = require("../dto/document-metadata.dto");
const document_schema_1 = require("../schemas/document.schema");
let DocumentController = class DocumentController {
    documentService;
    constructor(documentService) {
        this.documentService = documentService;
    }
    async createDocument(createDocumentDto) {
        return this.documentService.createDocument(createDocumentDto);
    }
    async findAllDocuments(query) {
        return this.documentService.findAllDocuments(query);
    }
    async getDocumentStats() {
        return this.documentService.getDocumentStats();
    }
    async searchDocuments(searchTerm) {
        return this.documentService.searchDocuments(searchTerm);
    }
    async findDocumentsByUploader(uploaderId) {
        return this.documentService.findDocumentsByUploader(uploaderId);
    }
    async findDocumentsByExtension(extension) {
        return this.documentService.findDocumentsByExtension(extension);
    }
    async findDocumentById(id) {
        return this.documentService.findDocumentById(id);
    }
    async updateDocument(id, updateDocumentDto) {
        return this.documentService.updateDocument(id, updateDocumentDto);
    }
    async updateDocumentMetadata(id, metadata) {
        return this.documentService.updateDocumentMetadata(id, metadata);
    }
    async updateRawTextFileId(id, rawTextFileId) {
        return this.documentService.updateRawTextFileId(id, rawTextFileId);
    }
    async deleteDocument(id) {
        return this.documentService.deleteDocument(id);
    }
    async getPresignedUrl(id, expires) {
        const exp = expires ? parseInt(expires, 10) : undefined;
        return this.documentService.getPresignedUrlForDocument(id, exp);
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new document',
        description: 'Creates a new document record with file information and metadata',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Document created successfully',
        type: document_schema_1.Document,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_document_dto_1.CreateDocumentDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "createDocument", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all documents with pagination and filtering',
        description: 'Retrieves documents with optional filtering and pagination',
    }),
    (0, swagger_1.ApiQuery)({ name: 'extension', required: false, description: 'Filter by file extension' }),
    (0, swagger_1.ApiQuery)({ name: 'metadataUserId', required: false, description: 'Filter by metadata.user_id (uploader)' }),
    (0, swagger_1.ApiQuery)({ name: 'filename', required: false, description: 'Search in filename' }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page', example: 10 }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [document_query_dto_1.DocumentQueryDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "findAllDocuments", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getDocumentStats", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "searchDocuments", null);
__decorate([
    (0, common_1.Get)('uploader/:uploaderId'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('uploaderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "findDocumentsByUploader", null);
__decorate([
    (0, common_1.Get)('extension/:extension'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('extension')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "findDocumentsByExtension", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "findDocumentById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update document',
        description: 'Updates document information with the provided data',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Document MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Document updated successfully',
        type: document_schema_1.Document,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Document not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid input data',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_document_dto_1.UpdateDocumentDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "updateDocument", null);
__decorate([
    (0, common_1.Patch)(':id/metadata'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('metadata')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, document_metadata_dto_1.DocumentMetadataDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "updateDocumentMetadata", null);
__decorate([
    (0, common_1.Patch)(':id/raw-text'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('rawTextFileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "updateRawTextFileId", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete document',
        description: 'Permanently removes a document from the system',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Document MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Document deleted successfully',
        type: document_schema_1.Document,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Document not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid document ID',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Get)(':id/presigned-url'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get presigned URL for document',
        description: 'Returns a temporary signed URL to download the file from MinIO',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Document MongoDB ObjectId', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiQuery)({ name: 'expires', required: false, description: 'Expiry time in seconds (default 900, max 604800)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Presigned URL created',
        schema: { type: 'object', properties: { url: { type: 'string', example: 'https://minio.local/bucket/object?X-Amz-Expires=900&X-Amz-Signature=...' } } },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('expires')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getPresignedUrl", null);
exports.DocumentController = DocumentController = __decorate([
    (0, swagger_1.ApiTags)('documents'),
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [document_service_1.DocumentService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map