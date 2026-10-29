import { api, assetUrl } from '../api/client';

export type PrescriptionStatus = 'PENDING' | 'REVIEWED' | 'ORDER_CREATED' | 'REJECTED';

export interface Prescription {
  id: string;
  userId: string | null;
  phone: string;
  imageUrl: string;
  notes: string | null;
  status: PrescriptionStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getMyPrescriptions(): Promise<Prescription[]> {
  const data = await api.get<Prescription[]>('/customer/prescriptions');
  return (data || []).map((rx) => ({
    ...rx,
    imageUrl: assetUrl(rx.imageUrl),
  }));
}

export async function deleteMyPrescription(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/customer/prescriptions/${id}`);
}

