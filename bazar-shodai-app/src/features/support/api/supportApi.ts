import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { SupportTicket, CreateTicketPayload, ContactPayload, AppNotification } from '../types';

// ======================== SUPPORT TICKETS ========================

export async function fetchTicketsApi(
  status?: string,
): Promise<{ items: SupportTicket[]; total: number }> {
  try {
    const params = status ? { status } : {};
    const res = await api.get<{ items: SupportTicket[]; total: number } | SupportTicket[]>(
      '/customer/support-tickets',
      { params },
    );
    if (Array.isArray(res)) {
      return { items: res, total: res.length };
    }
    return { items: res.items || [], total: res.total || 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function fetchTicketDetailApi(id: string): Promise<SupportTicket> {
  return api.get<SupportTicket>(`/customer/support-tickets/${encodeURIComponent(id)}`);
}

export async function createTicketApi(payload: CreateTicketPayload): Promise<SupportTicket> {
  return api.post<SupportTicket>('/customer/support-tickets', payload);
}

export async function replyTicketApi(
  id: string,
  message: string,
): Promise<{ success: boolean; message: any }> {
  return api.post(`/customer/support-tickets/${encodeURIComponent(id)}/messages`, { message });
}

export async function closeTicketApi(id: string): Promise<{ success: boolean }> {
  return api.post(`/customer/support-tickets/${encodeURIComponent(id)}/close`);
}

export function useSupportTickets(status?: string) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['support-tickets', status],
    queryFn: () => fetchTicketsApi(status),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 sec polling/stale
  });
}

export function useTicketDetail(id: string) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['ticket-detail', id],
    queryFn: () => fetchTicketDetailApi(id),
    enabled: isAuthenticated && Boolean(id),
    refetchInterval: 1000 * 10, // Poll every 10s during live chat
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicketApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

export function useReplyTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => replyTicketApi(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

export function useCloseTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => closeTicketApi(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

// ======================== CONTACT ========================

export async function submitContactApi(payload: ContactPayload): Promise<{ success: boolean }> {
  return api.post('/customer/contact', payload);
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: submitContactApi,
  });
}

// ======================== NOTIFICATIONS ========================

export async function fetchNotificationsApi(): Promise<AppNotification[]> {
  try {
    const res = await api.get<any>('/customer/notifications');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
    return [];
  } catch {
    return [];
  }
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await api.patch(`/customer/notifications/${encodeURIComponent(id)}/read`);
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await api.patch('/customer/notifications/read-all');
}

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['customer-notifications'],
    queryFn: fetchNotificationsApi,
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
    },
  });
}
