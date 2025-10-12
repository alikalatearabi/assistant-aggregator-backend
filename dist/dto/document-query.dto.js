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
exports.DocumentQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class DocumentQueryDto {
    extension;
    metadataUserId;
    filename;
    dateFrom;
    dateTo;
    page;
    limit;
}
exports.DocumentQueryDto = DocumentQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by file extension',
        example: 'pdf',
    }),
    __metadata("design:type", String)
], DocumentQueryDto.prototype, "extension", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by metadata.user_id (uploader)',
        example: '507f1f77bcf86cd799439012',
    }),
    __metadata("design:type", String)
], DocumentQueryDto.prototype, "metadataUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Search in filename',
        example: 'report',
    }),
    __metadata("design:type", String)
], DocumentQueryDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date from (ISO string)',
        example: '2023-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", String)
], DocumentQueryDto.prototype, "dateFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date to (ISO string)',
        example: '2023-12-31T23:59:59.999Z',
    }),
    __metadata("design:type", String)
], DocumentQueryDto.prototype, "dateTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number for pagination',
        example: 1,
        minimum: 1,
    }),
    __metadata("design:type", Number)
], DocumentQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of items per page',
        example: 10,
        minimum: 1,
        maximum: 100,
    }),
    __metadata("design:type", Number)
], DocumentQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=document-query.dto.js.map