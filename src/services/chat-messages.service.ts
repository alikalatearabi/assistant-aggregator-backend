import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatMessagesRequestDto, ChatMessagesResponseDto, ChatMessagesErrorDto } from '../dto/chat-messages.dto';

@Injectable()
export class ChatMessagesService {
  constructor(private readonly gateway: ChatMessagesGateway) {}

  // Simulated retriever/LLM processing
  private async generateAnswer(req: ChatMessagesRequestDto): Promise<{ answer: string; metadata: any }> {
    // In real impl, call retriever/LLM with req.query, req.inputs, etc.
    const answer = `Answer for: ${req.query}`;
    const metadata = {
      retrieverResources: { topK: req.inputs.contextCount, threshold: req.inputs.similarityThreshold },
      usage: { tokens: 42 },
    };
    return { answer, metadata };
  }

  async processBlocking(req: ChatMessagesRequestDto): Promise<ChatMessagesResponseDto | { event: 'error'; error: ChatMessagesErrorDto; taskId: string }> {
    const taskId = randomUUID();
    try {
      const { answer, metadata } = await this.generateAnswer(req);
      const id = randomUUID();
      return {
        event: 'message.completed',
        taskId,
        id,
        messageId: id,
        conversationId: req.conversationId,
        mode: 'chat',
        answer,
        metadata,
        created_at: new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        event: 'error',
        error: {
          status: 500,
          code: 'INTERNAL_ERROR',
          message: e?.message || 'Unknown error',
        },
        taskId,
      };
    }
  }

  async processStreaming(req: ChatMessagesRequestDto): Promise<{ taskId: string }> {
    const taskId = randomUUID();
    try {
      // Simulate streaming chunks
      const chunks = [`Working on: ${req.query}`, ' ...', ' done.'];
      for (const chunk of chunks) {
        this.gateway.broadcast({
          event: 'message',
          taskId,
        //   id: randomUUID(),
          messageId: undefined,
          conversationId: req.conversationId,
          mode: 'chat',
          answer: chunk,
          metadata: {},
          created_at: new Date().toISOString(),
        });
        await new Promise((r) => setTimeout(r, 150));
      }

      // Final event
      const { answer, metadata } = await this.generateAnswer(req);
      const id = randomUUID();
      this.gateway.broadcast({
        event: 'message_end',
        taskId,
        // id,
        messageId: id,
        conversationId: req.conversationId,
        mode: 'chat',
        answer,
        metadata,
        created_at: new Date().toISOString(),
      });
      return { taskId };
    } catch (e: any) {
      this.gateway.broadcast({
        event: 'error',
        taskId,
        // id: randomUUID(),
        messageId: undefined,
        conversationId: req.conversationId,
        mode: 'chat',
        answer: '',
        status: 500,
        code: 'INTERNAL_ERROR',
        message: e?.message || 'Unknown error',
        created_at: new Date().toISOString(),
      });
      return { taskId };
    }
  }
}
