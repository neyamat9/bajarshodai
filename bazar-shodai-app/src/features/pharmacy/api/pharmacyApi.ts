import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { ProductCardData } from '@/features/home/types';
import { PrescriptionRecord, UploadPrescriptionPayload } from '../types';

export async function fetchMedicinesApi(
  type?: 'ALL' | 'OTC' | 'PRESCRIPTION',
  search?: string,
): Promise<ProductCardData[]> {
  const params: string[] = ['category=medicine'];
  if (type && type !== 'ALL') params.push(`medicineType=${type}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);

  const qs = `?${params.join('&')}`;
  const res = await api.get<any>(`/customer/products${qs}`);
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
}

export async function fetchCustomerPrescriptionsApi(): Promise<PrescriptionRecord[]> {
  return api.get<PrescriptionRecord[]>('/customer/prescriptions');
}

export async function uploadPrescriptionApi(
  payload: UploadPrescriptionPayload,
): Promise<PrescriptionRecord> {
  const formData = new FormData();
  formData.append('phone', payload.phone);
  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  const filename = payload.fileName || payload.fileUri.split('/').pop() || 'prescription.jpg';
  const type = payload.mimeType || 'image/jpeg';

  // React Native file representation for multipart upload
  formData.append('file', {
    uri: payload.fileUri,
    name: filename,
    type,
  } as unknown as Blob);

  return api.post<PrescriptionRecord>('/prescriptions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function deleteCustomerPrescriptionApi(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/customer/prescriptions/${encodeURIComponent(id)}`);
}

export function useCustomerPrescriptions() {
  return useQuery({
    queryKey: ['customer-prescriptions'],
    queryFn: fetchCustomerPrescriptionsApi,
    staleTime: 1000 * 60 * 3,
  });
}

export function useUploadPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadPrescriptionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-prescriptions'] });
    },
  });
}

export function useDeletePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomerPrescriptionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-prescriptions'] });
    },
  });
}
