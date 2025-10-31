import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      this.connectedUsers.set(client.id, userId);
      client.join(`user:${userId}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { receiverId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;

    const message = await this.chatService.saveMessage({
      senderId,
      receiverId: data.receiverId,
      message: data.message,
    });

    this.server.to(`user:${data.receiverId}`).emit('new_message', message);
    client.emit('message_sent', message);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const currentUserId = this.connectedUsers.get(client.id);
    if (!currentUserId) return;

    const conversation = await this.chatService.getConversation(
      currentUserId,
      data.userId,
    );
    client.emit('conversation_history', conversation);
  }
}


