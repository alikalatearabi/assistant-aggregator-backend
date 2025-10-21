import { Logger, Inject, forwardRef } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessagesService } from '../services/chat-messages.service';

@WebSocketGateway({ namespace: '/chat-messages', cors: true })
export class ChatMessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatMessagesGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(@Inject(forwardRef(() => ChatMessagesService)) private readonly chatMessagesService: ChatMessagesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to chat-messages WS: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from chat-messages WS: ${client.id}`);
  }

  // Handle incoming socket-based chat requests coming from clients
  @SubscribeMessage('chat_request')
  async handleChatRequest(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    try {
      this.logger.log(`Received chat_request from client ${client.id} responseMode=${payload?.responseMode}`);

      // If the client requested streaming, call the streaming path which will
      // broadcast events back to all connected clients (or could be scoped to a room).
      if (payload?.responseMode === 'streaming') {
        await this.chatMessagesService.processStreaming(payload);
        // no direct reply here; events will be emitted by the service via broadcast
        return { status: 'accepted' };
      }

      // For blocking/blocking-like requests, call the blocking handler and send
      // the response back to the requesting socket only.
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
