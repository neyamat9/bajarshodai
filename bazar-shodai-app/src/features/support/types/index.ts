export type TicketCategory =
  'ORDER' | 'PAYMENT' | 'DELIVERY' | 'RETURN_WARRANTY' | 'PRODUCT' | 'ACCOUNT' | 'OTHER';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId?: string;
  isStaff: boolean;
  message: string;
  createdAt: string;
  sender?: {
    name: string;
  };
}

export interface SupportTicket {
  id: string;
  userId: string;
  orderId?: string | null;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    orderNumber: string;
  };
}

export interface CreateTicketPayload {
  subject: string;
  message: string;
  category?: TicketCategory;
  orderId?: string;
}

export interface ContactPayload {
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}
