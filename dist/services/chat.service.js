"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("../schemas/chat.schema");
let ChatService = class ChatService {
    chatModel;
    constructor(chatModel) {
        this.chatModel = chatModel;
    }
    async createChat(createChatDto) {
        if (!mongoose_2.Types.ObjectId.isValid(createChatDto.user.toString())) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        if (createChatDto.conversationHistory) {
            for (const messageId of createChatDto.conversationHistory) {
                if (!mongoose_2.Types.ObjectId.isValid(messageId.toString())) {
                    throw new common_1.BadRequestException(`Invalid message ID: ${messageId}`);
                }
            }
        }
        const createdChat = new this.chatModel({
            ...createChatDto,
            user: new mongoose_2.Types.ObjectId(createChatDto.user.toString()),
            title: createChatDto.title || 'گفتگوی جدید',
            conversationHistory: createChatDto.conversationHistory?.map(id => new mongoose_2.Types.ObjectId(id.toString())) || [],
        });
        return createdChat.save();
    }
    async findAllChats(query = {}) {
        const { user, dateFrom, dateTo, page = 1, limit = 10, } = query;
        const filter = {};
        if (user && mongoose_2.Types.ObjectId.isValid(user)) {
            filter.user = new mongoose_2.Types.ObjectId(user);
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
        const skip = (page - 1) * limit;
        const total = await this.chatModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        const chats = await this.chatModel
            .find(filter)
            .populate('user', 'firstname lastname email')
            .populate({
            path: 'conversationHistory',
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
    async findChatById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid chat ID');
        }
        const chat = await this.chatModel
            .findById(id)
            .populate('user', 'firstname lastname email')
            .populate({
            path: 'conversationHistory',
            select: 'category text date score',
            options: { sort: { date: 1 } }
        })
            .exec();
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        return chat;
    }
    async findChatsByUser(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        return this.chatModel
            .find({ user: new mongoose_2.Types.ObjectId(userId) })
            .populate('user', 'firstname lastname email')
            .populate({
            path: 'conversationHistory',
            select: 'category text date score',
            options: { sort: { date: 1 } }
        })
            .sort({ createdAt: -1 })
            .exec();
    }
    async updateChat(id, updateChatDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid chat ID');
        }
        if (updateChatDto.user && !mongoose_2.Types.ObjectId.isValid(updateChatDto.user.toString())) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        if (updateChatDto.conversationHistory) {
            for (const messageId of updateChatDto.conversationHistory) {
                if (!mongoose_2.Types.ObjectId.isValid(messageId.toString())) {
                    throw new common_1.BadRequestException(`Invalid message ID: ${messageId}`);
                }
            }
        }
        const updateData = { ...updateChatDto };
        if (updateChatDto.user) {
            updateData.user = new mongoose_2.Types.ObjectId(updateChatDto.user.toString());
        }
        if (updateChatDto.conversationHistory) {
            updateData.conversationHistory = updateChatDto.conversationHistory.map(id => new mongoose_2.Types.ObjectId(id.toString()));
        }
        const chat = await this.chatModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('user', 'firstname lastname email')
            .populate({
            path: 'conversationHistory',
            select: 'category text date score',
            options: { sort: { date: 1 } }
        })
            .exec();
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        return chat;
    }
    async deleteChat(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid chat ID');
        }
        const chat = await this.chatModel
            .findByIdAndDelete(id)
            .populate('user', 'firstname lastname email')
            .populate({
            path: 'conversationHistory',
            select: 'category text date score',
            options: { sort: { date: 1 } }
        })
            .exec();
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        return chat;
    }
    async addMessageToChat(chatId, messageId) {
        if (!mongoose_2.Types.ObjectId.isValid(chatId)) {
            throw new common_1.BadRequestException('Invalid chat ID');
        }
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.BadRequestException('Invalid message ID');
        }
        const chat = await this.chatModel
            .findByIdAndUpdate(chatId, { $addToSet: { conversationHistory: new mongoose_2.Types.ObjectId(messageId) } }, { new: true })
            .populate('user', 'firstname lastname email')
            .populate({
            path: 'conversationHistory',
            select: 'category text date score',
            options: { sort: { date: 1 } }
        })
            .exec();
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        return chat;
    }
    async removeMessageFromChat(chatId, messageId) {
        if (!mongoose_2.Types.ObjectId.isValid(chatId)) {
            throw new common_1.BadRequestException('Invalid chat ID');
        }
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.BadRequestException('Invalid message ID');
        }
        const chat = await this.chatModel
            .findByIdAndUpdate(chatId, { $pull: { conversationHistory: new mongoose_2.Types.ObjectId(messageId) } }, { new: true })
            .populate('user', 'firstname lastname email')
            .populate({
            path: 'conversationHistory',
            select: 'category text date score',
            options: { sort: { date: 1 } }
        })
            .exec();
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        return chat;
    }
    async searchChats(searchTerm) {
        const searchRegex = { $regex: searchTerm, $options: 'i' };
        return this.chatModel
            .find({})
            .populate('user', 'firstname lastname email')
            .populate({
            path: 'conversationHistory',
            select: 'category text date score',
            options: { sort: { date: 1 } }
        })
            .sort({ createdAt: -1 })
            .exec();
    }
    async getChatStats() {
        const totalChats = await this.chatModel.countDocuments();
        const chatsByUser = await this.chatModel.aggregate([
            { $group: { _id: '$user', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const averageMessagesResult = await this.chatModel.aggregate([
            { $project: { messageCount: { $size: '$conversationHistory' } } },
            { $group: { _id: null, averageMessages: { $avg: '$messageCount' } } }
        ]);
        const averageMessagesPerChat = averageMessagesResult[0]?.averageMessages || 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentChats = await this.chatModel.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const activeSessions = await this.chatModel.countDocuments({
            conversationHistory: { $exists: true, $not: { $size: 0 } }
        });
        return {
            totalChats,
            chatsByUser,
            averageMessagesPerChat: Math.round(averageMessagesPerChat * 100) / 100,
            recentChats,
            activeSessions,
        };
    }
    async getChatMessageHistory(chatId) {
        if (!mongoose_2.Types.ObjectId.isValid(chatId)) {
            throw new common_1.BadRequestException('Invalid chat ID');
        }
        const chat = await this.chatModel
            .findById(chatId)
            .populate({
            path: 'conversationHistory',
            select: 'category text date score createdAt',
            options: { sort: { date: 1 } }
        })
            .exec();
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        return chat.conversationHistory;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_schema_1.Chat.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ChatService);
//# sourceMappingURL=chat.service.js.map