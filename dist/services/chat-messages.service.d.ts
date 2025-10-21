import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatMessagesRequestDto } from '../dto/chat-messages.dto';
export declare class ChatMessagesService {
    private readonly gateway;
    private readonly logger;
    constructor(gateway: ChatMessagesGateway);
    private proxyToExternalApi;
    processBlocking(req: ChatMessagesRequestDto): Promise<any>;
    processStreaming(req: ChatMessagesRequestDto): Promise<{
        taskId: string;
    }>;
    private chunkText;
}
