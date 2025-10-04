import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from '../schemas/chat.schema';
import { CreateChatDto } from '../dto/create-chat.dto';
import { UpdateChatDto } from '../dto/update-chat.dto';
import { ChatQueryDto } from '../dto/chat-query.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async createChat(createChatDto: CreateChatDto): Promise<Chat> {
    // Validate user ID
    if (!Types.ObjectId.isValid(createChatDto.user.toString())) {
      throw new BadRequestException('Invalid user ID');
    }

    // Validate message IDs if provided
    if (createChatDto.messageHistory) {
      for (const messageId of createChatDto.messageHistory) {
        if (!Types.ObjectId.isValid(messageId.toString())) {
          throw new BadRequestException(`Invalid message ID: ${messageId}`);
        }
      }
    }

    const createdChat = new this.chatModel({
      ...createChatDto,
      user: new Types.ObjectId(createChatDto.user.toString()),
      messageHistory: createChatDto.messageHistory?.map(id => new Types.ObjectId(id.toString())) || [],
    });
    
    return createdChat.save();
  }

  async findAllChats(query: ChatQueryDto = {}): Promise<{
    chats: Chat[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      session,
      user,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = query;

    // Build filter object
    const filter: any = {};
    
    if (session) {
      filter.session = { $regex: session, $options: 'i' };
    }
    
    if (user && Types.ObjectId.isValid(user)) {
      filter.user = new Types.ObjectId(user);
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await this.chatModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const chats = await this.chatModel
      .find(filter)
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      chats,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findChatById(id: string): Promise<Chat> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat ID');
    }

    const chat = await this.chatModel
      .findById(id)
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .exec();
    
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    
    return chat;
  }

  async findChatsByUser(userId: string): Promise<Chat[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.chatModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findChatBySession(session: string): Promise<Chat | null> {
    return this.chatModel
      .findOne({ session })
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .exec();
  }

  async updateChat(id: string, updateChatDto: UpdateChatDto): Promise<Chat> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat ID');
    }

    // Validate user ID if provided
    if (updateChatDto.user && !Types.ObjectId.isValid(updateChatDto.user.toString())) {
      throw new BadRequestException('Invalid user ID');
    }

    // Validate message IDs if provided
    if (updateChatDto.messageHistory) {
      for (const messageId of updateChatDto.messageHistory) {
        if (!Types.ObjectId.isValid(messageId.toString())) {
          throw new BadRequestException(`Invalid message ID: ${messageId}`);
        }
      }
    }

    const updateData: any = { ...updateChatDto };
    if (updateChatDto.user) {
      updateData.user = new Types.ObjectId(updateChatDto.user.toString());
    }
    if (updateChatDto.messageHistory) {
      updateData.messageHistory = updateChatDto.messageHistory.map(id => new Types.ObjectId(id.toString()));
    }

    const chat = await this.chatModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .exec();
    
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    
    return chat;
  }

  async deleteChat(id: string): Promise<Chat> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chat ID');
    }

    const chat = await this.chatModel
      .findByIdAndDelete(id)
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .exec();
    
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    
    return chat;
  }

  async addMessageToChat(chatId: string, messageId: string): Promise<Chat> {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat ID');
    }

    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID');
    }

    const chat = await this.chatModel
      .findByIdAndUpdate(
        chatId,
        { $addToSet: { messageHistory: new Types.ObjectId(messageId) } },
        { new: true }
      )
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .exec();
    
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    
    return chat;
  }

  async removeMessageFromChat(chatId: string, messageId: string): Promise<Chat> {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat ID');
    }

    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID');
    }

    const chat = await this.chatModel
      .findByIdAndUpdate(
        chatId,
        { $pull: { messageHistory: new Types.ObjectId(messageId) } },
        { new: true }
      )
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .exec();
    
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    
    return chat;
  }

  async searchChats(searchTerm: string): Promise<Chat[]> {
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    
    return this.chatModel
      .find({
        session: searchRegex
      })
      .populate('user', 'firstname lastname email')
      .populate({
        path: 'messageHistory',
        select: 'category text date score',
        options: { sort: { date: 1 } }
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getChatStats(): Promise<{
    totalChats: number;
    chatsByUser: Array<{ _id: string; count: number }>;
    averageMessagesPerChat: number;
    recentChats: number;
    activeSessions: number;
  }> {
    const totalChats = await this.chatModel.countDocuments();
    
    const chatsByUser = await this.chatModel.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const averageMessagesResult = await this.chatModel.aggregate([
      { $project: { messageCount: { $size: '$messageHistory' } } },
      { $group: { _id: null, averageMessages: { $avg: '$messageCount' } } }
    ]);
    const averageMessagesPerChat = averageMessagesResult[0]?.averageMessages || 0;

    // Recent chats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentChats = await this.chatModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Active sessions (chats with at least one message)
    const activeSessions = await this.chatModel.countDocuments({
      messageHistory: { $exists: true, $not: { $size: 0 } }
    });

    return {
      totalChats,
      chatsByUser,
      averageMessagesPerChat: Math.round(averageMessagesPerChat * 100) / 100,
      recentChats,
      activeSessions,
    };
  }

  async getChatMessageHistory(chatId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat ID');
    }

    const chat = await this.chatModel
      .findById(chatId)
      .populate({
        path: 'messageHistory',
        select: 'category text date score createdAt',
        options: { sort: { date: 1 } }
      })
      .exec();
    
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    
    return chat.messageHistory as any[];
  }
}
