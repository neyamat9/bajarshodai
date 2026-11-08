import { clientLocale, type Locale } from "./locale";

// One place for numbers, money, dates and quantities, in both languages.
// Bangla uses Bangla digits (৳ ৬,২৪৫), English uses 6,245. Bangladesh time everywhere.

const INTL: Record<Locale, string> = { bn: "bn-BD", en: "en-BD" };
const CURRENCY = "৳";

const numberFmt = new Map<string, Intl.NumberFormat>();
function nf(locale: Locale, maxFraction: number, minFraction = 0) {
  const key = `${locale}:${maxFraction}:${minFraction}`;
  let f = numberFmt.get(key);
  if (!f) {
    f = new Intl.NumberFormat(INTL[locale], {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction,
      numberingSystem: locale === "bn" ? "beng" : "latn",
    });
    numberFmt.set(key, f);
  }
  return f;
}

/** 6245 -> "৬,২৪৫" (bn) / "6,245" (en). Decimals are kept only when there are some (up to maxFraction). */
export function formatNumber(value: number, locale: Locale = clientLocale(), maxFraction = 2): string {
  return nf(locale, maxFraction).format(Number.isFinite(value) ? value : 0);
}

/** Whole taka for prices; paisa only when the amount really has them. */
export function formatMoney(value: number, locale: Locale = clientLocale()): string {
  const n = Number.isFinite(value) ? value : 0;
  const hasPaisa = Math.abs(n - Math.round(n)) > 0.004;
  return `${CURRENCY}${nf(locale, hasPaisa ? 2 : 0, hasPaisa ? 2 : 0).format(n)}`;
}

/** A quantity such as 0.5 or 2 (up to 3 decimals, no trailing zeros). */
export function formatQuantity(value: number, locale: Locale = clientLocale()): string {
  return nf(locale, 3).format(Number.isFinite(value) ? value : 0);
}

/** Bangla digits typed on a phone keyboard become ordinary digits ("০১৭১২" -> "01712"); the server only reads those. */
export function latinDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
}

/** Only the digits of a string become Bangla digits ("01712345678" -> "০১৭১২৩৪৫৬৭৮"). */
export function localizeDigits(text: string | number, locale: Locale = clientLocale()): string {
  const s = String(text);
  if (locale !== "bn") return s;
  return s.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}

type DateInput = string | number | Date | null | undefined;
const toDate = (v: DateInput) => (v instanceof Date ? v : new Date(v ?? NaN));

export function formatDate(
  value: DateInput,
  locale: Locale = clientLocale(),
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(INTL[locale], { timeZone: "Asia/Dhaka", numberingSystem: locale === "bn" ? "beng" : "latn", ...opts }).format(d);
}

export function formatDateTime(value: DateInput, locale: Locale = clientLocale()): string {
  return formatDate(value, locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Formats an order delivery arrival window including date and hour/slot.
 * E.g. "১২ নভে ২০২৬, ০৪:০০ PM - ০৬:০০ PM" or "Nov 12, 2026, 4:30 PM".
 */
export function formatDeliveryWindow(
  estimatedDelivery?: DateInput,
  deliverySlot?: string | null,
  locale: Locale = clientLocale(),
): string {
  const datePart = estimatedDelivery ? formatDate(estimatedDelivery, locale) : "";
  const slot = deliverySlot?.trim();
  if (slot) {
    const formattedSlot = locale === "bn" ? localizeDigits(slot, locale) : slot;
    return datePart ? `${datePart}, ${formattedSlot}` : formattedSlot;
  }
  if (estimatedDelivery) {
    return formatDateTime(estimatedDelivery, locale);
  }
  return "";
}

/** "5 items" / "৫টি পণ্য" style counts are written by the messages; this only formats the number. */
export const formatCount = (n: number, locale: Locale = clientLocale()) => formatNumber(n, locale, 0);
