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
var ChatMessagesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessagesGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let ChatMessagesGateway = ChatMessagesGateway_1 = class ChatMessagesGateway {
    logger = new common_1.Logger(ChatMessagesGateway_1.name);
    server;
    handleConnection(client) {
        this.logger.log(`Client connected to chat-messages WS: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from chat-messages WS: ${client.id}`);
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
exports.ChatMessagesGateway = ChatMessagesGateway = ChatMessagesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/chat-messages', cors: true })
], ChatMessagesGateway);
//# sourceMappingURL=chat-messages.gateway.js.map