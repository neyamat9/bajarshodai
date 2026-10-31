import { api, clean, type Paged, assetUrl } from "./client";

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

interface AdminPrescriptionListResponse {
  items: PrescriptionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const prescriptionsApi = {
  list: (params: { page?: number; limit?: number; status?: string; search?: string }): Promise<Paged<PrescriptionItem>> =>
    api.get<AdminPrescriptionListResponse>("/admin/prescriptions", { params: clean(params) }).then((r) => {
      const items = (r.data.items || []).map((it) => ({
        ...it,
        imageUrl: assetUrl(it.imageUrl),
      }));
      return {
        data: items,
        meta: {
          total: r.data.total ?? items.length,
          page: r.data.page ?? 1,
          limit: r.data.limit ?? 20,
          totalPages: r.data.totalPages ?? 1,
        },
      };
    }),

  updateStatus: (id: string, status: PrescriptionStatus, adminNotes?: string) =>
    api.patch<PrescriptionItem>(`/admin/prescriptions/${id}/status`, { status, adminNotes }).then((r) => r.data),

  remove: (id: string) => api.delete(`/admin/prescriptions/${id}`).then((r) => r.data),
};

