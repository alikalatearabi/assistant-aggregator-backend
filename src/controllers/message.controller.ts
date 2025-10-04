import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MessageService } from '../services/message.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { Message } from '../schemas/message.schema';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new message',
    description: 'Creates a new message with category, text, date, and sentiment score',
  })
  @ApiResponse({
    status: 201,
    description: 'Message created successfully',
    type: Message,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or score out of range',
  })
  async createMessage(@Body() createMessageDto: CreateMessageDto): Promise<Message> {
    return this.messageService.createMessage(createMessageDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all messages with pagination and filtering',
    description: 'Retrieves messages with optional filtering by category, text, score range, and date range',
  })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'text', required: false, description: 'Search in message text' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum score filter (-1.0 to 1.0)' })
  @ApiQuery({ name: 'maxScore', required: false, description: 'Maximum score filter (-1.0 to 1.0)' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  async findAllMessages(@Query() query: MessageQueryDto) {
    return this.messageService.findAllMessages(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get message statistics',
    description: 'Retrieves comprehensive statistics about messages including sentiment analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Message statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalMessages: { type: 'number', example: 150 },
        messagesByCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: 'support' },
              count: { type: 'number', example: 45 },
            },
          },
        },
        averageScore: { type: 'number', example: 0.234 },
        positiveMessages: { type: 'number', example: 80 },
        negativeMessages: { type: 'number', example: 30 },
        neutralMessages: { type: 'number', example: 40 },
        scoreDistribution: {
          type: 'object',
          properties: {
            veryNegative: { type: 'number', example: 5 },
            negative: { type: 'number', example: 25 },
            neutral: { type: 'number', example: 40 },
            positive: { type: 'number', example: 60 },
            veryPositive: { type: 'number', example: 20 },
          },
        },
        recentMessages: { type: 'number', example: 12 },
      },
    },
  })
  async getMessageStats() {
    return this.messageService.getMessageStats();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search messages',
    description: 'Search messages by category or text content',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [Message],
  })
  async searchMessages(@Query('q') searchTerm: string): Promise<Message[]> {
    return this.messageService.searchMessages(searchTerm);
  }

  @Get('positive')
  @ApiOperation({
    summary: 'Get positive messages',
    description: 'Retrieves all messages with positive sentiment scores (> 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Positive messages retrieved successfully',
    type: [Message],
  })
  async findPositiveMessages(): Promise<Message[]> {
    return this.messageService.findPositiveMessages();
  }

  @Get('negative')
  @ApiOperation({
    summary: 'Get negative messages',
    description: 'Retrieves all messages with negative sentiment scores (< 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Negative messages retrieved successfully',
    type: [Message],
  })
  async findNegativeMessages(): Promise<Message[]> {
    return this.messageService.findNegativeMessages();
  }

  @Get('neutral')
  @ApiOperation({
    summary: 'Get neutral messages',
    description: 'Retrieves all messages with neutral sentiment scores (= 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Neutral messages retrieved successfully',
    type: [Message],
  })
  async findNeutralMessages(): Promise<Message[]> {
    return this.messageService.findNeutralMessages();
  }

  @Get('category/:category')
  @ApiOperation({
    summary: 'Get messages by category',
    description: 'Retrieves all messages in a specific category',
  })
  @ApiParam({
    name: 'category',
    description: 'Message category',
    example: 'support',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: [Message],
  })
  async findMessagesByCategory(@Param('category') category: string): Promise<Message[]> {
    return this.messageService.findMessagesByCategory(category);
  }

  @Get('score-range')
  @ApiOperation({
    summary: 'Get messages by score range',
    description: 'Retrieves messages within a specified sentiment score range',
  })
  @ApiQuery({ name: 'min', required: true, description: 'Minimum score (-1.0 to 1.0)' })
  @ApiQuery({ name: 'max', required: true, description: 'Maximum score (-1.0 to 1.0)' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: [Message],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid score range',
  })
  async findMessagesByScoreRange(
    @Query('min') minScore: number,
    @Query('max') maxScore: number,
  ): Promise<Message[]> {
    return this.messageService.findMessagesByScoreRange(+minScore, +maxScore);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get message by ID',
    description: 'Retrieves a specific message by its MongoDB ObjectId',
  })
  @ApiParam({
    name: 'id',
    description: 'Message MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Message found successfully',
    type: Message,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid message ID',
  })
  async findMessageById(@Param('id') id: string): Promise<Message> {
    return this.messageService.findMessageById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update message',
    description: 'Updates message information with the provided data',
  })
  @ApiParam({
    name: 'id',
    description: 'Message MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Message updated successfully',
    type: Message,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or score out of range',
  })
  async updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    return this.messageService.updateMessage(id, updateMessageDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete message',
    description: 'Permanently removes a message from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'Message MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    type: Message,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid message ID',
  })
  async deleteMessage(@Param('id') id: string): Promise<Message> {
    return this.messageService.deleteMessage(id);
  }
}
