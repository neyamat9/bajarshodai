import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locale";

export interface BuildMessengerOrderParams {
  messengerUsername?: string | null;
  productName: string;
  productSlug: string;
  productPrice: number;
  locale?: Locale | string;
  template?: string | null;
  baseUrl?: string;
}

/**
 * Sanitizes a Facebook Messenger username, handle, or URL into a clean username/page ID for m.me links.
 * Handles:
 *   - "bajarshodai2" -> "bajarshodai2"
 *   - "@bajarshodai2" -> "bajarshodai2"
 *   - "https://m.me/bajarshodai2" -> "bajarshodai2"
 *   - "https://facebook.com/bajarshodai2/" -> "bajarshodai2"
 *   - "https://www.facebook.com/profile.php?id=123456" -> "123456"
 */
export function sanitizeMessengerUsername(raw?: string | null): string {
  if (!raw) return "";
  let clean = raw.trim();
  if (!clean) return "";

  // Handle URL forms
  if (clean.includes("profile.php?id=")) {
    const match = clean.match(/id=([0-9]+)/);
    if (match?.[1]) return match[1];
  }

  // Strip protocol, domain, and paths
  const stripped = clean
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?(facebook\.com|fb\.com|m\.me)\//i, "")
    .replace(/^\/?messages\/t\//i, "")
    .replace(/^@/, "");

  clean = (stripped.split(/[?#]/)[0] ?? "").replace(/\/+$/, "").trim();

  return clean;
}

/**
 * Returns the direct m.me URL for the sanitized Messenger username.
 */
export function buildMessengerUrl(username?: string | null): string {
  const clean = sanitizeMessengerUsername(username);
  if (!clean) return "";
  return `https://m.me/${clean}`;
}

/**
 * Builds the localized formatted order message to be copied for Messenger.
 */
export function buildMessengerOrderMessage(params: BuildMessengerOrderParams): string {
  const {
    productName,
    productSlug,
    productPrice,
    locale = "bn",
    template,
    baseUrl = typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://bajarshodai.com",
  } = params;

  const formattedPrice = formatMoney(productPrice, (locale as Locale) || "bn");
  const productUrl = `${baseUrl.replace(/\/+$/, "")}/products/${productSlug}`;

  const defaultTemplate =
    locale === "bn"
      ? "আসসালামু আলাইকুম! আমি বাজার সদাই থেকে এই পণ্যটি অর্ডার করতে চাই:\n📦 পণ্য: {product_name}\n💰 মূল্য: {product_price}\n🔗 লিংক: {product_url}"
      : "Hello! I would like to order this product from Bazar Shodai:\n📦 Product: {product_name}\n💰 Price: {product_price}\n🔗 Link: {product_url}";

  const activeTemplate = template && template.trim().length > 0 ? template : defaultTemplate;

  return activeTemplate
    .replace(/\{product_name\}/g, productName)
    .replace(/\{product_price\}/g, formattedPrice)
    .replace(/\{product_url\}/g, productUrl);
}
