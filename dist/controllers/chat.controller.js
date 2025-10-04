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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("../services/chat.service");
const create_chat_dto_1 = require("../dto/create-chat.dto");
const update_chat_dto_1 = require("../dto/update-chat.dto");
const chat_query_dto_1 = require("../dto/chat-query.dto");
const add_message_to_chat_dto_1 = require("../dto/add-message-to-chat.dto");
const chat_schema_1 = require("../schemas/chat.schema");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async createChat(createChatDto) {
        return this.chatService.createChat(createChatDto);
    }
    async findAllChats(query) {
        return this.chatService.findAllChats(query);
    }
    async getChatStats() {
        return this.chatService.getChatStats();
    }
    async searchChats(searchTerm) {
        return this.chatService.searchChats(searchTerm);
    }
    async findChatsByUser(userId) {
        return this.chatService.findChatsByUser(userId);
    }
    async findChatBySession(session) {
        return this.chatService.findChatBySession(session);
    }
    async findChatById(id) {
        return this.chatService.findChatById(id);
    }
    async getChatMessageHistory(id) {
        return this.chatService.getChatMessageHistory(id);
    }
    async updateChat(id, updateChatDto) {
        return this.chatService.updateChat(id, updateChatDto);
    }
    async addMessageToChat(id, addMessageDto) {
        return this.chatService.addMessageToChat(id, addMessageDto.messageId);
    }
    async removeMessageFromChat(id, messageId) {
        return this.chatService.removeMessageFromChat(id, messageId);
    }
    async deleteChat(id) {
        return this.chatService.deleteChat(id);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new chat session',
        description: 'Creates a new chat session with user reference and optional initial message history',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Chat created successfully',
        type: chat_schema_1.Chat,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_chat_dto_1.CreateChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createChat", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all chats with pagination and filtering',
        description: 'Retrieves chats with optional filtering by session, user, and date range',
    }),
    (0, swagger_1.ApiQuery)({ name: 'session', required: false, description: 'Filter by session identifier' }),
    (0, swagger_1.ApiQuery)({ name: 'user', required: false, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page', example: 10 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chats retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                chats: { type: 'array', items: { $ref: '#/components/schemas/Chat' } },
                total: { type: 'number', example: 50 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 5 },
            },
        },
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_query_dto_1.ChatQueryDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "findAllChats", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get chat statistics',
        description: 'Retrieves comprehensive statistics about chat sessions',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chat statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalChats: { type: 'number', example: 150 },
                chatsByUser: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                            count: { type: 'number', example: 5 },
                        },
                    },
                },
                averageMessagesPerChat: { type: 'number', example: 12.5 },
                recentChats: { type: 'number', example: 8 },
                activeSessions: { type: 'number', example: 45 },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatStats", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search chats',
        description: 'Search chats by session identifier',
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search term' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Search results retrieved successfully',
        type: [chat_schema_1.Chat],
    }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "searchChats", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get chats by user',
        description: 'Retrieves all chat sessions for a specific user',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'User ID',
        example: '507f1f77bcf86cd799439012',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User chats retrieved successfully',
        type: [chat_schema_1.Chat],
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid user ID',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "findChatsByUser", null);
__decorate([
    (0, common_1.Get)('session/:session'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get chat by session',
        description: 'Retrieves a specific chat by session identifier',
    }),
    (0, swagger_1.ApiParam)({
        name: 'session',
        description: 'Session identifier',
        example: 'session_2023_12_01_user_123',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chat found successfully',
        type: chat_schema_1.Chat,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Chat not found',
    }),
    __param(0, (0, common_1.Param)('session')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "findChatBySession", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get chat by ID',
        description: 'Retrieves a specific chat by its MongoDB ObjectId',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Chat MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chat found successfully',
        type: chat_schema_1.Chat,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Chat not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid chat ID',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "findChatById", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get chat message history',
        description: 'Retrieves the complete message history for a specific chat',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Chat MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message history retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
                    category: { type: 'string', example: 'support' },
                    text: { type: 'string', example: 'How can I help you?' },
                    date: { type: 'string', example: '2023-12-01T10:00:00.000Z' },
                    score: { type: 'number', example: 0.8 },
                    createdAt: { type: 'string', example: '2023-12-01T10:00:00.000Z' },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Chat not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatMessageHistory", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update chat',
        description: 'Updates chat information with the provided data',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Chat MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chat updated successfully',
        type: chat_schema_1.Chat,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Chat not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid input data',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_chat_dto_1.UpdateChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateChat", null);
__decorate([
    (0, common_1.Patch)(':id/add-message'),
    (0, swagger_1.ApiOperation)({
        summary: 'Add message to chat',
        description: 'Adds a message to the chat message history',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Chat MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiBody)({ type: add_message_to_chat_dto_1.AddMessageToChatDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message added to chat successfully',
        type: chat_schema_1.Chat,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Chat not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid chat or message ID',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_message_to_chat_dto_1.AddMessageToChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMessageToChat", null);
__decorate([
    (0, common_1.Patch)(':id/remove-message/:messageId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Remove message from chat',
        description: 'Removes a message from the chat message history',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Chat MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiParam)({
        name: 'messageId',
        description: 'Message MongoDB ObjectId',
        example: '507f1f77bcf86cd799439013',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message removed from chat successfully',
        type: chat_schema_1.Chat,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Chat not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid chat or message ID',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "removeMessageFromChat", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete chat',
        description: 'Permanently removes a chat session from the system',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Chat MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chat deleted successfully',
        type: chat_schema_1.Chat,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Chat not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid chat ID',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteChat", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('chats'),
    (0, common_1.Controller)('chats'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map