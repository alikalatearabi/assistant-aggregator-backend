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
exports.DocumentSchema = exports.Document = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let Document = class Document {
    _id;
    filename;
    fileUrl;
    extension;
    fileUploader;
    rawTextFileId;
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
        description: 'User who uploaded the document',
        type: String,
        example: '507f1f77bcf86cd799439012',
    }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", Object)
], Document.prototype, "fileUploader", void 0);
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
        description: 'Document metadata as JSON object',
        example: {
            size: 1024000,
            mimeType: 'application/pdf',
            pages: 10,
            language: 'en',
            tags: ['report', 'quarterly']
        },
    }),
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
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