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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessagesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const chat_messages_gateway_1 = require("../gateways/chat-messages.gateway");
const axios_1 = __importDefault(require("axios"));
let ChatMessagesService = class ChatMessagesService {
    gateway;
    constructor(gateway) {
        this.gateway = gateway;
    }
    async proxyToExternalApi(req) {
        const loginUrl = 'https://test1.nlp-lab.ir/auth/login';
        const username = 'kalate';
        const password = '12';
        const loginData = `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&scope=&client_id=&client_secret=`;
        const loginHeaders = {
            'accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        let token;
        try {
            const loginResp = await axios_1.default.post(loginUrl, loginData, { headers: loginHeaders });
            token = loginResp.data.access_token;
        }
        catch (err) {
            return {
                event: 'error',
                error: {
                    status: err?.response?.status || 500,
                    code: 'LOGIN_ERROR',
                    message: err?.response?.data?.detail || err?.message || 'Login failed',
                },
                taskId: (0, crypto_1.randomUUID)(),
            };
        }
        const chatUrl = 'https://test1.nlp-lab.ir/chat/';
        const chatPayload = {
            query: req.query,
            inputs: {
                similarity_threshold: req.inputs.similarityThreshold,
                context_count: req.inputs.contextCount,
            },
            conversation_id: req.conversationId || '',
            prior_messages: req.priorMessages || [],
        };
        const chatHeaders = {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
        try {
            const chatResp = await axios_1.default.post(chatUrl, chatPayload, { headers: chatHeaders });
            return chatResp.data;
        }
        catch (err) {
            return {
                event: 'error',
                error: {
                    status: err?.response?.status || 500,
                    code: 'CHAT_ERROR',
                    message: err?.response?.data?.detail || err?.message || 'Chat API failed',
                },
                taskId: (0, crypto_1.randomUUID)(),
            };
        }
    }
    async processBlocking(req) {
        return await this.proxyToExternalApi(req);
    }
    async processStreaming(req) {
        const taskId = (0, crypto_1.randomUUID)();
        const result = await this.proxyToExternalApi(req);
        if (result && typeof result === 'object' && 'event' in result && result.event === 'error') {
            this.gateway.broadcast({
                event: 'error',
                taskId,
                conversation_id: req.conversationId || 'unknown',
                answer: '',
                status: result.error.status,
                code: result.error.code,
                message: result.error.message,
                created_at: new Date().toISOString(),
            });
        }
        else {
            const answer = result.answer;
            const chunks = this.chunkText(answer, 20);
            this.gateway.broadcast({
                event: 'message_start',
                taskId,
                conversation_id: result.conversation_id,
                metadata: result.metadata,
                created_at: new Date().toISOString(),
            });
            for (let i = 0; i < chunks.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 150));
                this.gateway.broadcast({
                    event: 'message_chunk',
                    taskId,
                    conversation_id: result.conversation_id,
                    chunk: chunks[i],
                    created_at: new Date().toISOString(),
                });
            }
            this.gateway.broadcast({
                event: 'message_end',
                taskId,
                conversation_id: result.conversation_id,
                history: result.history,
                created_at: new Date().toISOString(),
            });
        }
        return { taskId };
    }
    chunkText(text, chunkSize) {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    }
};
exports.ChatMessagesService = ChatMessagesService;
exports.ChatMessagesService = ChatMessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_messages_gateway_1.ChatMessagesGateway])
], ChatMessagesService);
//# sourceMappingURL=chat-messages.service.js.map