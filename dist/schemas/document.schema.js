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
exports.DocumentSchema = exports.Document = exports.DocumentMetadata = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let DocumentMetadata = class DocumentMetadata {
    user_id;
    document_id;
    page_id;
    title;
    approved_date;
    effective_date;
    owner;
    username;
    access_level;
    ocr;
};
exports.DocumentMetadata = DocumentMetadata;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reference to User entity', example: '507f1f77bcf86cd799439012', type: String, required: false }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", Object)
], DocumentMetadata.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document external identifier', example: 'string2', required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "document_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Page identifier', example: 'string111', required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "page_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Title', example: 'string1', required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Approved date', example: 'string1', required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "approved_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Effective date', example: 'string1', required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "effective_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Owner', example: 'string1', required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "owner", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Username', example: 'string1', required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Access level', example: 'string1', required: false }),
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DocumentMetadata.prototype, "access_level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OCR processing metadata', required: false, example: { processingStartedAt: '2024-01-01T00:00:00.000Z', processedAt: '2024-01-01T00:05:00.000Z', textLength: 1234 } }),
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], DocumentMetadata.prototype, "ocr", void 0);
exports.DocumentMetadata = DocumentMetadata = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], DocumentMetadata);
let Document = class Document {
    _id;
    filename;
    fileUrl;
    extension;
    dataset;
    originalDocumentId;
    pageNumber;
    isPageDocument;
    rawTextFileId;
    raw_text;
    ocrStatus;
    metadata;
    createdAt;
    updatedAt;
};
exports.Document = Document;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Document ID',
        example: '507f1f77bcf86cd799439011',
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Document.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Original filename of the uploaded document',
        example: 'report.pdf',
    }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Document.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'MinIO URL where the file is stored',
        example: 'http://localhost:9000/assistant-aggregator/documents/507f1f77bcf86cd799439011_report.pdf',
    }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Document.prototype, "fileUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File extension/format',
        example: 'pdf',
    }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Document.prototype, "extension", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reference to Dataset entity',
        example: '507f1f77bcf86cd799439013',
        type: String,
        required: false,
    }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Dataset', required: false }),
    __metadata("design:type", Object)
], Document.prototype, "dataset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Original document ID that this page belongs to',
        example: '507f1f77bcf86cd799439011',
        required: false,
    }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Document.prototype, "originalDocumentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number within the document',
        example: 1,
        required: false,
    }),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], Document.prototype, "pageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if this is a page from a multi-page document',
        example: false,
        required: false,
    }),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Document.prototype, "isPageDocument", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Elasticsearch document ID or address for raw text content',
        example: 'assistant_aggregator_documents_507f1f77bcf86cd799439011',
    }),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Document.prototype, "rawTextFileId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Extracted raw text content from OCR processing',
        example: 'This is the extracted text content from the document...',
    }),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Document.prototype, "raw_text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OCR processing status',
        enum: ['pending', 'processing', 'completed', 'failed'],
        example: 'completed',
    }),
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    }),
    __metadata("design:type", String)
], Document.prototype, "ocrStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Document metadata as JSON object',
        example: {
            user_id: '507f1f77bcf86cd799439012',
            document_id: 'string2',
            page_id: 'string111',
            title: 'string1',
            approved_date: 'string1',
            effective_date: 'string1',
            owner: 'string1',
            username: 'string1',
            access_level: 'string1'
        },
    }),
    (0, mongoose_1.Prop)({ type: mongoose_1.SchemaFactory.createForClass(DocumentMetadata), default: {} }),
    __metadata("design:type", DocumentMetadata)
], Document.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Document creation timestamp',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Document.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Document last update timestamp',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Document.prototype, "updatedAt", void 0);
exports.Document = Document = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
    })
], Document);
exports.DocumentSchema = mongoose_1.SchemaFactory.createForClass(Document);
//# sourceMappingURL=document.schema.js.map