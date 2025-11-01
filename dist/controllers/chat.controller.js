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
const message_service_1 = require("../services/message.service");
const users_service_1 = require("../users/users.service");
const crypto_1 = require("crypto");
const mongoose_1 = require("mongoose");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
var ChatErrorCode;
(function (ChatErrorCode) {
    ChatErrorCode["INVALID_PARAM"] = "invalid_param";
    ChatErrorCode["APP_UNAVAILABLE"] = "app_unavailable";
    ChatErrorCode["PROVIDER_NOT_INITIALIZE"] = "provider_not_initialize";
    ChatErrorCode["PROVIDER_QUOTA_EXCEEDED"] = "provider_quota_exceeded";
    ChatErrorCode["MODEL_CURRENTLY_NOT_SUPPORT"] = "model_currently_not_support";
    ChatErrorCode["COMPLETION_REQUEST_ERROR"] = "completion_request_error";
    ChatErrorCode["UNAUTHORIZED"] = "unauthorized";
    ChatErrorCode["CONVERSATION_DOES_NOT_EXIST"] = "conversation_does_not_exist";
    ChatErrorCode["INTERNAL_SERVER_ERROR"] = "internal_server_error";
})(ChatErrorCode || (ChatErrorCode = {}));
class ChatException extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'ChatException';
    }
}
let ChatController = class ChatController {
    chatService;
    chatMessagesService;
    messageService;
    usersService;
    constructor(chatService, chatMessagesService, messageService, usersService) {
        this.chatService = chatService;
        this.chatMessagesService = chatMessagesService;
        this.messageService = messageService;
        this.usersService = usersService;
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
    async findChatById(id, userId) {
        return this.chatService.findChatById(id, userId);
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
            const responseMode = body.responseMode || body.response_mode || 'blocking';
            if (!body.user) {
                throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'User ID is required');
            }
            if (!mongoose_1.Types.ObjectId.isValid(body.user)) {
                throw new ChatException(401, ChatErrorCode.UNAUTHORIZED, 'Invalid user ID format');
            }
            try {
                await this.usersService.findUserById(body.user);
            }
            catch (error) {
                if (error.name === 'NotFoundException') {
                    throw new ChatException(401, ChatErrorCode.UNAUTHORIZED, 'User does not exist');
                }
                throw error;
            }
            const inputs = body.inputs || {};
            if (!inputs.similarityThreshold) {
                inputs.similarityThreshold = '0.10';
            }
            if (inputs.contextCount === undefined) {
                inputs.contextCount = 6;
            }
            const autoGeneratedName = body.autoGeneratedName;
            if (!body.query || body.query.trim() === '') {
                throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'Query cannot be empty');
            }
            if (!responseMode || !['blocking', 'streaming'].includes(responseMode)) {
                throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'Response mode must be either "blocking" or "streaming"');
            }
            if (!inputs || !inputs.similarityThreshold || inputs.contextCount === undefined) {
                throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'Inputs object with similarityThreshold and contextCount is required');
            }
            const thinkLevel = body.think_level || 'standard';
            const finalAutoGeneratedName = autoGeneratedName !== undefined ? autoGeneratedName : true;
            if (body.conversationId) {
                const conversationExists = true;
                if (!conversationExists) {
                    throw new ChatException(404, ChatErrorCode.CONVERSATION_DOES_NOT_EXIST, 'Conversation does not exist');
                }
            }
            const userMessage = await this.messageService.createMessage({
                category: 'user_input',
                text: body.query,
                date: new Date().toISOString(),
                score: 0
            });
            let chatId;
            if (body.conversationId && body.conversationId !== 'new') {
                await this.chatService.addMessageToChat(body.conversationId, userMessage._id.toString());
                chatId = body.conversationId;
            }
            else {
                const newChat = await this.chatService.createChat({
                    user: body.user,
                    title: body.query.substring(0, 50) + (body.query.length > 50 ? '...' : ''),
                    conversationHistory: [userMessage._id.toString()]
                });
                chatId = newChat._id.toString();
            }
            if (responseMode === chat_messages_dto_1.ChatMessagesResponseMode.STREAMING) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
                const streamingBody = {
                    ...body,
                    conversationId: chatId,
                    think_level: thinkLevel
                };
                try {
                    const result = await this.chatMessagesService.processStreaming(streamingBody);
                    const taskId = result?.taskId || (0, crypto_1.randomUUID)();
                    const taskCreatedEvent = {
                        event: 'message',
                        task_id: taskId,
                        message_id: userMessage._id.toString(),
                        conversation_id: chatId,
                        answer: '',
                        created_at: Math.floor(Date.now() / 1000),
                    };
                    res.write(`data: ${JSON.stringify(taskCreatedEvent)}\n\n`);
                    const endEvent = {
                        event: 'message_end',
                        task_id: taskId,
                        id: chatId,
                        message_id: userMessage._id.toString(),
                        conversation_id: chatId,
                        metadata: {
                            retriever_resources: []
                        }
                    };
                    res.write(`data: ${JSON.stringify(endEvent)}\n\n`);
                    res.end();
                }
                catch (error) {
                    const taskId = (0, crypto_1.randomUUID)();
                    const errorEvent = {
                        event: 'error',
                        task_id: taskId,
                        message_id: userMessage._id.toString(),
                        conversation_id: chatId,
                        status: 500,
                        code: 'internal_error',
                        message: error.message || 'Streaming error'
                    };
                    res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
                    res.end();
                }
            }
            else {
                const blockingBody = {
                    ...body,
                    think_level: thinkLevel
                };
                const result = await this.chatMessagesService.processBlocking(blockingBody);
                if (result && result.event === 'error' && result.error) {
                    const errorResponse = {
                        status: result.error.status || 500,
                        code: result.error.code || ChatErrorCode.INTERNAL_SERVER_ERROR,
                        message: result.error.message || 'Internal server error'
                    };
                    res.status(result.error.status || 500).json(errorResponse);
                    return;
                }
                const taskId = (0, crypto_1.randomUUID)();
                let assistantMessageId = '';
                if (result && result.answer) {
                    const retrieverResources = result.metadata?.retriever_resources || [];
                    const assistantMessage = await this.messageService.createMessage({
                        category: 'assistant_response',
                        text: result.answer,
                        date: new Date().toISOString(),
                        score: 0,
                        retrieverResources: retrieverResources
                    });
                    assistantMessageId = assistantMessage._id.toString();
                    await this.chatService.addMessageToChat(chatId, assistantMessageId);
                }
                const response = {
                    event: 'message',
                    task_id: taskId,
                    id: chatId,
                    message_id: assistantMessageId || userMessage._id.toString(),
                    conversation_id: chatId,
                    mode: 'blocking',
                    answer: result?.answer || '',
                    metadata: {
                        retriever_resources: result?.metadata?.retriever_resources || []
                    },
                    created_at: Math.floor(Date.now() / 1000),
                };
                res.status(200).json(response);
            }
        }
        catch (error) {
            if (error instanceof ChatException) {
                const errorResponse = {
                    status: error.status,
                    code: error.code,
                    message: error.message
                };
                res.status(error.status).json(errorResponse);
            }
            else {
                const errorResponse = {
                    status: 500,
                    code: ChatErrorCode.INTERNAL_SERVER_ERROR,
                    message: 'An unexpected error occurred'
                };
                res.status(500).json(errorResponse);
            }
        }
    }
    async testErrors(body, res) {
        try {
            const { errorType } = body;
            switch (errorType) {
                case 'invalid_param':
                    throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'Invalid parameter provided');
                case 'app_unavailable':
                    throw new ChatException(400, ChatErrorCode.APP_UNAVAILABLE, 'Application is currently unavailable');
                case 'provider_not_initialize':
                    throw new ChatException(400, ChatErrorCode.PROVIDER_NOT_INITIALIZE, 'AI provider is not initialized');
                case 'provider_quota_exceeded':
                    throw new ChatException(400, ChatErrorCode.PROVIDER_QUOTA_EXCEEDED, 'AI provider quota has been exceeded');
                case 'model_currently_not_support':
                    throw new ChatException(400, ChatErrorCode.MODEL_CURRENTLY_NOT_SUPPORT, 'The requested model is currently not supported');
                case 'completion_request_error':
                    throw new ChatException(400, ChatErrorCode.COMPLETION_REQUEST_ERROR, 'Failed to complete the request');
                case 'unauthorized':
                    throw new ChatException(401, ChatErrorCode.UNAUTHORIZED, 'Unauthorized access');
                case 'conversation_does_not_exist':
                    throw new ChatException(404, ChatErrorCode.CONVERSATION_DOES_NOT_EXIST, 'Conversation does not exist');
                case 'internal_server_error':
                    throw new ChatException(500, ChatErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error occurred');
                default:
                    res.json({
                        message: 'Error testing endpoint',
                        available_error_types: [
                            'invalid_param',
                            'app_unavailable',
                            'provider_not_initialize',
                            'provider_quota_exceeded',
                            'model_currently_not_support',
                            'completion_request_error',
                            'unauthorized',
                            'conversation_does_not_exist',
                            'internal_server_error'
                        ],
                        usage: 'POST /chats/test-errors with body: {"errorType": "invalid_param"}'
                    });
                    return;
            }
        }
        catch (error) {
            if (error instanceof ChatException) {
                const errorResponse = {
                    status: error.status,
                    code: error.code,
                    message: error.message
                };
                res.status(error.status).json(errorResponse);
            }
            else {
                const errorResponse = {
                    status: 500,
                    code: ChatErrorCode.INTERNAL_SERVER_ERROR,
                    message: 'An unexpected error occurred'
                };
                res.status(500).json(errorResponse);
            }
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
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
    (0, swagger_1.ApiOperation)({
        summary: 'Get a specific chat by ID',
        description: 'Retrieves a single chat with full conversation history including retriever resources',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Chat ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiQuery)({ name: 'user', required: true, description: 'User ID to verify ownership', example: '507f1f77bcf86cd799439012' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chat retrieved successfully',
        type: chat_schema_1.Chat,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Chat not found or user does not have access to this chat',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid chat ID or user ID',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('user')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
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
__decorate([
    (0, common_1.Post)('test-errors'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Test error responses',
        description: 'Endpoint to test different error codes and responses',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "testErrors", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('chats'),
    (0, common_1.Controller)('chats'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_messages_service_1.ChatMessagesService,
        message_service_1.MessageService,
        users_service_1.UsersService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map