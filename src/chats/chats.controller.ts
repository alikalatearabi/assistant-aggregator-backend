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
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatQueryDto } from './dto/chat-query.dto';
import { AddMessageToChatDto } from './dto/add-message-to-chat.dto';
import { Chat } from './schemas/chat.schema';

@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new chat session',
    description: 'Creates a new chat session with user reference and optional initial message history',
  })
  @ApiResponse({
    status: 201,
    description: 'Chat created successfully',
    type: Chat,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  async createChat(@Body() createChatDto: CreateChatDto): Promise<Chat> {
    return this.chatsService.createChat(createChatDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all chats with pagination and filtering',
    description: 'Retrieves chats with optional filtering by user and date range',
  })
  @ApiQuery({ name: 'user', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Chats retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        chats: { type: 'array', items: { $ref: '#/components/schemas/Chat' } },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  async findAllChats(@Query() query: ChatQueryDto) {
    return this.chatsService.findAllChats(query);
  }

  @Get('stats')
  @ApiExcludeEndpoint()
  async getChatStats() {
    return this.chatsService.getChatStats();
  }

  @Get('user/:userId')
  @ApiExcludeEndpoint()
  async findChatsByUser(@Param('userId') userId: string): Promise<Chat[]> {
    return this.chatsService.findChatsByUser(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific chat by ID',
    description: 'Retrieves a single chat with full conversation history including retriever resources',
  })
  @ApiParam({ name: 'id', description: 'Chat ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'user', required: true, description: 'User ID to verify ownership', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({
    status: 200,
    description: 'Chat retrieved successfully',
    type: Chat,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found or user does not have access to this chat',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid chat ID or user ID',
  })
  async findChatById(
    @Param('id') id: string,
    @Query('user') userId: string
  ): Promise<Chat> {
    return this.chatsService.findChatById(id, userId);
  }

  @Get(':id/messages')
  @ApiExcludeEndpoint()
  async getChatMessageHistory(@Param('id') id: string) {
    return this.chatsService.getChatMessageHistory(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update chat',
    description: 'Updates chat information with the provided data',
  })
  @ApiParam({
    name: 'id',
    description: 'Chat MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat updated successfully',
    type: Chat,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  async updateChat(
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
  ): Promise<Chat> {
    return this.chatsService.updateChat(id, updateChatDto);
  }

  @Patch(':id/add-message')
  @ApiExcludeEndpoint()
  async addMessageToChat(
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageToChatDto,
  ): Promise<Chat> {
    return this.chatsService.addMessageToChat(id, addMessageDto.messageId);
  }

  @Patch(':id/remove-message/:messageId')
  @ApiExcludeEndpoint()
  async removeMessageFromChat(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ): Promise<Chat> {
    return this.chatsService.removeMessageFromChat(id, messageId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete chat',
    description: 'Permanently removes a chat session from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'Chat MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully',
    type: Chat,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid chat ID',
  })
  async deleteChat(@Param('id') id: string): Promise<Chat> {
    return this.chatsService.deleteChat(id);
  }
}

