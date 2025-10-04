import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
export declare class MessageService {
    private messageModel;
    constructor(messageModel: Model<MessageDocument>);
    createMessage(createMessageDto: CreateMessageDto): Promise<Message>;
    findAllMessages(query?: MessageQueryDto): Promise<{
        messages: Message[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findMessageById(id: string): Promise<Message>;
    findMessagesByCategory(category: string): Promise<Message[]>;
    findMessagesByScoreRange(minScore: number, maxScore: number): Promise<Message[]>;
    findPositiveMessages(): Promise<Message[]>;
    findNegativeMessages(): Promise<Message[]>;
    findNeutralMessages(): Promise<Message[]>;
    updateMessage(id: string, updateMessageDto: UpdateMessageDto): Promise<Message>;
    deleteMessage(id: string): Promise<Message>;
    searchMessages(searchTerm: string): Promise<Message[]>;
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
    getMessagesByDateRange(startDate: Date, endDate: Date): Promise<Message[]>;
}
