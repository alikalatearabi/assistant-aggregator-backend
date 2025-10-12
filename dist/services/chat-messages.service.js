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
exports.ChatMessagesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const chat_messages_gateway_1 = require("../gateways/chat-messages.gateway");
let ChatMessagesService = class ChatMessagesService {
    gateway;
    constructor(gateway) {
        this.gateway = gateway;
    }
    async generateAnswer(req) {
        const answer = `Answer for: ${req.query}`;
        const metadata = {
            retrieverResources: { topK: req.inputs.contextCount, threshold: req.inputs.similarityThreshold },
            usage: { tokens: 42 },
        };
        return { answer, metadata };
    }
    async processBlocking(req) {
        const taskId = (0, crypto_1.randomUUID)();
        try {
            const { answer, metadata } = await this.generateAnswer(req);
            const id = (0, crypto_1.randomUUID)();
            return {
                event: 'message.completed',
                taskId,
                id,
                messageId: id,
                conversationId: req.conversationId,
                mode: 'chat',
                answer,
                metadata,
                created_at: new Date().toISOString(),
            };
        }
        catch (e) {
            return {
                event: 'error',
                error: {
                    status: 500,
                    code: 'INTERNAL_ERROR',
                    message: e?.message || 'Unknown error',
                },
                taskId,
            };
        }
    }
    async processStreaming(req) {
        const taskId = (0, crypto_1.randomUUID)();
        try {
            const chunks = [`Working on: ${req.query}`, ' ...', ' done.'];
            for (const chunk of chunks) {
                this.gateway.broadcast({
                    event: 'message',
                    taskId,
                    messageId: undefined,
                    conversationId: req.conversationId,
                    mode: 'chat',
                    answer: chunk,
                    metadata: {},
                    created_at: new Date().toISOString(),
                });
                await new Promise((r) => setTimeout(r, 150));
            }
            const { answer, metadata } = await this.generateAnswer(req);
            const id = (0, crypto_1.randomUUID)();
            this.gateway.broadcast({
                event: 'message_end',
                taskId,
                messageId: id,
                conversationId: req.conversationId,
                mode: 'chat',
                answer,
                metadata,
                created_at: new Date().toISOString(),
            });
            return { taskId };
        }
        catch (e) {
            this.gateway.broadcast({
                event: 'error',
                taskId,
                messageId: undefined,
                conversationId: req.conversationId,
                mode: 'chat',
                answer: '',
                status: 500,
                code: 'INTERNAL_ERROR',
                message: e?.message || 'Unknown error',
                created_at: new Date().toISOString(),
            });
            return { taskId };
        }
    }
};
exports.ChatMessagesService = ChatMessagesService;
exports.ChatMessagesService = ChatMessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_messages_gateway_1.ChatMessagesGateway])
], ChatMessagesService);
//# sourceMappingURL=chat-messages.service.js.map