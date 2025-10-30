import { Logger, Inject, forwardRef } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessagesService } from '../services/chat-messages.service';
import { MessageService } from '../services/message.service';
import { ChatService } from '../services/chat.service';

@WebSocketGateway({ namespace: '/backend/chat-messages', cors: true })
export class ChatMessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatMessagesGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ChatMessagesService)) private readonly chatMessagesService: ChatMessagesService,
    private readonly messageService: MessageService,
    private readonly chatService: ChatService
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to chat-messages WS: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from chat-messages WS: ${client.id}`);
  }

  @SubscribeMessage('chat_request')
  async handleChatRequest(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    try {
      this.logger.log(`Received chat_request from client ${client.id} responseMode=${payload?.responseMode}`);
      if (payload?.responseMode === 'streaming') {
        const userMessage = await this.messageService.createMessage({
          category: 'user_input',
          text: payload.query,
          date: new Date().toISOString(),
          score: 0
        });

        let chatId: string;

        if (payload.conversationId && payload.conversationId !== 'new') {
          await this.chatService.addMessageToChat(payload.conversationId, userMessage._id.toString());
          chatId = payload.conversationId;
        } else {
          const newChat = await this.chatService.createChat({
            user: payload.user,
            title: payload.query.substring(0, 50) + (payload.query.length > 50 ? '...' : ''),
            conversationHistory: [userMessage._id.toString()]
          });
          chatId = newChat._id.toString();
        }
        const streamingPayload = {
          ...payload,
          conversationId: chatId
        };

        await this.chatMessagesService.processStreaming(streamingPayload);
        return { status: 'accepted' };
      }

      const result = await this.chatMessagesService.processBlocking(payload);
      client.emit('chat-messages', result);
      return { status: 'ok' };
    } catch (err) {
      this.logger.error('handleChatRequest error', err?.stack || err?.message || err);
      client.emit('chat-messages', { event: 'error', message: 'Server error' });
      return { status: 'error' };
    }
  }

  // Utility: broadcast to all clients (could be extended to rooms/topics)
  broadcast(data: any) {
    this.server?.emit('chat-messages', data);
  }
}
