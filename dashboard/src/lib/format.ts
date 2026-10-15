import { format as fmt, formatDistanceToNowStrict } from "date-fns";
import { bn as bnLocale } from "date-fns/locale";
import { lang, tr } from "@/i18n";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
/** 0-9 become ০-৯ when the dashboard is in Bangla. */
export const digits = (s: string) => (lang() === "bn" ? s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : s);
const locale = () => (lang() === "bn" ? "bn-BD" : "en-BD");
// date-fns writes Latin digits whatever the language: turn them into Bangla ones when needed
const format = (d: Date, pattern: string) => digits(fmt(d, pattern, lang() === "bn" ? { locale: bnLocale } : undefined));

export const money = (n: number | string | null | undefined, opts: { decimals?: boolean } = {}) => {
  const v = Number(n ?? 0);
  const s = v.toLocaleString(locale(), {
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : v % 1 === 0 ? 0 : 2,
  });
  return `৳${s}`;
};

export const num = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString(locale());

export const dateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "—" : format(x, "dd MMM yyyy, h:mm a");
};

export const dateOnly = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "—" : format(x, "dd MMM yyyy");
};

export const timeAgo = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return lang() === "bn"
    ? `${digits(formatDistanceToNowStrict(x, { locale: bnLocale }))} ${tr("ago")}`
    : `${formatDistanceToNowStrict(x)} ago`;
};

// Local calendar day as yyyy-MM-dd (what the API treats as a Bangladesh day)
export const isoDay = (d: Date) => fmt(d, "yyyy-MM-dd");

/** "IN_TRANSIT" → "In transit", "OUT_FOR_DELIVERY" → "Out for delivery": the one wording the admin and the shop both use for order statuses. */
export const orderStatusLabel = (s: string) => {
  const t = s.toLowerCase().replace(/[_-]+/g, " ").trim();
  return tr(t.charAt(0).toUpperCase() + t.slice(1));
};

export const titleCase = (s: string) =>
  tr(
    s
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  );

// datetime-local input value <-> ISO
export const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return fmt(d, "yyyy-MM-dd'T'HH:mm");
};
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
