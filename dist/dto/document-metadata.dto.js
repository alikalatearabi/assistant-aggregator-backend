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
exports.DocumentMetadataDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class DocumentMetadataDto {
    user_id;
    document_id;
    page_id;
    title;
    approved_date;
    effective_date;
    owner;
    username;
    access_level;
}
exports.DocumentMetadataDto = DocumentMetadataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User identifier related to the document (Mongo ObjectId)', example: '507f1f77bcf86cd799439012' }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Document identifier', example: 'string2' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "document_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page identifier within the document', example: 'string111' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "page_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Document title', example: 'string1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Approved date', example: 'string1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "approved_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Effective date', example: 'string1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "effective_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Owner of the document', example: 'string1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "owner", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Username of the owner/uploader', example: 'jdoe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Access level for the document', example: 'string1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentMetadataDto.prototype, "access_level", void 0);
//# sourceMappingURL=document-metadata.dto.js.map