import { ENV } from '@/config/env';

const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts a raw image URL/path from the API into a fully-qualified URL.
 * Handles absolute URLs, relative /uploads paths, and cleans local dev hosts.
 */
export function assetUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  const clean = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  if (/^https?:\/\//i.test(clean)) return clean;
  const assetBase = (ENV.API_BASE_URL || 'https://bazar-shodai-api.onrender.com/api').replace(
    /\/api\/?$/,
    '',
  );
  return `${assetBase}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

/**
 * Converts English number/string to Bengali numerals
 */
export function toBengaliNumerals(num: number | string): string {
  return String(num).replace(/\d/g, (digit) => BENGALI_NUMERALS[parseInt(digit, 10)] ?? digit);
}

/**
 * Formats a currency amount into standard BDT currency string (e.g. ৳1,250 or ৳১,২৫০)
 */
export function formatBdt(
  amount: number | string,
  options?: { locale?: 'en' | 'bn'; showDecimals?: boolean },
): string {
  const { locale = 'bn', showDecimals = false } = options ?? {};

  const num = typeof amount === 'number' && !isNaN(amount) ? amount : Number(amount) || 0;
  const rounded = showDecimals ? num.toFixed(2) : Math.round(num).toString();
  const parts = rounded.split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1];

  // South Asian grouping: 1,00,000 or standard 1,000
  const formattedInt = Number(intPart).toLocaleString('en-IN');
  const fullFormatted = decPart ? `${formattedInt}.${decPart}` : formattedInt;

  if (locale === 'bn') {
    return `৳${toBengaliNumerals(fullFormatted)}`;
  }
  return `৳${fullFormatted}`;
}
