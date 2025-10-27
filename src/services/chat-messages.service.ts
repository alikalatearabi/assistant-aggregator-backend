import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatMessagesRequestDto, ChatMessageAnswerResponseDto, ChatMessagesErrorDto, RetrieverResourceDto } from '../dto/chat-messages.dto';
import axios from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { externalApiLogger } from '../config/logger.config';
import { MessageService } from './message.service';
import { ChatService } from './chat.service';
import https from 'https';

@Injectable()
export class ChatMessagesService {
  private readonly logger: Logger;
  constructor(
    @Inject(forwardRef(() => ChatMessagesGateway)) private readonly gateway: ChatMessagesGateway,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winstonLogger: Logger,
    private readonly messageService: MessageService,
    private readonly chatService: ChatService
  ) {
    this.logger = this.winstonLogger.child({ context: ChatMessagesService.name });
  }

  private async proxyToExternalApi(req: ChatMessagesRequestDto): Promise<any> {
    const loginUrl = 'https://test1.nlp-lab.ir/auth/login';
    const username = 'kalate'; 
    const password = '12';
    const loginData = `grant_type=password&username=${(username)}&password=${(password)}&scope=&client_id=&client_secret=`;
    const loginHeaders = {
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Assistant-Aggregator-Backend/1.0',
    };

    // Add request interceptor to log the exact request
    const requestInterceptor = axios.interceptors.request.use((config) => {
      externalApiLogger.debug('=== AXIOS REQUEST INTERCEPTOR ===', {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: config.headers,
        data: config.data,
        timeout: config.timeout
      });
      return config;
    });
    
    // Configure axios with timeout and retry settings
    const axiosConfig = {
      timeout: 60000, // 60 seconds timeout (increased from 30)
      headers: loginHeaders,
      httpsAgent: new https.Agent({rejectUnauthorized: false}),
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    };
    
    externalApiLogger.info('=== EXTERNAL API LOGIN REQUEST ===', {
      url: loginUrl,
      headers: loginHeaders,
      body: loginData,
      timeout: axiosConfig.timeout
    });
    
    let token: string | undefined;
    let loginAttempts = 0;
    const maxLoginAttempts = 3;
    
    while (loginAttempts < maxLoginAttempts) {
      try {
        loginAttempts++;
        this.logger.info(`Login attempt ${loginAttempts}/${maxLoginAttempts}`);
        
        const loginResp = await axios.post(loginUrl, loginData, axiosConfig);
        token = loginResp.data.access_token;
        
        externalApiLogger.info('=== EXTERNAL API LOGIN RESPONSE ===', {
          status: loginResp.status,
          statusText: loginResp.statusText,
          responseHeaders: loginResp.headers,
          response: loginResp.data,
          tokenReceived: token ? 'YES' : 'NO'
        });
        break; // Success, exit retry loop
        
      } catch (err) {
        this.logger.error(`Login attempt ${loginAttempts} failed: ${err?.message}`);
        
        if (loginAttempts >= maxLoginAttempts) {
          // Final attempt failed, throw error
          externalApiLogger.error('=== EXTERNAL API LOGIN ERROR ===', {
            error: err?.message,
            errorCode: err?.code,
            status: err?.response?.status,
            response: err?.response?.data,
            attempt: loginAttempts
          });
          
          // Provide more specific error messages based on error type
          let errorMessage = 'Login failed';
          let errorCode = 'LOGIN_ERROR';
          
          if (err?.code === 'ECONNRESET' || err?.code === 'ECONNREFUSED') {
            errorMessage = 'Connection to external API failed. Please try again.';
            errorCode = 'CONNECTION_ERROR';
          } else if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNABORTED') {
            errorMessage = 'External API request timed out. Please try again.';
            errorCode = 'TIMEOUT_ERROR';
          } else if (err?.response?.status === 401) {
            errorMessage = 'Authentication failed with external API';
            errorCode = 'AUTH_ERROR';
          } else if (err?.response?.data?.detail) {
            errorMessage = err.response.data.detail;
          }
          
          return {
            event: 'error',
            error: {
              status: err?.response?.status || 500,
              code: errorCode,
              message: errorMessage,
            },
            taskId: randomUUID(),
          };
        } else {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, loginAttempts) * 1000; // 2s, 4s, 8s
          this.logger.info(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // Check if we have a valid token after all retry attempts
    if (!token) {
      this.logger.error('Failed to obtain authentication token after all retry attempts');
      return {
        event: 'error',
        error: {
          status: 500,
          code: 'AUTH_ERROR',
          message: 'Failed to authenticate with external API after multiple attempts',
        },
        taskId: randomUUID(),
      };
    }

    const chatUrl = 'https://test1.nlp-lab.ir/chat/';
    const chatPayload = {
      query: req.query,
      inputs: {
        similarity_threshold: req.inputs?.similarityThreshold ?? '0.10',
        context_count: req.inputs?.contextCount ?? 6,
      },
      think_level: req.think_level,
      conversation_id: req.conversationId || '',
      prior_messages: req.priorMessages || [],
    };
    const chatHeaders = {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Assistant-Aggregator-Backend/1.0',
    };
    
    // Configure axios with timeout for chat API
    const chatAxiosConfig = {
      timeout: 60000, // 60 seconds timeout for chat (longer than login)
      headers: chatHeaders,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    };
    
    externalApiLogger.info('=== EXTERNAL API CHAT REQUEST ===', {
      url: chatUrl,
      headers: chatHeaders,
      payload: chatPayload,
      timeout: chatAxiosConfig.timeout
    });
    
    try {
      const chatResp = await axios.post(chatUrl, chatPayload, chatAxiosConfig);
      
      externalApiLogger.info('=== EXTERNAL API CHAT RESPONSE ===', {
        status: chatResp.status,
        response: chatResp.data,
        conversationId: chatResp.data?.conversation_id || 'new'
      });
      
      return chatResp.data;
    } catch (err) {
      externalApiLogger.error('=== EXTERNAL API CHAT ERROR ===', {
        error: err?.message,
        errorCode: err?.code,
        status: err?.response?.status,
        response: err?.response?.data
      });
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Chat API failed';
      let errorCode = 'CHAT_ERROR';
      
      if (err?.code === 'ECONNRESET' || err?.code === 'ECONNREFUSED') {
        errorMessage = 'Connection to external chat API failed. Please try again.';
        errorCode = 'CONNECTION_ERROR';
      } else if (err?.code === 'ETIMEDOUT') {
        errorMessage = 'External chat API request timed out. Please try again.';
        errorCode = 'TIMEOUT_ERROR';
      } else if (err?.response?.status === 401) {
        errorMessage = 'Authentication failed with external chat API';
        errorCode = 'AUTH_ERROR';
      } else if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      return {
        event: 'error',
        error: {
          status: err?.response?.status || 500,
          code: errorCode,
          message: errorMessage,
        },
        taskId: randomUUID(),
      };
    }

    // Clean up the request interceptor
    axios.interceptors.request.eject(requestInterceptor);
  }

  async processBlocking(
    req: ChatMessagesRequestDto,
  ): Promise<any> {
    this.logger.info('=== PROCESSING BLOCKING REQUEST ===', {
      query: req.query,
      thinkLevel: req.think_level,
      user: req.user,
      conversationId: req.conversationId || 'new'
    });
    
    const result = await this.proxyToExternalApi(req);
    
    this.logger.info('=== BLOCKING REQUEST COMPLETED ===', {
      resultType: result?.event || 'success'
    });
    
    return result;
  }

  async processStreaming(req: ChatMessagesRequestDto): Promise<{ taskId: string }> {
    const taskId = randomUUID();
    
    this.logger.info('=== PROCESSING STREAMING REQUEST ===', {
      taskId,
      query: req.query,
      thinkLevel: req.think_level,
      user: req.user,
      conversationId: req.conversationId || 'new'
    });
    
    const result = await this.proxyToExternalApi(req);

    if (result && typeof result === 'object' && 'event' in result && result.event === 'error') {
      // Broadcast error event with new format
      const timestamp = new Date().toISOString();
      this.gateway.broadcast({
        event: 'error',
        taskId,
        conversation_id: req.conversationId || 'unknown',
        answer: '',
        history: [],
        metadata: {
          error: {
            status: result.error.status,
            code: result.error.code,
            message: result.error.message
          }
        },
        created_at: timestamp,
      });
    } else {
      // Simulate streaming by chunking the answer
      const answer = result.answer;
      const chunks = this.chunkText(answer, 20); // Chunk by ~20 characters

      // Emit start event with new format
      const startTs = new Date().toISOString();
      this.gateway.broadcast({
        event: 'message_start',
        taskId,
        conversation_id: result.conversation_id,
        answer: '',
        history: result.history || [],
        metadata: result.metadata || {},
        created_at: startTs,
      });

      // Emit chunks progressively
      for (let i = 0; i < chunks.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150)); // Simulate streaming delay
        const chunkTs = new Date().toISOString();
        this.gateway.broadcast({
          event: 'message_chunk',
          taskId,
          conversation_id: result.conversation_id,
          answer: chunks.slice(0, i + 1).join(''), // Accumulated answer so far
          history: result.history || [],
          metadata: result.metadata || {},
          created_at: chunkTs,
        });
      }

      // Emit end event with complete new format
      const endTs = new Date().toISOString();
      
      // Extract retriever resources if they exist
      const retrieverResources = result.metadata?.retriever_resources || [];
      
      // Save assistant message to database with retriever resources
      try {
        const assistantMessage = await this.messageService.createMessage({
          category: 'assistant_response',
          text: result.answer,
          date: endTs,
          score: 0,
          retrieverResources: retrieverResources
        });

        // Add assistant message to chat if conversationId is available
        if (req.conversationId) {
          await this.chatService.addMessageToChat(req.conversationId, assistantMessage._id.toString());
        }

        this.logger.info('=== STREAMING ASSISTANT MESSAGE SAVED ===', {
          taskId,
          messageId: assistantMessage._id.toString(),
          conversationId: req.conversationId,
          retrieverResourcesCount: retrieverResources.length
        });
      } catch (saveError) {
        this.logger.error('=== FAILED TO SAVE STREAMING ASSISTANT MESSAGE ===', {
          taskId,
          error: saveError?.message,
          conversationId: req.conversationId
        });
      }
      
      // Broadcast the final message with retriever resources
      this.gateway.broadcast({
        event: 'message_end',
        taskId,
        conversation_id: result.conversation_id,
        answer: result.answer,
        history: result.history || [],
        metadata: result.metadata || {},
        created_at: endTs,
        retrieverResources: retrieverResources, // Include retriever resources for the frontend
      });
    }

    this.logger.info('=== STREAMING REQUEST COMPLETED ===', {
      taskId,
      resultType: result?.event || 'success'
    });

    return { taskId };
  }

  // Helper method to chunk text
  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
