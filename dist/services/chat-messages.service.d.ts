import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatService } from './chat.service';
import { ChatMessagesRequestDto, ChatMessageAnswerResponseDto, ChatMessagesErrorDto } from '../dto/chat-messages.dto';
export declare class ChatMessagesService {
    private readonly gateway;
    private readonly chatService;
    constructor(gateway: ChatMessagesGateway, chatService: ChatService);
    private generateAnswer;
    processBlocking(req: ChatMessagesRequestDto): Promise<ChatMessageAnswerResponseDto | {
        event: 'error';
        error: ChatMessagesErrorDto;
        taskId: string;
    }>;
    processStreaming(req: ChatMessagesRequestDto): Promise<{
        taskId: string;
    }>;
}
