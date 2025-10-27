import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatMessagesRequestDto } from '../dto/chat-messages.dto';
import { Logger } from 'winston';
import { MessageService } from './message.service';
import { ChatService } from './chat.service';
export declare class ChatMessagesService {
    private readonly gateway;
    private readonly winstonLogger;
    private readonly messageService;
    private readonly chatService;
    private readonly logger;
    constructor(gateway: ChatMessagesGateway, winstonLogger: Logger, messageService: MessageService, chatService: ChatService);
    private proxyToExternalApi;
    processBlocking(req: ChatMessagesRequestDto): Promise<any>;
    processStreaming(req: ChatMessagesRequestDto): Promise<{
        taskId: string;
    }>;
    private chunkText;
}
