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
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_schema_1 = require("../schemas/message.schema");
let MessageService = class MessageService {
    messageModel;
    constructor(messageModel) {
        this.messageModel = messageModel;
    }
    async createMessage(createMessageDto) {
        if (createMessageDto.score < -1.0 || createMessageDto.score > 1.0) {
            throw new common_1.BadRequestException('Score must be between -1.0 and 1.0');
        }
        const createdMessage = new this.messageModel({
            ...createMessageDto,
            date: new Date(createMessageDto.date),
        });
        return createdMessage.save();
    }
    async findAllMessages(query = {}) {
        const { category, text, minScore, maxScore, dateFrom, dateTo, page = 1, limit = 10, } = query;
        const filter = {};
        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }
        if (text) {
            filter.text = { $regex: text, $options: 'i' };
        }
        if (minScore !== undefined || maxScore !== undefined) {
            filter.score = {};
            if (minScore !== undefined) {
                filter.score.$gte = minScore;
            }
            if (maxScore !== undefined) {
                filter.score.$lte = maxScore;
            }
        }
        if (dateFrom || dateTo) {
            filter.date = {};
            if (dateFrom) {
                filter.date.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                filter.date.$lte = new Date(dateTo);
            }
        }
        const skip = (page - 1) * limit;
        const total = await this.messageModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        const messages = await this.messageModel
            .find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return {
            messages,
            total,
            page,
            limit,
            totalPages,
        };
    }
    async findMessageById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid message ID');
        }
        const message = await this.messageModel.findById(id).exec();
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        return message;
    }
    async findMessagesByCategory(category) {
        return this.messageModel
            .find({ category: { $regex: category, $options: 'i' } })
            .sort({ date: -1 })
            .exec();
    }
    async findMessagesByScoreRange(minScore, maxScore) {
        if (minScore < -1.0 || minScore > 1.0 || maxScore < -1.0 || maxScore > 1.0) {
            throw new common_1.BadRequestException('Score values must be between -1.0 and 1.0');
        }
        if (minScore > maxScore) {
            throw new common_1.BadRequestException('Minimum score cannot be greater than maximum score');
        }
        return this.messageModel
            .find({
            score: {
                $gte: minScore,
                $lte: maxScore
            }
        })
            .sort({ date: -1 })
            .exec();
    }
    async findPositiveMessages() {
        return this.messageModel
            .find({ score: { $gt: 0 } })
            .sort({ score: -1 })
            .exec();
    }
    async findNegativeMessages() {
        return this.messageModel
            .find({ score: { $lt: 0 } })
            .sort({ score: 1 })
            .exec();
    }
    async findNeutralMessages() {
        return this.messageModel
            .find({ score: 0 })
            .sort({ date: -1 })
            .exec();
    }
    async updateMessage(id, updateMessageDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid message ID');
        }
        if (updateMessageDto.score !== undefined && (updateMessageDto.score < -1.0 || updateMessageDto.score > 1.0)) {
            throw new common_1.BadRequestException('Score must be between -1.0 and 1.0');
        }
        const updateData = { ...updateMessageDto };
        if (updateMessageDto.date) {
            updateData.date = new Date(updateMessageDto.date);
        }
        const message = await this.messageModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        return message;
    }
    async deleteMessage(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid message ID');
        }
        const message = await this.messageModel.findByIdAndDelete(id).exec();
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        return message;
    }
    async searchMessages(searchTerm) {
        const searchRegex = { $regex: searchTerm, $options: 'i' };
        return this.messageModel
            .find({
            $or: [
                { category: searchRegex },
                { text: searchRegex },
            ]
        })
            .sort({ date: -1 })
            .exec();
    }
    async getMessageStats() {
        const totalMessages = await this.messageModel.countDocuments();
        const messagesByCategory = await this.messageModel.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const averageScoreResult = await this.messageModel.aggregate([
            { $group: { _id: null, averageScore: { $avg: '$score' } } }
        ]);
        const averageScore = averageScoreResult[0]?.averageScore || 0;
        const positiveMessages = await this.messageModel.countDocuments({ score: { $gt: 0 } });
        const negativeMessages = await this.messageModel.countDocuments({ score: { $lt: 0 } });
        const neutralMessages = await this.messageModel.countDocuments({ score: 0 });
        const veryNegative = await this.messageModel.countDocuments({ score: { $gte: -1.0, $lt: -0.6 } });
        const negative = await this.messageModel.countDocuments({ score: { $gte: -0.6, $lt: -0.2 } });
        const neutral = await this.messageModel.countDocuments({ score: { $gte: -0.2, $lte: 0.2 } });
        const positive = await this.messageModel.countDocuments({ score: { $gt: 0.2, $lte: 0.6 } });
        const veryPositive = await this.messageModel.countDocuments({ score: { $gt: 0.6, $lte: 1.0 } });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentMessages = await this.messageModel.countDocuments({
            date: { $gte: sevenDaysAgo }
        });
        return {
            totalMessages,
            messagesByCategory,
            averageScore: Math.round(averageScore * 1000) / 1000,
            positiveMessages,
            negativeMessages,
            neutralMessages,
            scoreDistribution: {
                veryNegative,
                negative,
                neutral,
                positive,
                veryPositive,
            },
            recentMessages,
        };
    }
    async getMessagesByDateRange(startDate, endDate) {
        return this.messageModel
            .find({
            date: {
                $gte: startDate,
                $lte: endDate,
            }
        })
            .sort({ date: -1 })
            .exec();
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MessageService);
//# sourceMappingURL=message.service.js.map