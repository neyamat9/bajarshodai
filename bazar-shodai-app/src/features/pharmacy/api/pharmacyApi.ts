import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { ProductCardData } from '@/features/home/types';
import { PrescriptionRecord, UploadPrescriptionPayload } from '../types';

export interface MedicineQueryParams {
  type?: 'ALL' | 'OTC' | 'PRESCRIPTION';
  search?: string;
  subCategory?: string;
  brand?: string;
  generic?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
}

export interface MedicineFacets {
  brands: { id: string; name: string; slug: string; count: number; logo?: string | null }[];
  generics: { name: string; count: number }[];
  price: { min: number; max: number };
}

export async function fetchMedicineFacetsApi(): Promise<MedicineFacets> {
  try {
    const res = await api.get<any>('/customer/products/filters?category=medicine');
    return {
      brands: Array.isArray(res?.brands) ? res.brands : [],
      generics: Array.isArray(res?.generics) ? res.generics : [],
      price: {
        min: Number(res?.price?.min ?? res?.priceRange?.min ?? 0),
        max: Number(res?.price?.max ?? res?.priceRange?.max ?? 5000),
      },
    };
  } catch {
    return { brands: [], generics: [], price: { min: 0, max: 5000 } };
  }
}

export async function fetchMedicinesApi(
  paramsOrType?: 'ALL' | 'OTC' | 'PRESCRIPTION' | MedicineQueryParams,
  legacySearch?: string,
): Promise<ProductCardData[]> {
  const params: string[] = ['category=medicine'];

  if (typeof paramsOrType === 'string') {
    if (paramsOrType !== 'ALL') params.push(`medicineType=${paramsOrType}`);
    if (legacySearch) params.push(`search=${encodeURIComponent(legacySearch)}`);
  } else if (paramsOrType && typeof paramsOrType === 'object') {
    if (paramsOrType.type && paramsOrType.type !== 'ALL')
      params.push(`medicineType=${paramsOrType.type}`);
    if (paramsOrType.search) params.push(`search=${encodeURIComponent(paramsOrType.search)}`);
    if (paramsOrType.subCategory)
      params.push(`subCategory=${encodeURIComponent(paramsOrType.subCategory)}`);
    if (paramsOrType.brand) params.push(`brand=${encodeURIComponent(paramsOrType.brand)}`);
    if (paramsOrType.generic) params.push(`generic=${encodeURIComponent(paramsOrType.generic)}`);
    if (paramsOrType.minPrice !== undefined) params.push(`minPrice=${paramsOrType.minPrice}`);
    if (paramsOrType.maxPrice !== undefined) params.push(`maxPrice=${paramsOrType.maxPrice}`);
    if (paramsOrType.inStock !== undefined) params.push(`inStock=${paramsOrType.inStock}`);
    if (paramsOrType.sortBy) params.push(`sortBy=${encodeURIComponent(paramsOrType.sortBy)}`);
  }

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
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.min(
          100,
          Math.round((progressEvent.loaded / progressEvent.total) * 100),
        );
        payload.onProgress?.(percent);
      }
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
