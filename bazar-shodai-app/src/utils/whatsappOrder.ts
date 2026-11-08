import { Linking } from 'react-native';
import { formatBdt } from './format';

export interface BuildWhatsAppOrderParams {
  whatsappNumber?: string | null;
  hotline?: string | null;
  productName: string;
  productSlug: string;
  productPrice: number;
  isBn?: boolean;
  template?: string | null;
  baseUrl?: string;
}

/**
 * Normalizes phone number to international WhatsApp format (e.g. 01712... -> 8801712...)
 */
export function sanitizeWhatsAppNumber(rawNumber?: string | null): string {
  if (!rawNumber) return '';
  const digits = rawNumber.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('88')) return digits;
  if (digits.startsWith('01')) return `88${digits}`;
  return digits;
}

/**
 * Formats the message replacing placeholders: {product_name}, {product_price}, {product_url}
 */
export function buildWhatsAppOrderMessage(params: BuildWhatsAppOrderParams): string {
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
 * Generates both direct app scheme and web fallback URLs
 */
export function buildWhatsAppOrderUrls(params: BuildWhatsAppOrderParams): {
  phone: string;
  message: string;
  appUrl: string;
  webUrl: string;
} {
  const phone = sanitizeWhatsAppNumber(params.whatsappNumber || params.hotline);
  if (!phone) {
    return { phone: '', message: '', appUrl: '', webUrl: '' };
  }

  const message = buildWhatsAppOrderMessage(params);
  const encodedMessage = encodeURIComponent(message);

  return {
    phone,
    message,
    appUrl: `whatsapp://send?phone=${phone}&text=${encodedMessage}`,
    webUrl: `https://wa.me/${phone}?text=${encodedMessage}`,
  };
}

/**
 * Opens WhatsApp directly using the native scheme if available, falling back to the web link
 */
export async function openWhatsAppOrder(params: BuildWhatsAppOrderParams): Promise<boolean> {
  const { appUrl, webUrl } = buildWhatsAppOrderUrls(params);
  if (!webUrl) return false;

  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return true;
    }
  } catch {
    // Native scheme failed or unsupported; fallback to web URL
  }

  try {
    await Linking.openURL(webUrl);
    return true;
  } catch {
    return false;
  }
}

