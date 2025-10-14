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
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CreateChatDto } from '../dto/create-chat.dto';
import { UpdateChatDto } from '../dto/update-chat.dto';
import { ChatQueryDto } from '../dto/chat-query.dto';
import { AddMessageToChatDto } from '../dto/add-message-to-chat.dto';
import { Chat } from '../schemas/chat.schema';
import { ChatMessagesRequestDto, ChatMessageAnswerResponseDto, ChatMessagesResponseMode } from '../dto/chat-messages.dto';
import { ChatMessagesService } from '../services/chat-messages.service';

@ApiTags('chats')
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatMessagesService: ChatMessagesService,
  ) {}

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
    return this.chatService.createChat(createChatDto);
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
    return this.chatService.findAllChats(query);
  }

  @Get('stats')
  @ApiExcludeEndpoint()
  async getChatStats() {
    return this.chatService.getChatStats();
  }

  // Session-based search endpoint removed as session is no longer part of the schema

  @Get('user/:userId')
  @ApiExcludeEndpoint()
  async findChatsByUser(@Param('userId') userId: string): Promise<Chat[]> {
    return this.chatService.findChatsByUser(userId);
  }

  // Session-based retrieval endpoint removed

  @Get(':id')
  @ApiExcludeEndpoint()
  async findChatById(@Param('id') id: string): Promise<Chat> {
    return this.chatService.findChatById(id);
  }

  @Get(':id/messages')
  @ApiExcludeEndpoint()
  async getChatMessageHistory(@Param('id') id: string) {
    return this.chatService.getChatMessageHistory(id);
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
    return this.chatService.updateChat(id, updateChatDto);
  }

  @Patch(':id/add-message')
  @ApiExcludeEndpoint()
  async addMessageToChat(
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageToChatDto,
  ): Promise<Chat> {
    return this.chatService.addMessageToChat(id, addMessageDto.messageId);
  }

  @Patch(':id/remove-message/:messageId')
  @ApiExcludeEndpoint()
  async removeMessageFromChat(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ): Promise<Chat> {
    return this.chatService.removeMessageFromChat(id, messageId);
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
    return this.chatService.deleteChat(id);
  }

  @Post('chat-messages')
  @ApiOperation({
    summary: 'Generate chat messages',
    description: 'Generates a chat response. If responseMode is streaming, emits WS events; if blocking, returns a REST payload',
  })
  @ApiResponse({ status: 200, description: 'Blocking response', type: ChatMessageAnswerResponseDto })
  async chatMessages(
    @Body() body: ChatMessagesRequestDto,
  ): Promise<ChatMessageAnswerResponseDto | { taskId: string }> {
    if (body.responseMode === ChatMessagesResponseMode.STREAMING) {
      return this.chatMessagesService.processStreaming(body);
    }
    return this.chatMessagesService.processBlocking(body);
  }
}
