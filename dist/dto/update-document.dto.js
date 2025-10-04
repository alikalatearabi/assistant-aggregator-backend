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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDocumentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UpdateDocumentDto {
    filename;
    fileUrl;
    extension;
    fileUploader;
    rawTextFileId;
    metadata;
}
exports.UpdateDocumentDto = UpdateDocumentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Original filename of the uploaded document',
        example: 'updated_report.pdf',
    }),
    __metadata("design:type", String)
], UpdateDocumentDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'MinIO URL where the file is stored',
        example: 'http://localhost:9000/assistant-aggregator/documents/507f1f77bcf86cd799439011_updated_report.pdf',
    }),
    __metadata("design:type", String)
], UpdateDocumentDto.prototype, "fileUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'File extension/format',
        example: 'pdf',
    }),
    __metadata("design:type", String)
], UpdateDocumentDto.prototype, "extension", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User ID who uploaded the document',
        example: '507f1f77bcf86cd799439012',
    }),
    __metadata("design:type", Object)
], UpdateDocumentDto.prototype, "fileUploader", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Elasticsearch document ID or address for raw text content',
        example: 'assistant_aggregator_documents_507f1f77bcf86cd799439011',
    }),
    __metadata("design:type", String)
], UpdateDocumentDto.prototype, "rawTextFileId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Document metadata as JSON object',
        example: {
            size: 1024000,
            mimeType: 'application/pdf',
            pages: 10,
            language: 'en',
            tags: ['report', 'quarterly', 'updated']
        },
    }),
    __metadata("design:type", Object)
], UpdateDocumentDto.prototype, "metadata", void 0);
//# sourceMappingURL=update-document.dto.js.map