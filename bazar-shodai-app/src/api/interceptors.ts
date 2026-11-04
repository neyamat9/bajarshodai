import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenVault } from '@/utils/secureStore';
import { getOrCreateGuestToken, GUEST_TOKEN_HEADER } from '@/utils/guestToken';
import { ENV } from '@/config/env';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Attaches request and response interceptors to an Axios client instance
 */
export function setupInterceptors(client: AxiosInstance): void {
  // Request Interceptor: Attach JWT & Guest Token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Inject Guest Token for anonymous cart tracking
      const guestToken = getOrCreateGuestToken();
      if (guestToken) {
        config.headers.set(GUEST_TOKEN_HEADER, guestToken);
      }

      // Inject Customer/Rider JWT Bearer Token if present
      const accessToken = await tokenVault.getAccessToken();
      if (accessToken && !config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response Interceptor: Silent Token Refresh & Request Queue
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      // Handle network errors or missing request
      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Do not attempt refresh on auth endpoints to prevent infinite loops
      const isAuthEndpoint =
        originalRequest.url?.includes('/customer/auth/login') ||
        originalRequest.url?.includes('/customer/auth/refresh') ||
        originalRequest.url?.includes('/customer/auth/register');

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          // If already refreshing, wait in the promise queue
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const [refreshToken, userId] = await Promise.all([
          tokenVault.getRefreshToken(),
          tokenVault.getUserId(),
        ]);

        if (!refreshToken || !userId) {
          isRefreshing = false;
          await tokenVault.clearTokens();
          return Promise.reject(error);
        }

        try {
          // Direct unintercepted call to refresh endpoint
          const response = await axios.post<{
            accessToken: string;
            refreshToken?: string;
          }>(
            `${ENV.API_BASE_URL}/customer/auth/refresh`,
            { refreshToken, userId },
            { timeout: 10000 },
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          await tokenVault.saveTokens({
            accessToken,
            refreshToken: newRefreshToken ?? refreshToken,
            userId,
          });

          processQueue(null, accessToken);

          originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await tokenVault.clearTokens();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
}
