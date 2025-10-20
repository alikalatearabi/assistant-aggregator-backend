import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatMessagesRequestDto, ChatMessageAnswerResponseDto, ChatMessagesErrorDto, RetrieverResourceDto } from '../dto/chat-messages.dto';
import axios from 'axios';

@Injectable()
export class ChatMessagesService {
  constructor(private readonly gateway: ChatMessagesGateway) {}

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
        similarity_threshold: req.inputs.similarityThreshold,
        context_count: req.inputs.contextCount,
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
      this.gateway.broadcast({
        event: 'error',
        taskId,
        conversation_id: req.conversationId || 'unknown',
        answer: '',
        status: result.error.status,
        code: result.error.code,
        message: result.error.message,
        created_at: new Date().toISOString(),
      });
    } else {
      // Broadcast success event
      this.gateway.broadcast({
        event: 'message_end',
        taskId,
        ...result,
        created_at: new Date().toISOString(),
      });
    }

    return { taskId };
  }
}
