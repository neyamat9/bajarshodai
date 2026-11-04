import { z } from 'zod';

/**
 * Environment Variables Schema
 * Validates all required public runtime variables on startup.
 */
const envSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z
    .string()
    .url('EXPO_PUBLIC_API_BASE_URL must be a valid URL')
    .default('https://bazar-shodai-api.onrender.com/api'),
  EXPO_PUBLIC_SITE_URL: z
    .string()
    .url('EXPO_PUBLIC_SITE_URL must be a valid URL')
    .default('https://bazarshodai.com'),
});

const rawEnv = {
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL,
};

const parsedResult = envSchema.safeParse(rawEnv);

if (!parsedResult.success) {
  const issues = parsedResult.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`[ENV VALIDATION ERROR] Invalid environment variables:\n${issues}`);
}

const validated = parsedResult.data;

/**
 * Normalized immutable application environment configuration
 */
export const ENV = {
  /**
   * Backend REST API Base URL (guaranteed without trailing slash)
   */
  API_BASE_URL: validated.EXPO_PUBLIC_API_BASE_URL.replace(/\/+$/, ''),

  /**
   * Customer Web Storefront URL
   */
  SITE_URL: validated.EXPO_PUBLIC_SITE_URL.replace(/\/+$/, ''),

  /**
   * Development flag (true in Expo Go or dev client builds)
   */
  IS_DEV: __DEV__,

  /**
   * Production build flag
   */
  IS_PROD: !__DEV__,
} as const;

export type AppEnvironment = typeof ENV;

