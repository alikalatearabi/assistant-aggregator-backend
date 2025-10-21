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
var ChatMessagesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessagesGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_messages_service_1 = require("../services/chat-messages.service");
let ChatMessagesGateway = ChatMessagesGateway_1 = class ChatMessagesGateway {
    chatMessagesService;
    logger = new common_1.Logger(ChatMessagesGateway_1.name);
    server;
    constructor(chatMessagesService) {
        this.chatMessagesService = chatMessagesService;
    }
    handleConnection(client) {
        this.logger.log(`Client connected to chat-messages WS: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from chat-messages WS: ${client.id}`);
    }
    async handleChatRequest(payload, client) {
        try {
            this.logger.log(`Received chat_request from client ${client.id} responseMode=${payload?.responseMode}`);
            if (payload?.responseMode === 'streaming') {
                await this.chatMessagesService.processStreaming(payload);
                return { status: 'accepted' };
            }
            const result = await this.chatMessagesService.processBlocking(payload);
            client.emit('chat-messages', result);
            return { status: 'ok' };
        }
        catch (err) {
            this.logger.error('handleChatRequest error', err?.stack || err?.message || err);
            client.emit('chat-messages', { event: 'error', message: 'Server error' });
            return { status: 'error' };
        }
    }
    broadcast(data) {
        this.server?.emit('chat-messages', data);
    }
};
exports.ChatMessagesGateway = ChatMessagesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatMessagesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat_request'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatMessagesGateway.prototype, "handleChatRequest", null);
exports.ChatMessagesGateway = ChatMessagesGateway = ChatMessagesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/chat-messages', cors: true }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_messages_service_1.ChatMessagesService))),
    __metadata("design:paramtypes", [chat_messages_service_1.ChatMessagesService])
], ChatMessagesGateway);
//# sourceMappingURL=chat-messages.gateway.js.map