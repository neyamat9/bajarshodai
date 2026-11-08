import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locale";

export interface BuildWhatsAppOrderParams {
  whatsappNumber?: string | null;
  hotline?: string | null;
  productName: string;
  productSlug: string;
  productPrice: number;
  locale?: Locale | string;
  template?: string | null;
  baseUrl?: string;
}

/**
 * Normalizes a Bangladeshi or international phone number for WhatsApp wa.me links.
 * e.g., "01712-345678" -> "8801712345678"
 *       "+8801712345678" -> "8801712345678"
 */
export function sanitizeWhatsAppNumber(rawNumber?: string | null): string {
  if (!rawNumber) return "";
  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("88")) return digits;
  if (digits.startsWith("01")) return `88${digits}`;
  return digits;
}

/**
 * Builds the direct WhatsApp ordering URL with customized pre-defined message and product URL.
 */
export function buildWhatsAppOrderUrl(params: BuildWhatsAppOrderParams): string {
  const {
    whatsappNumber,
    hotline,
    productName,
    productSlug,
    productPrice,
    locale = "bn",
    template,
    baseUrl = typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://bajarshodai.com",
  } = params;

  const phone = sanitizeWhatsAppNumber(whatsappNumber || hotline);
  if (!phone) return "";

  const formattedPrice = formatMoney(productPrice, (locale as Locale) || "bn");
  const productUrl = `${baseUrl.replace(/\/+$/, "")}/products/${productSlug}`;

  // Default templates if Admin hasn't customized in dashboard settings
  const defaultTemplate =
    locale === "bn"
      ? "আসসালামু আলাইকুম! আমি বাজার সদাই থেকে এই পণ্যটি অর্ডার করতে চাই:\n📦 পণ্য: {product_name}\n💰 মূল্য: {product_price}\n🔗 লিংক: {product_url}"
      : "Hello! I would like to order this product from Bazar Shodai:\n📦 Product: {product_name}\n💰 Price: {product_price}\n🔗 Link: {product_url}";

  const activeTemplate = template && template.trim().length > 0 ? template : defaultTemplate;

  const message = activeTemplate
    .replace(/\{product_name\}/g, productName)
    .replace(/\{product_price\}/g, formattedPrice)
    .replace(/\{product_url\}/g, productUrl);

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

