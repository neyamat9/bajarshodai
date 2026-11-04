/* eslint-disable import/no-named-as-default-member */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ENV } from '@/config/env';
import { setupInterceptors } from './interceptors';

/**
 * Primary HTTP Axios Client for Bazar Shodai Mobile API
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach JWT token vault and guest token interceptors
setupInterceptors(apiClient);

export interface PingResponse {
  success: boolean;
  message: string;
}

/**
 * Type-safe API Request Helpers
 */
export const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.get<T>(url, config).then((res) => res.data);
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.post<T>(url, data, config).then((res) => res.data);
  },

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.put<T>(url, data, config).then((res) => res.data);
  },

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.patch<T>(url, data, config).then((res) => res.data);
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.delete<T>(url, config).then((res) => res.data);
  },

  /**
   * Health ping to verify backend connectivity
   */
  ping(): Promise<PingResponse> {
    return api.get<PingResponse>('/ping');
  },
};
