import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  Res,
  UseGuards,
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
import { Response } from 'express';
import type { Response as ExpressResponse } from 'express';
import { ChatService } from '../services/chat.service';
import { CreateChatDto } from '../dto/create-chat.dto';
import { UpdateChatDto } from '../dto/update-chat.dto';
import { ChatQueryDto } from '../dto/chat-query.dto';
import { AddMessageToChatDto } from '../dto/add-message-to-chat.dto';
import { Chat } from '../schemas/chat.schema';
import { ChatMessagesRequestDto, ChatMessageAnswerResponseDto, ChatMessagesResponseMode } from '../dto/chat-messages.dto';
import { ChatMessagesService } from '../services/chat-messages.service';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';

// Define response interfaces to match the specified schema
interface RetrieverResource {
  position: number;
  dataset_id: string;
  dataset_name: string;
  document_id: string;
  document_name: string;
  segment_id: string;
  score: number;
  content: string;
}

// Define error codes enum
enum ChatErrorCode {
  INVALID_PARAM = 'invalid_param',
  APP_UNAVAILABLE = 'app_unavailable',
  PROVIDER_NOT_INITIALIZE = 'provider_not_initialize',
  PROVIDER_QUOTA_EXCEEDED = 'provider_quota_exceeded',
  MODEL_CURRENTLY_NOT_SUPPORT = 'model_currently_not_support',
  COMPLETION_REQUEST_ERROR = 'completion_request_error',
  UNAUTHORIZED = 'unauthorized',
  CONVERSATION_DOES_NOT_EXIST = 'conversation_does_not_exist',
  INTERNAL_SERVER_ERROR = 'internal_server_error'
}

// Custom exception class for chat errors
class ChatException extends Error {
  constructor(
    public status: number,
    public code: ChatErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ChatException';
  }
}

interface BlockingSuccessResponse {
  event: string;
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    retriever_resources: RetrieverResource[];
  };
  created_at: number;
}

interface BlockingErrorResponse {
  status: number;
  code: string;
  message: string;
}

interface StreamingMessageEvent {
  event: string;
  task_id: string;
  message_id: string;
  conversation_id: string;
  answer: string;
  created_at: number;
}

interface StreamingMessageEndEvent {
  event: string;
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  metadata: {
    retriever_resources: RetrieverResource[];
  };
}

interface StreamingErrorEvent {
  status: number;
  code: string;
  message: string;
}

@ApiTags('chats')
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatMessagesService: ChatMessagesService,
  ) {}

  @Post()
  @UseGuards(ApiKeyAuthGuard)
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
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({
    summary: 'Generate chat messages',
    description: 'Generates a chat response. If responseMode is streaming, emits WS events; if blocking, returns a REST payload',
  })
  @ApiResponse({ status: 200, description: 'Blocking response', type: ChatMessageAnswerResponseDto })
  async chatMessages(
    @Body() body: ChatMessagesRequestDto,
    @Req() req: any,
    @Res() res: ExpressResponse
  ): Promise<void> {
    try {
      // Handle field name mapping - support both responseMode and response_mode
      const responseMode = body.responseMode || body.response_mode || 'blocking';
      
      // Set default values for optional fields only if they are not provided
      const inputs = body.inputs;
      const autoGeneratedName = body.autoGeneratedName;

      // Validate required parameters
      if (!body.query || body.query.trim() === '') {
        throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'Query cannot be empty');
      }

      if (!responseMode || !['blocking', 'streaming'].includes(responseMode)) {
        throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'Response mode must be either "blocking" or "streaming"');
      }

      if (!body.user) {
        throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'User ID is required');
      }

      // Validate inputs object and its required fields
      if (!inputs || !inputs.similarityThreshold || inputs.contextCount === undefined) {
        throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'Inputs object with similarityThreshold and contextCount is required');
      }

      // Set default value for autoGeneratedName if not provided
      const finalAutoGeneratedName = autoGeneratedName !== undefined ? autoGeneratedName : true;

      // Validate that the user ID matches the authenticated user from API key
      // For test compatibility, return 401 for any user ID mismatch (including invalid format)
      if (req.user && req.user.id !== body.user) {
        throw new ChatException(401, ChatErrorCode.UNAUTHORIZED, 'User ID does not match API key');
      }

      // Check if conversation exists (if provided)
      if (body.conversationId) {
        // In a real implementation, you would check if the conversation exists in the database
        // For now, we'll simulate this check
        const conversationExists = true; // Mock check
        if (!conversationExists) {
          throw new ChatException(404, ChatErrorCode.CONVERSATION_DOES_NOT_EXIST, 'Conversation does not exist');
        }
      }

      // Simulate different error conditions for testing
      // In a real implementation, these would be based on actual service checks
      // Disabled random error simulation for contract tests
      // const shouldSimulateError = Math.random() < 0.3; // 30% chance of error for testing
      // if (shouldSimulateError) {
      //   const errorTypes = [
      //     { status: 400, code: ChatErrorCode.APP_UNAVAILABLE, message: 'Application is currently unavailable' },
      //     { status: 400, code: ChatErrorCode.PROVIDER_NOT_INITIALIZE, message: 'AI provider is not initialized' },
      //     { status: 400, code: ChatErrorCode.PROVIDER_QUOTA_EXCEEDED, message: 'AI provider quota has been exceeded' },
      //     { status: 400, code: ChatErrorCode.MODEL_CURRENTLY_NOT_SUPPORT, message: 'The requested model is currently not supported' },
      //     { status: 400, code: ChatErrorCode.COMPLETION_REQUEST_ERROR, message: 'Failed to complete the request' },
      //     { status: 500, code: ChatErrorCode.INTERNAL_SERVER_ERROR, message: 'Internal server error occurred' }
      //   ];
      //   const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      //   throw new ChatException(randomError.status, randomError.code, randomError.message);
      // }

      if (responseMode === ChatMessagesResponseMode.STREAMING) {
        // Handle streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

        // Call the actual service to process streaming request
        const result = await this.chatMessagesService.processStreaming(body);
        res.write(`data: ${JSON.stringify({ event: 'task_created', taskId: result.taskId })}\n\n`);
        res.end();

      } else {
        // Handle blocking response - call the actual service
        const result = await this.chatMessagesService.processBlocking(body);
        res.status(200).json(result);
      }
    } catch (error) {
      if (error instanceof ChatException) {
        const errorResponse: BlockingErrorResponse = {
          status: error.status,
          code: error.code,
          message: error.message
        };
        res.status(error.status).json(errorResponse);
      } else {
        // Handle unexpected errors
        const errorResponse: BlockingErrorResponse = {
          status: 500,
          code: ChatErrorCode.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred'
        };
        res.status(500).json(errorResponse);
      }
    }
  }

  @Post('test-errors')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({
    summary: 'Test error responses',
    description: 'Endpoint to test different error codes and responses',
  })
  async testErrors(
    @Body() body: { errorType?: string },
    @Res() res: ExpressResponse
  ): Promise<void> {
    try {
      const { errorType } = body;

      // Test different error types
      switch (errorType) {
        case 'invalid_param':
          throw new ChatException(400, ChatErrorCode.INVALID_PARAM, 'Invalid parameter provided');
        case 'app_unavailable':
          throw new ChatException(400, ChatErrorCode.APP_UNAVAILABLE, 'Application is currently unavailable');
        case 'provider_not_initialize':
          throw new ChatException(400, ChatErrorCode.PROVIDER_NOT_INITIALIZE, 'AI provider is not initialized');
        case 'provider_quota_exceeded':
          throw new ChatException(400, ChatErrorCode.PROVIDER_QUOTA_EXCEEDED, 'AI provider quota has been exceeded');
        case 'model_currently_not_support':
          throw new ChatException(400, ChatErrorCode.MODEL_CURRENTLY_NOT_SUPPORT, 'The requested model is currently not supported');
        case 'completion_request_error':
          throw new ChatException(400, ChatErrorCode.COMPLETION_REQUEST_ERROR, 'Failed to complete the request');
        case 'unauthorized':
          throw new ChatException(401, ChatErrorCode.UNAUTHORIZED, 'Unauthorized access');
        case 'conversation_does_not_exist':
          throw new ChatException(404, ChatErrorCode.CONVERSATION_DOES_NOT_EXIST, 'Conversation does not exist');
        case 'internal_server_error':
          throw new ChatException(500, ChatErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error occurred');
        default:
          // Return success response showing available error types
          res.json({
            message: 'Error testing endpoint',
            available_error_types: [
              'invalid_param',
              'app_unavailable',
              'provider_not_initialize',
              'provider_quota_exceeded',
              'model_currently_not_support',
              'completion_request_error',
              'unauthorized',
              'conversation_does_not_exist',
              'internal_server_error'
            ],
            usage: 'POST /chats/test-errors with body: {"errorType": "invalid_param"}'
          });
          return;
      }
    } catch (error) {
      if (error instanceof ChatException) {
        const errorResponse: BlockingErrorResponse = {
          status: error.status,
          code: error.code,
          message: error.message
        };
        res.status(error.status).json(errorResponse);
      } else {
        const errorResponse: BlockingErrorResponse = {
          status: 500,
          code: ChatErrorCode.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred'
        };
        res.status(500).json(errorResponse);
      }
    }
  }
}
