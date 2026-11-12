import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { formatBdt } from './format';
import { toast } from '@/store/useToastStore';

export interface BuildMessengerOrderParams {
  messengerUsername?: string | null;
  productName: string;
  productSlug: string;
  productPrice: number;
  isBn?: boolean;
  template?: string | null;
  baseUrl?: string;
}

/**
 * Sanitizes a Facebook Messenger username, handle, or URL into a clean username/page ID.
 * Examples:
 *   - "bajarshodai2" -> "bajarshodai2"
 *   - "@bajarshodai2" -> "bajarshodai2"
 *   - "https://m.me/bajarshodai2" -> "bajarshodai2"
 *   - "https://facebook.com/bajarshodai2/" -> "bajarshodai2"
 *   - "https://www.facebook.com/profile.php?id=123456" -> "123456"
 */
export function sanitizeMessengerUsername(raw?: string | null): string {
  if (!raw) return '';
  let clean = raw.trim();
  if (!clean) return '';

  if (clean.includes('profile.php?id=')) {
    const match = clean.match(/id=([0-9]+)/);
    if (match?.[1]) return match[1];
  }

  const stripped = clean
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?(facebook\.com|fb\.com|m\.me)\//i, '')
    .replace(/^\/?messages\/t\//i, '')
    .replace(/^@/, '');

  clean = (stripped.split(/[?#]/)[0] ?? '').replace(/\/+$/, '').trim();

  return clean;
}

/**
 * Direct HTTPS m.me URL
 */
export function buildMessengerUrl(username?: string | null): string {
  const clean = sanitizeMessengerUsername(username);
  if (!clean) return '';
  return `https://m.me/${clean}`;
}

/**
 * Native Messenger deep link scheme
 */
export function buildMessengerAppUrl(username?: string | null): string {
  const clean = sanitizeMessengerUsername(username);
  if (!clean) return '';
  return `fb-messenger://user-thread/${clean}`;
}

/**
 * Localized order text template
 */
export function buildMessengerOrderMessage(params: BuildMessengerOrderParams): string {
  const {
    productName,
    productSlug,
    productPrice,
    isBn = true,
    template,
    baseUrl = 'https://bajarshodai.com',
  } = params;

  const formattedPrice = formatBdt(productPrice, { locale: isBn ? 'bn' : 'en' });
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const productUrl = `${cleanBaseUrl}/products/${productSlug}`;

  const defaultTemplate = isBn
    ? 'আসসালামু আলাইকুম! আমি বাজার সদাই থেকে এই পণ্যটি অর্ডার করতে চাই:\n📦 পণ্য: {product_name}\n💰 মূল্য: {product_price}\n🔗 লিংক: {product_url}'
    : 'Hello! I would like to order this product from Bazar Shodai:\n📦 Product: {product_name}\n💰 Price: {product_price}\n🔗 Link: {product_url}';

  const activeTemplate = template && template.trim().length > 0 ? template : defaultTemplate;

  return activeTemplate
    .replace(/\{product_name\}/g, productName)
    .replace(/\{product_price\}/g, formattedPrice)
    .replace(/\{product_url\}/g, productUrl);
}

/**
 * 1-click order handler: copies details to clipboard, alerts user with toast,
 * and launches Messenger (native app preferred, web fallback).
 */
export async function openMessengerOrder(params: BuildMessengerOrderParams): Promise<boolean> {
  const username = sanitizeMessengerUsername(params.messengerUsername) || 'bajarshodai2';
  const webUrl = buildMessengerUrl(username);
  const appUrl = buildMessengerAppUrl(username);

  const message = buildMessengerOrderMessage(params);

  // 1. Copy formatted order details to clipboard
  try {
    await Clipboard.setStringAsync(message);
    toast.success(
      params.isBn ? 'অর্ডার তথ্য কপি হয়েছে!' : 'Order details copied!',
      params.isBn ? 'মেসেঞ্জারে পেস্ট করে পাঠিয়ে দিন।' : 'Paste in Messenger to send.',
    );
  } catch {
    // Continue opening Messenger even if clipboard copy fails
  }

  // 2. Try native Messenger deep link first
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return true;
    }
  } catch {
    // Native app not available or cannot open; fallback to web URL
  }

  // 3. Fallback to HTTPS m.me URL
  try {
    await Linking.openURL(webUrl);
    return true;
  } catch {
    return false;
  }
}
