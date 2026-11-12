import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatSenderType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.debug(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  /**
   * Customer or Staff joins a specific conversation room.
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    if (!payload?.conversationId) return;
    const room = `conv:${payload.conversationId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
    return { ok: true, room };
  }

  /**
   * Admin dashboard staff join the global admin notification room.
   */
  @SubscribeMessage('subscribe_admin')
  async handleSubscribeAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin:support');
    this.logger.debug(`Admin client ${client.id} joined admin:support`);
    return { ok: true, room: 'admin:support' };
  }

  /**
   * Sends a chat message (Customer or Staff).
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      senderType: 'CUSTOMER' | 'ADMIN';
      senderId?: string | null;
      senderName?: string | null;
      text?: string | null;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
    },
  ) {
    const {
      conversationId,
      senderType,
      senderId,
      senderName,
      text,
      attachmentUrl,
      attachmentType,
    } = payload;

    if (!conversationId || (!text?.trim() && !attachmentUrl)) {
      return { ok: false, error: 'Empty message' };
    }

    const type =
      senderType === 'ADMIN' ? ChatSenderType.ADMIN : ChatSenderType.CUSTOMER;

    const saved = await this.chatService.saveMessage({
      conversationId,
      senderType: type,
      senderId,
      senderName,
      text: text?.trim() ?? null,
      attachmentUrl: attachmentUrl ?? null,
      attachmentType: attachmentType ?? null,
    });

    const room = `conv:${conversationId}`;

    // Broadcast to everyone in the conversation
    this.server.to(room).emit('new_message', saved);

    // If sent by customer, notify the global admin room so dashboard can chime and update list
    if (type === ChatSenderType.CUSTOMER) {
      this.server.to('admin:support').emit('admin_new_message', {
        conversationId,
        message: saved,
      });
    }

    return { ok: true, message: saved };
  }

  /**
   * Broadcast typing indicators.
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      isTyping: boolean;
      senderName: string;
      senderType: 'CUSTOMER' | 'ADMIN';
    },
  ) {
    if (!payload?.conversationId) return;
    const room = `conv:${payload.conversationId}`;
    client.to(room).emit('typing_status', payload);
  }

  /**
   * Mark messages as read.
   */
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; readBy: 'CUSTOMER' | 'ADMIN' },
  ) {
    if (!payload?.conversationId) return;
    await this.chatService.markAsRead(payload.conversationId, payload.readBy);
    const room = `conv:${payload.conversationId}`;
    this.server.to(room).emit('conversation_read', payload);
    return { ok: true };
  }
}

