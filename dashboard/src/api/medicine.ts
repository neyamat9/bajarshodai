import { api, clean } from "./client";
import type { ProductRow } from "./products";

export interface MedicineMeta {
  id?: string;
  productId?: string;
  genericName: string;
  genericSlug?: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  type: "OTC" | "PRESCRIPTION";
  medexUrl?: string | null;
  medexId?: number | null;
  lastSyncedAt?: string | null;
  syncStatus?: "SYNCED" | "DRIFT_DETECTED" | "FAILED";
  mrpUnit?: number | string | null;
  mrpStrip?: number | string | null;
  mrpBox?: number | string | null;
  packSizeInfo?: string | null;
  discountMode?: "GLOBAL" | "PERCENT" | "FIXED" | "NONE";
  discountValue?: number | string | null;
}

export interface MedExSearchResult {
  medexId: number;
  name: string;
  dosageForm: string;
  strength: string;
  url: string;
}

export interface MedExMedicineDetail {
  medexId: number;
  medexUrl: string;
  name: string;
  dosageForm: string;
  strength: string;
  genericName: string;
  genericSlug: string;
  companyName: string;
  unitPrice: number | null;
  stripPrice: number | null;
  boxPrice: number | null;
  packSizeInfo: string | null;
}

export interface MedicineStats {
  totalMedicines: number;
  syncedMedicines: number;
  driftCount: number;
  prescriptionCount: number;
}

export interface MedicineListResponse {
  items: (ProductRow & { medicineMeta: MedicineMeta })[];
  stats: MedicineStats;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const medicineApi = {
  lookup: (q: string) =>
    api.get<MedExSearchResult[]>(`/admin/medicine/lookup?q=${encodeURIComponent(q)}`).then((r) => r.data),

  detail: (url: string) =>
    api.get<MedExMedicineDetail>(`/admin/medicine/detail?url=${encodeURIComponent(url)}`).then((r) => r.data),

  list: (params: {
    search?: string;
    dosageForm?: string;
    brand?: string;
    generic?: string;
    type?: string;
    syncStatus?: string;
    page?: number;
    limit?: number;
  }) => api.get<MedicineListResponse>("/admin/medicine/list", { params: clean(params) }).then((r) => r.data),

  stats: () => api.get<MedicineStats>("/admin/medicine/stats").then((r) => r.data),

  syncPrice: (productId: string) =>
    api.post(`/admin/medicine/sync-price/${productId}`).then((r) => r.data),

  auditDrift: () => api.post("/admin/medicine/audit-drift").then((r) => r.data),

  acceptDrift: (productId: string, sellingPrice?: number) =>
    api.post(`/admin/medicine/accept-drift/${productId}`, { sellingPrice }).then((r) => r.data),

  acceptAllDrifts: () => api.post("/admin/medicine/accept-all-drifts").then((r) => r.data),

  getDiscountSettings: () =>
    api
      .get<{
        globalDiscountPercent: number;
        stats: {
          totalMedicines: number;
          globalCount: number;
          customCount: number;
          noneCount: number;
        };
      }>("/admin/medicine/discount-settings")
      .then((r) => r.data),

  setGlobalDiscount: (discountPercent: number) =>
    api
      .post<{
        ok: boolean;
        globalDiscountPercent: number;
        updatedMedicinesCount: number;
      }>("/admin/medicine/global-discount", { discountPercent })
      .then((r) => r.data),

  setSinglePricing: (
    productId: string,
    data: {
      discountMode: "GLOBAL" | "PERCENT" | "FIXED" | "NONE";
      discountValue?: number;
    },
  ) =>
    api
      .post(`/admin/medicine/single-pricing/${productId}`, data)
      .then((r) => r.data),
};
