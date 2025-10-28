import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessagesService } from '../services/chat-messages.service';
import { MessageService } from '../services/message.service';
import { ChatService } from '../services/chat.service';
export declare class ChatMessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatMessagesService;
    private readonly messageService;
    private readonly chatService;
    private readonly logger;
    server: Server;
    constructor(chatMessagesService: ChatMessagesService, messageService: MessageService, chatService: ChatService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleChatRequest(payload: any, client: Socket): Promise<{
        status: string;
    }>;
    broadcast(data: any): void;
}
