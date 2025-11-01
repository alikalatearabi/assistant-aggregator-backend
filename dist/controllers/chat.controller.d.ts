import type { Response as ExpressResponse } from 'express';
import { ChatService } from '../services/chat.service';
import { CreateChatDto } from '../dto/create-chat.dto';
import { UpdateChatDto } from '../dto/update-chat.dto';
import { ChatQueryDto } from '../dto/chat-query.dto';
import { AddMessageToChatDto } from '../dto/add-message-to-chat.dto';
import { Chat } from '../schemas/chat.schema';
import { ChatMessagesRequestDto } from '../dto/chat-messages.dto';
import { ChatMessagesService } from '../services/chat-messages.service';
import { MessageService } from '../services/message.service';
import { UsersService } from '../users/users.service';
export declare class ChatController {
    private readonly chatService;
    private readonly chatMessagesService;
    private readonly messageService;
    private readonly usersService;
    constructor(chatService: ChatService, chatMessagesService: ChatMessagesService, messageService: MessageService, usersService: UsersService);
    createChat(createChatDto: CreateChatDto): Promise<Chat>;
    findAllChats(query: ChatQueryDto): Promise<{
        chats: Chat[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
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
    findChatsByUser(userId: string): Promise<Chat[]>;
    findChatById(id: string, userId: string): Promise<Chat>;
    getChatMessageHistory(id: string): Promise<any[]>;
    updateChat(id: string, updateChatDto: UpdateChatDto): Promise<Chat>;
    addMessageToChat(id: string, addMessageDto: AddMessageToChatDto): Promise<Chat>;
    removeMessageFromChat(id: string, messageId: string): Promise<Chat>;
    deleteChat(id: string): Promise<Chat>;
    chatMessages(body: ChatMessagesRequestDto, req: any, res: ExpressResponse): Promise<void>;
    testErrors(body: {
        errorType?: string;
    }, res: ExpressResponse): Promise<void>;
}
