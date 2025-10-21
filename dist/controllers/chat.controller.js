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
const chat_messages_dto_1 = require("../dto/chat-messages.dto");
const chat_messages_service_1 = require("../services/chat-messages.service");
const api_key_auth_guard_1 = require("../auth/api-key-auth.guard");
let ChatController = class ChatController {
    chatService;
    chatMessagesService;
    constructor(chatService, chatMessagesService) {
        this.chatService = chatService;
        this.chatMessagesService = chatMessagesService;
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
    async findChatsByUser(userId) {
        return this.chatService.findChatsByUser(userId);
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
    async chatMessages(body, req, res) {
        try {
            if (body.responseMode === chat_messages_dto_1.ChatMessagesResponseMode.STREAMING) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const messageEvent = {
                    event: 'message',
                    task_id: taskId,
                    message_id: messageId,
                    conversation_id: conversationId,
                    answer: 'Processing your request...',
                    created_at: Date.now()
                };
                res.write(`data: ${JSON.stringify(messageEvent)}\n\n`);
                setTimeout(() => {
                    const messageEndEvent = {
                        event: 'message_end',
                        task_id: taskId,
                        id: messageId,
                        message_id: messageId,
                        conversation_id: conversationId,
                        metadata: {
                            retriever_resources: [
                                {
                                    position: 1,
                                    dataset_id: 'dataset_001',
                                    dataset_name: 'Knowledge Base',
                                    document_id: 'doc_001',
                                    document_name: 'Company Policies',
                                    segment_id: 'seg_001',
                                    score: 0.95,
                                    content: 'This is relevant content from the knowledge base that was retrieved to answer your question.'
                                }
                            ]
                        }
                    };
                    res.write(`data: ${JSON.stringify(messageEndEvent)}\n\n`);
                    res.end();
                }, 1000);
            }
            else {
                const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const response = {
                    event: 'message',
                    task_id: taskId,
                    id: messageId,
                    message_id: messageId,
                    conversation_id: conversationId,
                    mode: 'blocking',
                    answer: 'This is a mock response from the AI assistant. In a real implementation, this would contain the actual AI-generated response based on your query.',
                    metadata: {
                        retriever_resources: [
                            {
                                position: 1,
                                dataset_id: 'dataset_001',
                                dataset_name: 'Knowledge Base',
                                document_id: 'doc_001',
                                document_name: 'Company Policies',
                                segment_id: 'seg_001',
                                score: 0.95,
                                content: 'This is relevant content from the knowledge base that was retrieved to answer your question.'
                            }
                        ]
                    },
                    created_at: Date.now()
                };
                res.json(response);
            }
        }
        catch (error) {
            const errorResponse = {
                status: 500,
                code: 'INTERNAL_ERROR',
                message: error.message || 'An error occurred while processing the chat message'
            };
            res.status(500).json(errorResponse);
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(api_key_auth_guard_1.ApiKeyAuthGuard),
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
        description: 'Retrieves chats with optional filtering by user and date range',
    }),
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
    (0, swagger_1.ApiExcludeEndpoint)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatStats", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "findChatsByUser", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "findChatById", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    (0, swagger_1.ApiExcludeEndpoint)(),
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
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_message_to_chat_dto_1.AddMessageToChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMessageToChat", null);
__decorate([
    (0, common_1.Patch)(':id/remove-message/:messageId'),
    (0, swagger_1.ApiExcludeEndpoint)(),
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
__decorate([
    (0, common_1.Post)('chat-messages'),
    (0, common_1.UseGuards)(api_key_auth_guard_1.ApiKeyAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate chat messages',
        description: 'Generates a chat response. If responseMode is streaming, emits WS events; if blocking, returns a REST payload',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Blocking response', type: chat_messages_dto_1.ChatMessageAnswerResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_messages_dto_1.ChatMessagesRequestDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "chatMessages", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('chats'),
    (0, common_1.Controller)('chats'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_messages_service_1.ChatMessagesService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map