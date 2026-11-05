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
 * Unwraps standard NestJS API envelop: { success: boolean, message: string, data: T }
 */
function unwrapResponse<T>(resData: unknown): T {
  if (resData && typeof resData === 'object' && 'success' in resData && 'data' in resData) {
    return (resData as { data: T }).data;
  }
  return resData as T;
}

/**
 * Type-safe API Request Helpers
 */
export const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.get(url, config).then((res) => unwrapResponse<T>(res.data));
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.post(url, data, config).then((res) => unwrapResponse<T>(res.data));
  },

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.put(url, data, config).then((res) => unwrapResponse<T>(res.data));
  },

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.patch(url, data, config).then((res) => unwrapResponse<T>(res.data));
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.delete(url, config).then((res) => unwrapResponse<T>(res.data));
  },

  /**
   * Health ping to verify backend connectivity
   */
  ping(): Promise<PingResponse> {
    return apiClient.get('/ping').then((res) => res.data);
  },
};
