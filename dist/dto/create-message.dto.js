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
exports.CreateMessageDto = exports.RetrieverResourceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class RetrieverResourceDto {
    position;
    dataset_id;
    dataset_name;
    document_id;
    document_name;
    segment_id;
    score;
    content;
}
exports.RetrieverResourceDto = RetrieverResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Position in ranking', example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RetrieverResourceDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dataset ID', example: '001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RetrieverResourceDto.prototype, "dataset_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dataset name', example: 'وزارت' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RetrieverResourceDto.prototype, "dataset_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document ID', example: '1221' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RetrieverResourceDto.prototype, "document_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document name', example: 'آیین نامه نحوه تأسیس واحد های پژوهشی در دانشگاه ها' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RetrieverResourceDto.prototype, "document_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Segment ID', example: '6eb1f935-3646-43f6-a18b-ff935e6ed59f' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RetrieverResourceDto.prototype, "segment_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Similarity score', example: 0.6027078628540039 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RetrieverResourceDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Content snippet', example: 'آیین نامه نحوه تأسیس واحد های پژوهشی در دانشگاه ها...' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RetrieverResourceDto.prototype, "content", void 0);
class CreateMessageDto {
    category;
    text;
    date;
    score;
    retrieverResources;
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message category',
        example: 'user_input',
        enum: ['user_input', 'assistant_response', 'system_error', 'system_info'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['user_input', 'assistant_response', 'system_error', 'system_info']),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message text content',
        example: 'This is a sample message content.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message date (ISO string)',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message sentiment score (between -1.0 and 1.0)',
        example: 0.75,
        minimum: -1.0,
        maximum: 1.0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-1.0),
    (0, class_validator_1.Max)(1.0),
    __metadata("design:type", Number)
], CreateMessageDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Retriever resources (sources used to generate the answer)',
        type: [RetrieverResourceDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RetrieverResourceDto),
    __metadata("design:type", Array)
], CreateMessageDto.prototype, "retrieverResources", void 0);
//# sourceMappingURL=create-message.dto.js.map