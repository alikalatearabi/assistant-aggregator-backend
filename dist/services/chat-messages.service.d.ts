import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatMessagesRequestDto, ChatMessagesResponseDto, ChatMessagesErrorDto } from '../dto/chat-messages.dto';
export declare class ChatMessagesService {
    private readonly gateway;
    constructor(gateway: ChatMessagesGateway);
    private generateAnswer;
    processBlocking(req: ChatMessagesRequestDto): Promise<ChatMessagesResponseDto | {
        event: 'error';
        error: ChatMessagesErrorDto;
        taskId: string;
    }>;
    processStreaming(req: ChatMessagesRequestDto): Promise<{
        taskId: string;
    }>;
}
