import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatConversationStatus, ChatSenderType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import {
  AdminConversationItem,
  ChatMessageDto,
  ChatSessionResponse,
  PaginatedChatMessages,
} from './chat.types';

const ALLOWED_IMAGE_FORMATS = new Set(['jpeg', 'png', 'webp', 'jpg']);
const MAX_CHAT_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly rootDir: string;
  private readonly publicBase: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.rootDir = path.resolve(this.config.get<string>('uploads.dir') ?? 'uploads');
    this.publicBase = this.config.get<string>('uploads.publicBaseUrl') ?? '';
  }

  /**
   * Optimizes and saves a photo attachment for live chat.
   */
  async saveChatAttachment(file: Express.Multer.File): Promise<{ url: string; type: string }> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (file.size > MAX_CHAT_IMAGE_BYTES) {
      throw new BadRequestException('Image size must not exceed 5MB');
    }

    const chatDir = path.join(this.rootDir, 'chat');
    await fs.mkdir(chatDir, { recursive: true });

    try {
      const metadata = await sharp(file.buffer).metadata();
      if (!metadata.format || !ALLOWED_IMAGE_FORMATS.has(metadata.format)) {
        throw new BadRequestException(`Unsupported format "${metadata.format}". Please upload JPG, PNG, or WebP.`);
      }

      const fileName = `${randomUUID()}.webp`;
      const filePath = path.join(chatDir, fileName);

      await sharp(file.buffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filePath);

      const relativeUrl = `/uploads/chat/${fileName}`;
      const finalUrl = this.publicBase ? `${this.publicBase}${relativeUrl}` : relativeUrl;

      return {
        url: finalUrl,
        type: 'image/webp',
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Failed to process chat attachment', err);
      throw new BadRequestException('Invalid image file');
    }
  }

  /**
   * Resolves or creates a chat conversation for an authenticated user or a guest.
   */
  async getOrCreateSession(params: {
    userId?: string;
    guestToken?: string;
    guestName?: string;
    guestPhone?: string;
  }): Promise<ChatSessionResponse> {
    const { userId, guestToken, guestName, guestPhone } = params;

    // 1. If user is logged in, find their active conversation
    if (userId) {
      let conv = await this.prisma.chatConversation.findFirst({
        where: {
          userId,
          status: { in: [ChatConversationStatus.ACTIVE, ChatConversationStatus.RESOLVED] },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      if (!conv) {
        conv = await this.prisma.chatConversation.create({
          data: {
            userId,
            status: ChatConversationStatus.ACTIVE,
          },
        });
      }

      return {
        conversationId: conv.id,
        guestToken: null,
        status: conv.status,
        unreadCustomerCount: conv.unreadCustomerCount,
        unreadAdminCount: conv.unreadAdminCount,
        lastMessageAt: conv.lastMessageAt,
        lastMessageText: conv.lastMessageText,
      };
    }

    // 2. If guest with a token, find or create by token
    if (guestToken) {
      let conv = await this.prisma.chatConversation.findUnique({
        where: { guestToken },
      });

      if (!conv) {
        conv = await this.prisma.chatConversation.create({
          data: {
            guestToken,
            guestName: guestName ?? 'Guest Customer',
            guestPhone: guestPhone ?? null,
            status: ChatConversationStatus.ACTIVE,
          },
        });
      }

      return {
        conversationId: conv.id,
        guestToken: conv.guestToken,
        status: conv.status,
        unreadCustomerCount: conv.unreadCustomerCount,
        unreadAdminCount: conv.unreadAdminCount,
        lastMessageAt: conv.lastMessageAt,
        lastMessageText: conv.lastMessageText,
      };
    }

    throw new Error('Either userId or guestToken must be provided.');
  }

  /**
   * Merges a guest conversation into an authenticated user's account upon login.
   */
  async linkGuestConversation(userId: string, guestToken: string): Promise<void> {
    if (!userId || !guestToken) return;

    const guestConv = await this.prisma.chatConversation.findUnique({
      where: { guestToken },
    });

    if (!guestConv) return;

    const userConv = await this.prisma.chatConversation.findFirst({
      where: {
        userId,
        status: { in: [ChatConversationStatus.ACTIVE, ChatConversationStatus.RESOLVED] },
      },
    });

    if (userConv && userConv.id !== guestConv.id) {
      // Reassign all messages from guest conversation to existing user conversation
      await this.prisma.chatMessage.updateMany({
        where: { conversationId: guestConv.id },
        data: { conversationId: userConv.id },
      });
      // Delete the empty guest conversation
      await this.prisma.chatConversation.delete({
        where: { id: guestConv.id },
      });
    } else {
      // Link the guest conversation directly to the user
      await this.prisma.chatConversation.update({
        where: { id: guestConv.id },
        data: {
          userId,
          guestToken: null, // clear guest token once attached to user
        },
      });
    }
  }

  /**
   * Fetches messages in 20-item chunks working backward in time.
   * If cursor is provided, fetches the 20 messages older than the cursor ID.
   * Returns messages in chronological order (oldest to newest) for seamless chat display.
   */
  async getMessages(
    conversationId: string,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedChatMessages> {
    const take = Math.min(Math.max(limit, 1), 50);

    const rows = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;

    // Reverse to chronological order (oldest first)
    const messages: ChatMessageDto[] = items.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderType: m.senderType,
      senderId: m.senderId,
      senderName: m.senderName,
      text: m.text,
      attachmentUrl: m.attachmentUrl,
      attachmentType: m.attachmentType,
      isRead: m.isRead,
      createdAt: m.createdAt,
    }));

    return {
      messages,
      nextCursor: hasMore ? items[0].id : null,
      hasMore,
    };
  }

  /**
   * Persists a message and bumps conversation timestamps and unread counters.
   */
  async saveMessage(params: {
    conversationId: string;
    senderType: ChatSenderType;
    senderId?: string | null;
    senderName?: string | null;
    text?: string | null;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
  }): Promise<ChatMessageDto> {
    const {
      conversationId,
      senderType,
      senderId,
      senderName,
      text,
      attachmentUrl,
      attachmentType,
    } = params;

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderType,
        senderId: senderId ?? null,
        senderName: senderName ?? (senderType === ChatSenderType.ADMIN ? 'Support Agent' : 'Customer'),
        text: text ?? null,
        attachmentUrl: attachmentUrl ?? null,
        attachmentType: attachmentType ?? null,
      },
    });

    const snippet = text?.slice(0, 100) || (attachmentUrl ? '📷 Photo Attachment' : '');

    // Increment recipient's unread counter
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
        lastMessageText: snippet,
        unreadAdminCount:
          senderType === ChatSenderType.CUSTOMER
            ? { increment: 1 }
            : undefined,
        unreadCustomerCount:
          senderType === ChatSenderType.ADMIN
            ? { increment: 1 }
            : undefined,
      },
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderType: message.senderType,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text,
      attachmentUrl: message.attachmentUrl,
      attachmentType: message.attachmentType,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  /**
   * Marks conversation messages as read and resets unread badge.
   */
  async markAsRead(conversationId: string, readBy: 'CUSTOMER' | 'ADMIN'): Promise<void> {
    if (readBy === 'CUSTOMER') {
      await this.prisma.$transaction([
        this.prisma.chatMessage.updateMany({
          where: {
            conversationId,
            senderType: ChatSenderType.ADMIN,
            isRead: false,
          },
          data: { isRead: true, readAt: new Date() },
        }),
        this.prisma.chatConversation.update({
          where: { id: conversationId },
          data: { unreadCustomerCount: 0 },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.chatMessage.updateMany({
          where: {
            conversationId,
            senderType: ChatSenderType.CUSTOMER,
            isRead: false,
          },
          data: { isRead: true, readAt: new Date() },
        }),
        this.prisma.chatConversation.update({
          where: { id: conversationId },
          data: { unreadAdminCount: 0 },
        }),
      ]);
    }
  }

  /**
   * Lists conversations for the Admin Dashboard.
   */
  async getAdminConversations(query: {
    status?: ChatConversationStatus;
    search?: string;
  }): Promise<AdminConversationItem[]> {
    const { status, search } = query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { guestName: { contains: q, mode: 'insensitive' } },
        { guestPhone: { contains: q } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q } } },
        { lastMessageText: { contains: q, mode: 'insensitive' } },
      ];
    }

    const conversations = await this.prisma.chatConversation.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });

    return conversations.map((c) => ({
      id: c.id,
      status: c.status,
      lastMessageAt: c.lastMessageAt,
      lastMessageText: c.lastMessageText,
      unreadAdminCount: c.unreadAdminCount,
      unreadCustomerCount: c.unreadCustomerCount,
      customer: {
        id: c.user?.id ?? null,
        name: c.user?.name ?? c.guestName ?? 'Guest Customer',
        phone: c.user?.phone ?? c.guestPhone ?? null,
        isGuest: !c.userId,
        guestToken: c.guestToken,
      },
    }));
  }
}
