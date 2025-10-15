import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChatMessagesGateway } from '../gateways/chat-messages.gateway';
import { ChatMessagesRequestDto, ChatMessageAnswerResponseDto, ChatMessagesErrorDto, RetrieverResourceDto } from '../dto/chat-messages.dto';

@Injectable()
export class ChatMessagesService {
  constructor(private readonly gateway: ChatMessagesGateway) {}

  // Simulated retriever/LLM processing
  private async generateAnswer(
    req: ChatMessagesRequestDto,
  ): Promise<{ answer: string; metadata: { retriever_resources: RetrieverResourceDto[]; usage: any } }> {
    const answer = `Answer for: ${req.query}`;
    const retriever_resources: RetrieverResourceDto[] = Array.from({ length: Math.max(1, req.inputs.contextCount) }).map((_, i) => ({
      position: i,
      dataset_id: 'dataset-demo',
      dataset_name: 'Demo Dataset',
      document_name: `Doc-${i + 1}`,
      document_id: '507f1f77bcf86cd7994390' + String(10 + i),
      segment_id: `seg-${i}`,
      score: Math.max(0, 1 - i * 0.1),
      content: `Snippet ${i + 1} related to ${req.query}`,
    }));
    const metadata = {
      retriever_resources,
      usage: { tokens: 42 },
    };
    return { answer, metadata };
  }

  async processBlocking(
    req: ChatMessagesRequestDto,
  ): Promise<
    | ChatMessageAnswerResponseDto
    | { event: 'error'; error: ChatMessagesErrorDto; taskId: string }
  > {
    const taskId = randomUUID();
    try {
      const { answer, metadata } = await this.generateAnswer(req);
      return {
        conversation_id: req.conversationId || 'unknown',
        answer,
        metadata,
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
          conversation_id: req.conversationId || 'unknown',
          answer: chunk,
          metadata: {},
          created_at: new Date().toISOString(),
        });
        await new Promise((r) => setTimeout(r, 150));
      }

      // Final event
      const { answer, metadata } = await this.generateAnswer(req);
      this.gateway.broadcast({
        event: 'message_end',
        taskId,
        conversation_id: req.conversationId || 'unknown',
        answer,
        metadata,
        created_at: new Date().toISOString(),
      });
      return { taskId };
    } catch (e: any) {
      this.gateway.broadcast({
        event: 'error',
        taskId,
        conversation_id: req.conversationId || 'unknown',
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
