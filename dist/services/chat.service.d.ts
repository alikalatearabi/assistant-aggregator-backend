import { Model } from 'mongoose';
import { Chat, ChatDocument } from '../schemas/chat.schema';
import { CreateChatDto } from '../dto/create-chat.dto';
import { UpdateChatDto } from '../dto/update-chat.dto';
import { ChatQueryDto } from '../dto/chat-query.dto';
export declare class ChatService {
    private chatModel;
    constructor(chatModel: Model<ChatDocument>);
    createChat(createChatDto: CreateChatDto): Promise<Chat>;
    findAllChats(query?: ChatQueryDto): Promise<{
        chats: Chat[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findChatById(id: string): Promise<Chat>;
    findChatsByUser(userId: string): Promise<Chat[]>;
    updateChat(id: string, updateChatDto: UpdateChatDto): Promise<Chat>;
    deleteChat(id: string): Promise<Chat>;
    addMessageToChat(chatId: string, messageId: string): Promise<Chat>;
    removeMessageFromChat(chatId: string, messageId: string): Promise<Chat>;
    searchChats(searchTerm: string): Promise<Chat[]>;
    getChatStats(): Promise<{
        totalChats: number;
        chatsByUser: Array<{
            _id: string;
            count: number;
        }>;
        averageMessagesPerChat: number;
        recentChats: number;
        activeSessions: number;
    }>;
    getChatMessageHistory(chatId: string): Promise<any[]>;
}
