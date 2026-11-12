import { api } from "./client";

export interface AdminConversation {
  id: string;
  status: "ACTIVE" | "RESOLVED" | "CLOSED" | "ARCHIVED";
  lastMessageAt: string;
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

export interface AdminChatMessage {
  id: string;
  conversationId: string;
  senderType: "CUSTOMER" | "ADMIN" | "SYSTEM";
  senderId?: string | null;
  senderName?: string | null;
  text?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedAdminMessages {
  messages: AdminChatMessage[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export const chatApi = {
  async getConversations(params?: { status?: string; search?: string }): Promise<AdminConversation[]> {
    const res = await api.get<AdminConversation[]>("/admin/chat/conversations", { params });
    return res.data;
  },

  async getMessages(conversationId: string, cursor?: string, limit = 20): Promise<PaginatedAdminMessages> {
    const res = await api.get<PaginatedAdminMessages>(`/admin/chat/conversations/${conversationId}/messages`, {
      params: { cursor, limit },
    });
    return res.data;
  },

  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`/admin/chat/conversations/${conversationId}/read`);
  },

  async uploadPhoto(file: File): Promise<{ url: string; type: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ url: string; type: string }>("/admin/chat/upload", formData);
    return res.data;
  },
};

