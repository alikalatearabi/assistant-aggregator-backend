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
exports.MessageSchema = exports.Message = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let Message = class Message {
    _id;
    category;
    text;
    date;
    score;
    createdAt;
    updatedAt;
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
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
    })
], Message);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
//# sourceMappingURL=message.schema.js.map