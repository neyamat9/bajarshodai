import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { bn } from "./bn";

// The dashboard is written in English: the English text IS the key. English is the default
// language for the admin dashboard; users can switch to Bangla anytime via the language toggle.
export type Lang = "bn" | "en";
const STORAGE = "bs-admin-lang";

export function savedLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE);
    return v === "bn" ? "bn" : "en";
  } catch {
    return "en";
  }
}

void i18next.use(initReactI18next).init({
  lng: savedLang(),
  resources: { bn: { translation: bn } },
  keySeparator: false,
  nsSeparator: false,
  returnNull: false,
  // a missing Bangla text is shown in English instead of an empty gap
  fallbackLng: false,
  interpolation: { escapeValue: false },
  initAsync: false,
});

document.documentElement.lang = i18next.language;

export const lang = (): Lang => (i18next.language === "en" ? "en" : "bn");

/** Translate an English text (with {{values}} if needed). Safe outside React; the page is rebuilt when the language changes. */
export const tr = (text: string, values?: Record<string, string | number>): string => {
  // a text written with a space at the end ("Done: ") is looked up without it and keeps the space
  const trimmed = text.trim();
  if (trimmed !== text) return text.replace(trimmed, i18next.t(trimmed, values));
  return i18next.t(text, values);
};

export function setLang(next: Lang) {
  try {
    localStorage.setItem(STORAGE, next);
  } catch {
    /* private mode: the choice lasts until the tab closes */
  }
  document.documentElement.lang = next;
  void i18next.changeLanguage(next).then(() => {
    // the pages build their tables and labels while loading, so the simplest correct switch is to load them again
    // (the sign-in and everything saved stays: it lives in the browser)
    if (typeof window !== "undefined" && typeof window.location?.reload === "function") window.location.reload();
  });
}

export default i18next;

/** A lookup table whose values are translated when they are read (so they follow the language, not the moment the file loaded). */
export function trMap<T extends Record<string, string>>(table: T): T {
  return new Proxy(table, { get: (t, k) => (typeof k === "string" && k in t ? tr(t[k]) : undefined) });
}
