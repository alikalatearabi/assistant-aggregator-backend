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
exports.MessageSchema = exports.Message = exports.RetrieverResource = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
class RetrieverResource {
    position;
    dataset_id;
    dataset_name;
    document_id;
    document_name;
    segment_id;
    score;
    content;
}
exports.RetrieverResource = RetrieverResource;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Position in ranking', example: 1 }),
    __metadata("design:type", Number)
], RetrieverResource.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dataset ID', example: '001' }),
    __metadata("design:type", String)
], RetrieverResource.prototype, "dataset_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dataset name', example: 'وزارت' }),
    __metadata("design:type", String)
], RetrieverResource.prototype, "dataset_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document ID', example: '1221' }),
    __metadata("design:type", String)
], RetrieverResource.prototype, "document_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document name', example: 'آیین نامه نحوه تأسیس واحد های پژوهشی در دانشگاه ها' }),
    __metadata("design:type", String)
], RetrieverResource.prototype, "document_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Segment ID', example: '6eb1f935-3646-43f6-a18b-ff935e6ed59f' }),
    __metadata("design:type", String)
], RetrieverResource.prototype, "segment_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Similarity score', example: 0.6027078628540039 }),
    __metadata("design:type", Number)
], RetrieverResource.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Content snippet', example: 'آیین نامه نحوه تأسیس واحد های پژوهشی در دانشگاه ها...' }),
    __metadata("design:type", String)
], RetrieverResource.prototype, "content", void 0);
let Message = class Message {
    _id;
    category;
    text;
    date;
    score;
    createdAt;
    updatedAt;
    retrieverResources;
};
exports.Message = Message;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message ID',
        example: '507f1f77bcf86cd799439011',
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message category',
        example: 'support',
    }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message text content',
        example: 'This is a sample message content.',
    }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message date',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Message.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message sentiment score (between -1.0 and 1.0)',
        example: 0.75,
        minimum: -1.0,
        maximum: 1.0,
    }),
    (0, mongoose_1.Prop)({
        type: Number,
        required: true,
        min: -1.0,
        max: 1.0,
        validate: {
            validator: function (value) {
                return value >= -1.0 && value <= 1.0;
            },
            message: 'Score must be between -1.0 and 1.0'
        }
    }),
    __metadata("design:type", Number)
], Message.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message creation timestamp',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message last update timestamp',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Message.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Retriever resources (sources used to generate the answer)',
        type: [RetrieverResource],
        required: false,
    }),
    (0, mongoose_1.Prop)({ type: Array, default: [] }),
    __metadata("design:type", Array)
], Message.prototype, "retrieverResources", void 0);
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
    })
], Message);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
//# sourceMappingURL=message.schema.js.map