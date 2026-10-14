// Language helpers shared by server and browser code (no next-intl import, so it is safe everywhere).

export type Locale = "bn" | "en";
export const DEFAULT_LOCALE: Locale = "bn";

export const isLocale = (v: unknown): v is Locale => v === "bn" || v === "en";

/**
 * The language of the page the browser is showing (<html lang> is set from the address).
 * On the server there is no ambient language, so server code passes the locale explicitly.
 */
export function clientLocale(): Locale {
  if (typeof document !== "undefined") return document.documentElement.lang === "en" ? "en" : "bn";
  return DEFAULT_LOCALE;
}

/** The Bangla text when the page is Bangla and a Bangla text exists, otherwise the English one. */
export function pick(locale: Locale, en?: string | null, bn?: string | null): string {
  return (locale === "bn" && bn ? bn : en) ?? "";
}

/** "/products" -> "/en/products" for English, unchanged for Bangla (Bangla has no prefix). */
export function withLocalePrefix(path: string, locale: Locale): string {
  if (locale !== "en") return path;
  return path === "/" ? "/en" : `/en${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Removes a leading /en or /bn from an address ("/en/products" -> "/products"). */
export function stripLocalePrefix(path: string): string {
  const stripped = path.replace(/^\/(en|bn)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}
