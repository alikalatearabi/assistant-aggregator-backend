import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessagesService } from '../services/chat-messages.service';
export declare class ChatMessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatMessagesService;
    private readonly logger;
    server: Server;
    constructor(chatMessagesService: ChatMessagesService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleChatRequest(payload: any, client: Socket): Promise<{
        status: string;
    }>;
    broadcast(data: any): void;
}
