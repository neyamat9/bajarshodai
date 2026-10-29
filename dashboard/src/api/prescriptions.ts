import { api, clean, type Paged, ASSET_BASE } from "./client";

export type PrescriptionStatus = "PENDING" | "REVIEWED" | "ORDER_CREATED" | "REJECTED";

export interface PrescriptionItem {
  id: string;
  userId: string | null;
  phone: string;
  imageUrl: string;
  notes: string | null;
  status: PrescriptionStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    avatarUrl: string | null;
  } | null;
}

export const prescriptionsApi = {
  list: (params: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<Paged<PrescriptionItem>>("/admin/prescriptions", { params: clean(params) }).then((r) => ({
      ...r.data,
      items: (r.data.items || []).map((it) => ({
        ...it,
        imageUrl: it.imageUrl?.startsWith("http") ? it.imageUrl : `${ASSET_BASE}${it.imageUrl}`,
      })),
    })),

  updateStatus: (id: string, status: PrescriptionStatus, adminNotes?: string) =>
    api.patch<PrescriptionItem>(`/admin/prescriptions/${id}/status`, { status, adminNotes }).then((r) => r.data),

  remove: (id: string) => api.delete(`/admin/prescriptions/${id}`).then((r) => r.data),
};

