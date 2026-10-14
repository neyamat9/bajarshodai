import { defineRouting } from "next-intl/routing";

// Bangla is the default and has no prefix in the address (/products). English lives under /en (/en/products).
// The browser's own language is ignored on purpose: everyone starts in Bangla and can switch to English.
export const routing = defineRouting({
  locales: ["bn", "en"],
  defaultLocale: "bn",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const isLocale = (value: string | undefined | null): value is Locale =>
  !!value && (routing.locales as readonly string[]).includes(value);
