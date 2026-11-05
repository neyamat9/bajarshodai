import { AxiosError } from 'axios';
import { toBengaliNumerals } from '@/utils/format';
import { getAppLanguage } from '@/i18n';

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

const EXACT_TRANSLATIONS: Record<string, string> = {
  // Auth & Account errors
  'This phone number already has an account': 'এই ফোন নম্বরে আগেই অ্যাকাউন্ট আছে',
  'This phone number already has an account. Please log in.':
    'এই ফোন নম্বরে আগেই অ্যাকাউন্ট আছে। অনুগ্রহ করে লগইন করুন।',
  'Invalid Credentials': 'ফোন নম্বর বা পাসওয়ার্ড ঠিক নয়',
  'Invalid credentials': 'ফোন নম্বর বা পাসওয়ার্ড ঠিক নয়',
  'Invalid phone number or password': 'ফোন নম্বর বা পাসওয়ার্ড ঠিক নয়',
  'Email is already registered': 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে',
  'This reset link is invalid or has expired': 'রিসেট লিংকটি ঠিক নয় অথবা মেয়াদ শেষ হয়ে গেছে',
  'This account has been suspended. Please contact support.':
    'এই অ্যাকাউন্টটি বন্ধ আছে। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।',
  'New password must be different from your current password':
    'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে',

  // Validation
  'Name is required': 'নাম লিখুন',
  'Phone number or email is required': 'ফোন নম্বর অথবা ইমেইল লিখুন',
  'Password is required': 'পাসওয়ার্ড লিখুন',
  'Invalid email address': 'সঠিক ইমেইল ঠিকানা লিখুন',
  'Password must be at least 6 characters long': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
  'Name must be at least 2 characters long': 'নাম কমপক্ষে ২ অক্ষরের হতে হবে',
  'Enter a valid Bangladeshi mobile number, e.g. 01712345678':
    'সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন, যেমন ০১৭১২৩৪৫৬৭৮',

  // Cart & Orders
  'Cart is empty': 'আপনার কার্ট খালি',
  'Your cart is empty': 'আপনার কার্ট খালি',
  'Cart item not found': 'কার্টের পণ্যটি পাওয়া যায়নি',
  'Product is out of stock': 'পণ্যটি স্টকে নেই',
  'Product not found': 'পণ্য পাওয়া যায়নি',
  'This product is not for sale at the moment': 'পণ্যটি এখন বিক্রির জন্য নেই',
  'Order not found': 'অর্ডার পাওয়া যায়নি',
  'No order found with this order number and phone number':
    'এই অর্ডার নম্বর ও ফোন নম্বরে কোনো অর্ডার পাওয়া যায়নি',
  'This coupon has reached its usage limit': 'এই কুপনের ব্যবহারের সীমা শেষ',
  'couponCode is required': 'কুপন কোড লিখুন',
  'Daily upload limit reached. Please try again tomorrow.':
    'আজকের ছবি আপলোডের সীমা শেষ। আগামীকাল আবার চেষ্টা করুন।',
  'You already reviewed this product': 'আপনি এই পণ্যের রিভিউ আগেই দিয়েছেন',

  // HTTP generic status
  'Too Many Requests': 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
  'ThrottlerException: Too Many Requests': 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
  'Internal server error': 'সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।',
  'Internal Server Error': 'সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।',
  Unauthorized: 'অনুগ্রহ করে আবার লগইন করুন',
  Forbidden: 'প্রবেশের অনুমতি নেই',
  'Not Found': 'তথ্য পাওয়া যায়নি',
  Conflict: 'এই ফোন নম্বরে আগেই অ্যাকাউন্ট আছে। অনুগ্রহ করে লগইন করুন।',
  'Could not reach the server. Check your connection and try again.':
    'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট দেখে আবার চেষ্টা করুন।',
};

type PatternRule = [RegExp, (m: RegExpMatchArray) => string];
const PATTERN_RULES: PatternRule[] = [
  [
    /^Only (\d+) of this item can be added to the cart$/,
    (m) => `এই পণ্যের মাত্র ${toBengaliNumerals(m[1] ?? '')}টি কার্টে যোগ করা যাবে`,
  ],
  [
    /^A cart can hold at most (\d+) different items$/,
    (m) => `কার্টে সর্বোচ্চ ${toBengaliNumerals(m[1] ?? '')}টি আলাদা পণ্য রাখা যায়`,
  ],
  [/^"(.+)" is no longer available$/, (m) => `"${m[1]}" আর পাওয়া যাচ্ছে না`],
  [/^"(.+)" is out of stock or no longer available$/, (m) => `"${m[1]}" স্টকে নেই অথবা আর পাওয়া যাচ্ছে না`],
  [/^(.+) is not available right now$/, (m) => `${m[1]} এখন পাওয়া যাচ্ছে না`],
  [/^The minimum order is ৳(\d+(?:\.\d+)?)\.?$/, (m) => `ন্যূনতম অর্ডার ৳${toBengaliNumerals(m[1] ?? '')}।`],
  [/^Order cannot be cancelled in "(.+)" status$/, () => 'এই অবস্থায় অর্ডার বাতিল করা যায় না'],
  [/^You can return at most (\d+) of "(.+)"$/, (m) => `"${m[2]}" সর্বোচ্চ ${toBengaliNumerals(m[1] ?? '')}টি ফেরত দেওয়া যাবে`],
  [/^(.+) must be longer than or equal to (\d+) characters$/, (m) => `কমপক্ষে ${toBengaliNumerals(m[2] ?? '')} অক্ষর লিখুন`],
  [/^(.+) should not be empty$/, () => 'ঘরটি খালি রাখা যাবে না'],
  [/^(.+) must be an email$/, () => 'সঠিক ইমেইল ঠিকানা লিখুন'],
];

function translateSinglePiece(rawText: string): string {
  const text = rawText.trim();
  if (EXACT_TRANSLATIONS[text]) {
    return EXACT_TRANSLATIONS[text];
  }
  for (const [re, fn] of PATTERN_RULES) {
    const m = text.match(re);
    if (m) return fn(m);
  }
  return rawText;
}

export function translateApiMessage(message: string, isBn: boolean = true): string {
  if (!isBn || !message) return message;
  const direct = translateSinglePiece(message);
  if (direct !== message) return direct;

  // Split multiple class-validator validation messages joined by ". " or "; "
  const pieces = message.split(/(?<=[a-z0-9"')])\.\s+|;\s+/);
  if (pieces.length > 1) {
    return pieces.map(translateSinglePiece).join('। ');
  }
  return message;
}

/**
 * Normalizes Axios and NestJS API errors into a consistent typed structure with localized message
 */
export function normalizeApiError(error: unknown, isBn?: boolean): AppError {
  const shouldTranslate = isBn ?? getAppLanguage() === 'bn';

  if (error instanceof AxiosError) {
    if (!error.response) {
      return {
        message: shouldTranslate
          ? 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট কানেকশন চেক করুন।'
          : 'No internet connection or server unreachable.',
        statusCode: 0,
        isNetworkError: true,
      };
    }

    const data = error.response.data as NestApiErrorPayload | undefined;
    const statusCode = error.response.status;

    let message = '';
    let errors: string[] | undefined;

    if (data) {
      if (Array.isArray(data.message) && data.message.length > 0) {
        errors = data.message;
        message = data.message[0] ?? '';
      } else if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message.trim();
      } else if (typeof data.error === 'string' && data.error.trim()) {
        message = data.error.trim();
      }
    }

    // Meaningful status-code fallbacks if server sent no explicit message
    if (!message) {
      switch (statusCode) {
        case 409:
          message = 'This phone number already has an account. Please log in.';
          break;
        case 401:
          message = 'Invalid Credentials';
          break;
        case 403:
          message = 'Forbidden';
          break;
        case 404:
          message = 'Not Found';
          break;
        case 429:
          message = 'Too Many Requests';
          break;
        case 500:
        default:
          message = 'Internal server error';
          break;
      }
    }

    const translatedMessage = translateApiMessage(message, shouldTranslate);

    return {
      message: translatedMessage,
      statusCode,
      errors,
      isNetworkError: false,
    };
  }

  if (error instanceof Error) {
    return {
      message: translateApiMessage(error.message, shouldTranslate),
      statusCode: 500,
      isNetworkError: false,
    };
  }

  return {
    message: shouldTranslate ? 'একটি অপ্রত্যাশিত সমস্যা হয়েছে।' : 'An unknown error occurred.',
    statusCode: 500,
    isNetworkError: false,
  };
}

/**
 * Convenience extractor for user-friendly error banners and toasts
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'একটি সমস্যা দেখা দিয়েছে। আবার চেষ্টা করুন।',
  isBn?: boolean,
): string {
  const normalized = normalizeApiError(error, isBn);
  return normalized.message || fallback;
}
