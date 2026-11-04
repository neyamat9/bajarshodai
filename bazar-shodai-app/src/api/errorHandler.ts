import { AxiosError } from 'axios';

export interface NestApiErrorPayload {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export interface AppError {
  message: string;
  statusCode: number;
  errors?: string[];
  isNetworkError: boolean;
}

/**
 * Normalizes Axios and NestJS API errors into a consistent typed structure
 */
export function normalizeApiError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return {
        message: 'No internet connection or server unreachable.',
        statusCode: 0,
        isNetworkError: true,
      };
    }

    const data = error.response.data as NestApiErrorPayload | undefined;
    const statusCode = error.response.status;

    let message = 'An unexpected error occurred. Please try again.';
    let errors: string[] | undefined;

    if (data) {
      if (Array.isArray(data.message)) {
        errors = data.message;
        message = data.message[0] ?? message;
      } else if (typeof data.message === 'string') {
        message = data.message;
      } else if (typeof data.error === 'string') {
        message = data.error;
      }
    }

    return {
      message,
      statusCode,
      errors,
      isNetworkError: false,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      isNetworkError: false,
    };
  }

  return {
    message: 'An unknown error occurred.',
    statusCode: 500,
    isNetworkError: false,
  };
}

/**
 * Convenience extractor for user-friendly error banners and toasts
 */
export function getErrorMessage(error: unknown, fallback: string = 'Something went wrong'): string {
  const normalized = normalizeApiError(error);
  return normalized.message || fallback;
}
