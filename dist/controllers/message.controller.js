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
exports.MessageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const message_service_1 = require("../services/message.service");
const create_message_dto_1 = require("../dto/create-message.dto");
const update_message_dto_1 = require("../dto/update-message.dto");
const message_query_dto_1 = require("../dto/message-query.dto");
const message_schema_1 = require("../schemas/message.schema");
let MessageController = class MessageController {
    messageService;
    constructor(messageService) {
        this.messageService = messageService;
    }
    async createMessage(createMessageDto) {
        return this.messageService.createMessage(createMessageDto);
    }
    async findAllMessages(query) {
        return this.messageService.findAllMessages(query);
    }
    async getMessageStats() {
        return this.messageService.getMessageStats();
    }
    async searchMessages(searchTerm) {
        return this.messageService.searchMessages(searchTerm);
    }
    async findPositiveMessages() {
        return this.messageService.findPositiveMessages();
    }
    async findNegativeMessages() {
        return this.messageService.findNegativeMessages();
    }
    async findNeutralMessages() {
        return this.messageService.findNeutralMessages();
    }
    async findMessagesByCategory(category) {
        return this.messageService.findMessagesByCategory(category);
    }
    async findMessagesByScoreRange(minScore, maxScore) {
        return this.messageService.findMessagesByScoreRange(+minScore, +maxScore);
    }
    async findMessageById(id) {
        return this.messageService.findMessageById(id);
    }
    async updateMessage(id, updateMessageDto) {
        return this.messageService.updateMessage(id, updateMessageDto);
    }
    async deleteMessage(id) {
        return this.messageService.deleteMessage(id);
    }
};
exports.MessageController = MessageController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new message',
        description: 'Creates a new message with category, text, date, and sentiment score',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Message created successfully',
        type: message_schema_1.Message,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid input data or score out of range',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_message_dto_1.CreateMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "createMessage", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all messages with pagination and filtering',
        description: 'Retrieves messages with optional filtering by category, text, score range, and date range',
    }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: 'Filter by category' }),
    (0, swagger_1.ApiQuery)({ name: 'text', required: false, description: 'Search in message text' }),
    (0, swagger_1.ApiQuery)({ name: 'minScore', required: false, description: 'Minimum score filter (-1.0 to 1.0)' }),
    (0, swagger_1.ApiQuery)({ name: 'maxScore', required: false, description: 'Maximum score filter (-1.0 to 1.0)' }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page', example: 10 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Messages retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
                total: { type: 'number', example: 100 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 10 },
            },
        },
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [message_query_dto_1.MessageQueryDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "findAllMessages", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get message statistics',
        description: 'Retrieves comprehensive statistics about messages including sentiment analysis',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalMessages: { type: 'number', example: 150 },
                messagesByCategory: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string', example: 'support' },
                            count: { type: 'number', example: 45 },
                        },
                    },
                },
                averageScore: { type: 'number', example: 0.234 },
                positiveMessages: { type: 'number', example: 80 },
                negativeMessages: { type: 'number', example: 30 },
                neutralMessages: { type: 'number', example: 40 },
                scoreDistribution: {
                    type: 'object',
                    properties: {
                        veryNegative: { type: 'number', example: 5 },
                        negative: { type: 'number', example: 25 },
                        neutral: { type: 'number', example: 40 },
                        positive: { type: 'number', example: 60 },
                        veryPositive: { type: 'number', example: 20 },
                    },
                },
                recentMessages: { type: 'number', example: 12 },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getMessageStats", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search messages',
        description: 'Search messages by category or text content',
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search term' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Search results retrieved successfully',
        type: [message_schema_1.Message],
    }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "searchMessages", null);
__decorate([
    (0, common_1.Get)('positive'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get positive messages',
        description: 'Retrieves all messages with positive sentiment scores (> 0)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Positive messages retrieved successfully',
        type: [message_schema_1.Message],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "findPositiveMessages", null);
__decorate([
    (0, common_1.Get)('negative'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get negative messages',
        description: 'Retrieves all messages with negative sentiment scores (< 0)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Negative messages retrieved successfully',
        type: [message_schema_1.Message],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "findNegativeMessages", null);
__decorate([
    (0, common_1.Get)('neutral'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get neutral messages',
        description: 'Retrieves all messages with neutral sentiment scores (= 0)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Neutral messages retrieved successfully',
        type: [message_schema_1.Message],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "findNeutralMessages", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get messages by category',
        description: 'Retrieves all messages in a specific category',
    }),
    (0, swagger_1.ApiParam)({
        name: 'category',
        description: 'Message category',
        example: 'support',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Messages retrieved successfully',
        type: [message_schema_1.Message],
    }),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "findMessagesByCategory", null);
__decorate([
    (0, common_1.Get)('score-range'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get messages by score range',
        description: 'Retrieves messages within a specified sentiment score range',
    }),
    (0, swagger_1.ApiQuery)({ name: 'min', required: true, description: 'Minimum score (-1.0 to 1.0)' }),
    (0, swagger_1.ApiQuery)({ name: 'max', required: true, description: 'Maximum score (-1.0 to 1.0)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Messages retrieved successfully',
        type: [message_schema_1.Message],
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid score range',
    }),
    __param(0, (0, common_1.Query)('min')),
    __param(1, (0, common_1.Query)('max')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "findMessagesByScoreRange", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get message by ID',
        description: 'Retrieves a specific message by its MongoDB ObjectId',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Message MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message found successfully',
        type: message_schema_1.Message,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Message not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid message ID',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "findMessageById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update message',
        description: 'Updates message information with the provided data',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Message MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message updated successfully',
        type: message_schema_1.Message,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Message not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid input data or score out of range',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_message_dto_1.UpdateMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "updateMessage", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete message',
        description: 'Permanently removes a message from the system',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Message MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message deleted successfully',
        type: message_schema_1.Message,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Message not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid message ID',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "deleteMessage", null);
exports.MessageController = MessageController = __decorate([
    (0, swagger_1.ApiTags)('messages'),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [message_service_1.MessageService])
], MessageController);
//# sourceMappingURL=message.controller.js.map