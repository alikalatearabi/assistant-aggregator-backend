import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    if (createMessageDto.score < -1.0 || createMessageDto.score > 1.0) {
      throw new BadRequestException('Score must be between -1.0 and 1.0');
    }

    const createdMessage = new this.messageModel({
      ...createMessageDto,
      date: new Date(createMessageDto.date),
    });
    
    return createdMessage.save();
  }

  async findAllMessages(query: MessageQueryDto = {}): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      category,
      text,
      minScore,
      maxScore,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = query;

    // Build filter object
    const filter: any = {};
    
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

    // Calculate pagination
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

  async findMessageById(id: string): Promise<Message> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel.findById(id).exec();
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    
    return message;
  }

  async findMessagesByCategory(category: string): Promise<Message[]> {
    return this.messageModel
      .find({ category: { $regex: category, $options: 'i' } })
      .sort({ date: -1 })
      .exec();
  }

  async findMessagesByScoreRange(minScore: number, maxScore: number): Promise<Message[]> {
    if (minScore < -1.0 || minScore > 1.0 || maxScore < -1.0 || maxScore > 1.0) {
      throw new BadRequestException('Score values must be between -1.0 and 1.0');
    }

    if (minScore > maxScore) {
      throw new BadRequestException('Minimum score cannot be greater than maximum score');
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

  async findPositiveMessages(): Promise<Message[]> {
    return this.messageModel
      .find({ score: { $gt: 0 } })
      .sort({ score: -1 })
      .exec();
  }

  async findNegativeMessages(): Promise<Message[]> {
    return this.messageModel
      .find({ score: { $lt: 0 } })
      .sort({ score: 1 })
      .exec();
  }

  async findNeutralMessages(): Promise<Message[]> {
    return this.messageModel
      .find({ score: 0 })
      .sort({ date: -1 })
      .exec();
  }

  async updateMessage(id: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message ID');
    }

    // Validate score range if provided
    if (updateMessageDto.score !== undefined && (updateMessageDto.score < -1.0 || updateMessageDto.score > 1.0)) {
      throw new BadRequestException('Score must be between -1.0 and 1.0');
    }

    const updateData: any = { ...updateMessageDto };
    if (updateMessageDto.date) {
      updateData.date = new Date(updateMessageDto.date);
    }

    const message = await this.messageModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    
    return message;
  }

  async deleteMessage(id: string): Promise<Message> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel.findByIdAndDelete(id).exec();
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    
    return message;
  }

  async searchMessages(searchTerm: string): Promise<Message[]> {
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

  async getMessageStats(): Promise<{
    totalMessages: number;
    messagesByCategory: Array<{ _id: string; count: number }>;
    averageScore: number;
    positiveMessages: number;
    negativeMessages: number;
    neutralMessages: number;
    scoreDistribution: {
      veryNegative: number; // -1.0 to -0.6
      negative: number;     // -0.6 to -0.2
      neutral: number;      // -0.2 to 0.2
      positive: number;     // 0.2 to 0.6
      veryPositive: number; // 0.6 to 1.0
    };
    recentMessages: number;
  }> {
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

    // Score distribution
    const veryNegative = await this.messageModel.countDocuments({ score: { $gte: -1.0, $lt: -0.6 } });
    const negative = await this.messageModel.countDocuments({ score: { $gte: -0.6, $lt: -0.2 } });
    const neutral = await this.messageModel.countDocuments({ score: { $gte: -0.2, $lte: 0.2 } });
    const positive = await this.messageModel.countDocuments({ score: { $gt: 0.2, $lte: 0.6 } });
    const veryPositive = await this.messageModel.countDocuments({ score: { $gt: 0.6, $lte: 1.0 } });

    // Recent messages (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMessages = await this.messageModel.countDocuments({
      date: { $gte: sevenDaysAgo }
    });

    return {
      totalMessages,
      messagesByCategory,
      averageScore: Math.round(averageScore * 1000) / 1000, // Round to 3 decimal places
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

  async getMessagesByDateRange(startDate: Date, endDate: Date): Promise<Message[]> {
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
}

