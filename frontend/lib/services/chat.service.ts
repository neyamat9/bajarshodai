import { api, API_BASE_URL, tokens } from '@/lib/api/client';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  senderId?: string | null;
  senderName?: string | null;
  text?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ChatSession {
  conversationId: string;
  guestToken?: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED' | 'ARCHIVED';
  unreadCustomerCount: number;
  unreadAdminCount: number;
  lastMessageAt: string;
  lastMessageText?: string | null;
}

export interface PaginatedChatMessages {
  messages: ChatMessage[];
  nextCursor?: string | null;
  hasMore: boolean;
}

const GUEST_CHAT_KEY = 'bazar_guest_chat_token';

/**
 * Returns or creates a persistent guest UUID for live chat.
 */
export function getGuestChatToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(GUEST_CHAT_KEY);
  if (!token) {
    token = 'gst_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(GUEST_CHAT_KEY, token);
  }
  return token;
}

/**
 * Gets or initializes the customer's active chat session.
 */
export async function getChatSession(): Promise<ChatSession> {
  const isAuth = !!tokens.access;
  const guestToken = isAuth ? undefined : getGuestChatToken();
  const endpoint = guestToken
    ? `/customer/chat/session?guestToken=${encodeURIComponent(guestToken)}`
    : `/customer/chat/session`;

  const headers: Record<string, string> = {};
  if (guestToken) {
    headers['x-guest-token'] = guestToken;
  }

  return api.get<ChatSession>(endpoint, { headers });
}

/**
 * Fetches previous messages in 20-item chunks.
 */
export async function getChatMessages(
  conversationId: string,
  cursor?: string,
  limit = 20,
): Promise<PaginatedChatMessages> {
  let endpoint = `/customer/chat/messages?conversationId=${encodeURIComponent(conversationId)}&limit=${limit}`;
  if (cursor) {
    endpoint += `&cursor=${encodeURIComponent(cursor)}`;
  }
  return api.get<PaginatedChatMessages>(endpoint);
}

/**
 * Uploads a photo attachment (JPG, PNG, WebP) up to 5MB.
 */
export async function uploadChatPhoto(file: File): Promise<{ url: string; type: string }> {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<{ url: string; type: string }>(
    `/customer/chat/upload`,
    formData,
  );
}

/**
 * Merges previous guest conversation into authenticated account.
 */
export async function linkGuestChat(): Promise<void> {
  if (typeof window === 'undefined') return;
  const guestToken = localStorage.getItem(GUEST_CHAT_KEY);
  if (!guestToken || !tokens.access) return;

  try {
    await api.post(`/customer/chat/link-guest`, { guestToken });
    localStorage.removeItem(GUEST_CHAT_KEY);
  } catch {
    // Ignore if already linked
  }
}
