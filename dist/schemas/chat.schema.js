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
exports.ChatSchema = exports.Chat = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let Chat = class Chat {
    _id;
    title;
    user;
    conversationHistory;
    createdAt;
    updatedAt;
};
exports.Chat = Chat;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Conversation ID',
        example: '507f1f77bcf86cd799439011',
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Chat.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Chat title',
        example: 'گفتگوی جدید',
    }),
    (0, mongoose_1.Prop)({ type: String, default: 'گفتگوی جدید' }),
    __metadata("design:type", String)
], Chat.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User who owns this chat session',
        type: String,
        example: '507f1f77bcf86cd799439012',
    }),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", Object)
], Chat.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of messages in this chat session',
        type: [String],
        example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    }),
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Message' }], default: [] }),
    __metadata("design:type", Array)
], Chat.prototype, "conversationHistory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Chat creation timestamp',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Chat.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Chat last update timestamp',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Chat.prototype, "updatedAt", void 0);
exports.Chat = Chat = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
    })
], Chat);
exports.ChatSchema = mongoose_1.SchemaFactory.createForClass(Chat);
//# sourceMappingURL=chat.schema.js.map