import { MessageService } from '../services/message.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { Message } from '../schemas/message.schema';
export declare class MessageController {
    private readonly messageService;
    constructor(messageService: MessageService);
    createMessage(createMessageDto: CreateMessageDto): Promise<Message>;
    findAllMessages(query: MessageQueryDto): Promise<{
        messages: Message[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getMessageStats(): Promise<{
        totalMessages: number;
        messagesByCategory: Array<{
            _id: string;
            count: number;
        }>;
        averageScore: number;
        positiveMessages: number;
        negativeMessages: number;
        neutralMessages: number;
        scoreDistribution: {
            veryNegative: number;
            negative: number;
            neutral: number;
            positive: number;
            veryPositive: number;
        };
        recentMessages: number;
    }>;
    searchMessages(searchTerm: string): Promise<Message[]>;
    findPositiveMessages(): Promise<Message[]>;
    findNegativeMessages(): Promise<Message[]>;
    findNeutralMessages(): Promise<Message[]>;
    findMessagesByCategory(category: string): Promise<Message[]>;
    findMessagesByScoreRange(minScore: number, maxScore: number): Promise<Message[]>;
    findMessageById(id: string): Promise<Message>;
    updateMessage(id: string, updateMessageDto: UpdateMessageDto): Promise<Message>;
    deleteMessage(id: string): Promise<Message>;
}
