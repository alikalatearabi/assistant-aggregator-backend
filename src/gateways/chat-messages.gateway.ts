import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/chat-messages', cors: true })
export class ChatMessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatMessagesGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to chat-messages WS: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from chat-messages WS: ${client.id}`);
  }

  // Utility: broadcast to all clients (could be extended to rooms/topics)
  broadcast(data: any) {
    this.server?.emit('chat-messages', data);
  }
}
