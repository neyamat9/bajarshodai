import { api, clean } from "./client";
import { tr } from "@/i18n";

export type DeliveryStatus = "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED" | "FAILED" | "CANCELLED";

export const FAIL_REASONS = [
  { value: "CUSTOMER_NOT_REACHABLE", label: tr("Customer not reachable") },
  { value: "CUSTOMER_REFUSED", label: tr("Customer refused the order") },
  { value: "WRONG_ADDRESS", label: tr("Wrong address") },
  { value: "NOBODY_HOME", label: tr("Nobody at the address") },
  { value: "PAYMENT_PROBLEM", label: tr("Payment problem") },
  { value: "OTHER", label: tr("Other") },
] as const;
export const failReasonLabel = (v: string | null) => tr(FAIL_REASONS.find((r) => r.value === v)?.label ?? v ?? "");

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  due: number;
  placedAt: string;
  slot: string | null;
  distanceKm: number | null;
  customerName: string;
  phone: string | null;
  address: string | null;
  landmark: string | null;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  deliveryNote: string | null;
  customerNote: string | null;
}
export interface BoardDelivery {
  id: string;
  status: DeliveryStatus;
  attempts: number;
  assignedAt: string;
  pickedUpAt: string | null;
  onTheWayAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  failedReason: string | null;
  cashToCollect: number;
  cashCollected: number | null;
  cashHandedOverAt: string | null;
  assignee: { id: string; name: string; phone: string };
}
export interface BoardCard { delivery: BoardDelivery | null; order: DeliveryOrder }
export interface Board {
  date: string;
  columns: { unassigned: BoardCard[]; assigned: BoardCard[]; onTheWay: BoardCard[]; delivered: BoardCard[]; failed: BoardCard[] };
}
export interface Rider { id: string; name: string; phone: string; staffTitle: string | null; role: string; active: number; deliveredToday: number; cashInHand: number }

export interface AssignResult { assigned: number; failed: number; results: { orderId: string; orderNumber?: string; ok: boolean; error?: string }[] }
export interface CashGroup { rider: { id: string; name: string; phone: string }; total: number; items: { id: string; orderNumber: string; cash: number; due: number; deliveredAt: string | null }[] }

export interface Stats {
  from: string;
  to: string;
  totals: { deliveries: number; uniqueCustomers: number };
  range: { delivered: number; failed: number; successRatePct: number | null; uniqueCustomers: number; repeatCustomers: number; repeatCustomerPct: number | null; avgMinutesFromOrder: number | null; avgMinutesFromAssign: number | null };
  now: { withRiders: number; waitingForDelivery: number; cashWithRiders: number; cashToCollect: number };
  riders: { id: string; name: string; delivered: number; failed: number; avgMinutes: number | null }[];
  series: { date: string; delivered: number }[];
}

export interface MyDelivery {
  id: string;
  status: DeliveryStatus;
  attempts: number;
  note: string | null;
  assignedAt: string;
  deliveredAt: string | null;
  failedAt: string | null;
  failedReason: string | null;
  cashToCollect: number;
  cashCollected: number | null;
  cashHandedOverAt: string | null;
  order: DeliveryOrder & { items: { id: string; name: string; nameBn: string | null; quantity: number; unit: string | null; unitBn: string | null }[] };
}
export interface MySummary { active: number; deliveredToday: number; failedToday: number; cashInHand: number }

export interface DeliveryDetail {
  id: string;
  status: DeliveryStatus;
  attempts: number;
  events: { id: string; status: DeliveryStatus; actorName: string | null; note: string | null; createdAt: string }[];
}

export const deliveriesApi = {
  board: (p: { date?: string; assigneeId?: string } = {}) => api.get<Board>("/admin/deliveries/board", { params: clean(p) }).then((r) => r.data),
  riders: () => api.get<Rider[]>("/admin/deliveries/riders").then((r) => r.data),
  assign: (orderIds: string[], assigneeId: string, note?: string) => api.post<AssignResult>("/admin/deliveries/assign", { orderIds, assigneeId, note: note || undefined }).then((r) => r.data),
  unassign: (id: string, note?: string) => api.post(`/admin/deliveries/${id}/unassign`, { note: note || undefined }).then((r) => r.data),
  one: (id: string) => api.get<DeliveryDetail>(`/admin/deliveries/${id}`).then((r) => r.data),
  stats: (p: { from?: string; to?: string } = {}) => api.get<Stats>("/admin/deliveries/stats", { params: clean(p) }).then((r) => r.data),
  cash: () => api.get<CashGroup[]>("/admin/deliveries/cash").then((r) => r.data),
  handOver: (deliveryIds: string[]) => api.post<{ received: number; total: number }>("/admin/deliveries/cash/handover", { deliveryIds }).then((r) => r.data),
  // the rider
  mine: (scope: "active" | "done") => api.get<MyDelivery[]>("/admin/my-deliveries", { params: { scope } }).then((r) => r.data),
  mySummary: () => api.get<MySummary>("/admin/my-deliveries/summary").then((r) => r.data),
  step: (id: string, step: "accept" | "picked-up" | "on-the-way", note?: string) => api.post(`/admin/my-deliveries/${id}/${step}`, { note: note || undefined }).then((r) => r.data),
  delivered: (id: string, body: { cashCollected?: number; note?: string }) => api.post(`/admin/my-deliveries/${id}/delivered`, body).then((r) => r.data),
  failed: (id: string, body: { reason: string; note?: string }) => api.post(`/admin/my-deliveries/${id}/failed`, body).then((r) => r.data),
};
