import { ChatConversationStatus, ChatSenderType } from '@prisma/client';

export interface ChatSessionResponse {
  conversationId: string;
  guestToken?: string | null;
  status: ChatConversationStatus;
  unreadCustomerCount: number;
  unreadAdminCount: number;
  lastMessageAt: Date;
  lastMessageText?: string | null;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderType: ChatSenderType;
  senderId?: string | null;
  senderName?: string | null;
  text?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface PaginatedChatMessages {
  messages: ChatMessageDto[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface AdminConversationItem {
  id: string;
  status: ChatConversationStatus;
  lastMessageAt: Date;
  lastMessageText?: string | null;
  unreadAdminCount: number;
  unreadCustomerCount: number;
  customer: {
    id?: string | null;
    name: string;
    phone?: string | null;
    isGuest: boolean;
    guestToken?: string | null;
  };
}

