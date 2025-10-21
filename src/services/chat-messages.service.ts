import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatMessagesRequestDto, ChatMessageAnswerResponseDto, ChatMessagesErrorDto, RetrieverResourceDto } from '../dto/chat-messages.dto';
import axios from 'axios';

@Injectable()
export class ChatMessagesService {
  private readonly logger = new Logger(ChatMessagesService.name);
  constructor(@Inject(forwardRef(() => ChatMessagesGateway)) private readonly gateway: ChatMessagesGateway) {}

  private async proxyToExternalApi(req: ChatMessagesRequestDto): Promise<any> {
    const loginUrl = 'https://test1.nlp-lab.ir/auth/login';
    const username = 'kalate'; 
    const password = '12';
    const loginData = `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&scope=&client_id=&client_secret=`;
    const loginHeaders = {
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    let token: string;
    try {
      const loginResp = await axios.post(loginUrl, loginData, { headers: loginHeaders });
      token = loginResp.data.access_token;
    } catch (err) {
      return {
        event: 'error',
        error: {
          status: err?.response?.status || 500,
          code: 'LOGIN_ERROR',
          message: err?.response?.data?.detail || err?.message || 'Login failed',
        },
        taskId: randomUUID(),
      };
    }

    const chatUrl = 'https://test1.nlp-lab.ir/chat/';
    const chatPayload = {
      query: req.query,
      inputs: {
        similarity_threshold: req.inputs?.similarityThreshold ?? 0.8,
        context_count: req.inputs?.contextCount ?? 5,
      },
      conversation_id: req.conversationId || '',
      prior_messages: req.priorMessages || [],
    };
    const chatHeaders = {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    try {
      const chatResp = await axios.post(chatUrl, chatPayload, { headers: chatHeaders });
      this.logger.log(`Proxied chat request successfully for conversation ID: ${chatResp.data || 'new'}`);
      return chatResp.data;
    } catch (err) {
      return {
        event: 'error',
        error: {
          status: err?.response?.status || 500,
          code: 'CHAT_ERROR',
          message: err?.response?.data?.detail || err?.message || 'Chat API failed',
        },
        taskId: randomUUID(),
      };
    }
  }

  async processBlocking(
    req: ChatMessagesRequestDto,
  ): Promise<any> {
    return await this.proxyToExternalApi(req);
  }

  async processStreaming(req: ChatMessagesRequestDto): Promise<{ taskId: string }> {
    const taskId = randomUUID();
    const result = await this.proxyToExternalApi(req);

    if (result && typeof result === 'object' && 'event' in result && result.event === 'error') {
      // Broadcast error event
      const timestamp = new Date().toISOString();
      this.gateway.broadcast({
        event: 'error',
        taskId,
        conversation_id: req.conversationId || 'unknown',
        answer: '',
        status: result.error.status,
        code: result.error.code,
        message: result.error.message,
        created_at: timestamp,
        // Convenience aliases for clients expecting different keys
        date: timestamp,
        createdAt: timestamp,
      });
    } else {
      // Simulate streaming by chunking the answer
      const answer = result.answer;
      const chunks = this.chunkText(answer, 20); // Chunk by ~20 characters

      // Emit start event with metadata
      const startTs = new Date().toISOString();
      this.gateway.broadcast({
        event: 'message_start',
        taskId,
        conversation_id: result.conversation_id,
        metadata: result.metadata,
        created_at: startTs,
        date: startTs,
        createdAt: startTs,
      });

      // Emit chunks progressively
      for (let i = 0; i < chunks.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150)); // Simulate streaming delay
        const chunkTs = new Date().toISOString();
        this.gateway.broadcast({
          event: 'message_chunk',
          taskId,
          conversation_id: result.conversation_id,
          chunk: chunks[i],
          created_at: chunkTs,
          date: chunkTs,
          createdAt: chunkTs,
        });
      }

      // Emit end event with history
      const endTs = new Date().toISOString();
      this.gateway.broadcast({
        event: 'message_end',
        taskId,
        conversation_id: result.conversation_id,
        history: result.history,
        created_at: endTs,
        date: endTs,
        createdAt: endTs,
      });
    }

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
