import { api, clean, type Paged } from "./client";

export interface PermissionInfo { key: string; group: string; label: string }
export interface Preset { key: string; label: string; role: "STAFF" | "ADMIN"; permissions: string[]; canDeliver: boolean }
export interface StaffMeta { permissions: PermissionInfo[]; presets: Preset[] }

export interface StaffRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "STAFF" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  permissions: string[];
  canDeliver: boolean;
  staffTitle: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
  deliveries: { delivered: number; active: number };
}
export interface StaffActivity { id: string; createdAt: string; action: string; category: string; summary: string; success: boolean; entityType: string | null; entityLabel: string | null }
export interface StaffDetail extends Omit<StaffRow, "deliveries"> {
  deliveries: { delivered: number; active: number };
  cashInHand: number;
  cashInHandCount: number;
  activity: StaffActivity[];
}
export interface StaffInput {
  name?: string;
  phone?: string;
  email?: string | null;
  password?: string;
  staffTitle?: string | null;
  role?: "STAFF" | "ADMIN";
  permissions?: string[];
  canDeliver?: boolean;
  status?: "ACTIVE" | "SUSPENDED";
  useExistingCustomer?: boolean;
}

export const staffApi = {
  meta: () => api.get<StaffMeta>("/admin/staff/meta").then((r) => r.data),
  list: (p: { search?: string; role?: string; status?: string; canDeliver?: boolean; page?: number } = {}) =>
    api.get<Paged<StaffRow>>("/admin/staff", { params: clean({ ...p, limit: 100 }) }).then((r) => r.data),
  get: (id: string) => api.get<StaffDetail>(`/admin/staff/${id}`).then((r) => r.data),
  create: (b: StaffInput) => api.post<StaffRow & { temporaryPassword?: string }>("/admin/staff", b).then((r) => r.data),
  update: (id: string, b: StaffInput) => api.patch<StaffRow>(`/admin/staff/${id}`, b).then((r) => r.data),
  resetPassword: (id: string) => api.post<{ temporaryPassword: string }>(`/admin/staff/${id}/reset-password`).then((r) => r.data),
};
