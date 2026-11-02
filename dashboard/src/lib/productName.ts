import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { lang } from "@/i18n";
import { settingsApi } from "@/api/system";

export type ProductNameLanguage = "auto" | "bn" | "en";

export const PRODUCT_NAME_LANG_STORAGE = "bs-product-name-lang";

export function getSavedProductNameLang(): ProductNameLanguage {
  try {
    const val = localStorage.getItem(PRODUCT_NAME_LANG_STORAGE);
    if (val === "bn" || val === "en" || val === "auto") return val;
  } catch {
    // ignore
  }
  return "auto";
}

export function saveProductNameLang(pref: ProductNameLanguage) {
  try {
    localStorage.setItem(PRODUCT_NAME_LANG_STORAGE, pref);
    window.dispatchEvent(new Event("bs-product-name-lang-change"));
  } catch {
    // ignore
  }
}

export interface ProductNameDisplay {
  primary: string;
  secondary: string | null;
}

/**
 * Pure function to format product name based on explicit or saved preference.
 */
export function formatProductName(
  p: { name: string; nameBn?: string | null },
  preference: ProductNameLanguage = getSavedProductNameLang(),
): ProductNameDisplay {
  const effectiveLang: "en" | "bn" =
    preference === "en"
      ? "en"
      : preference === "bn"
      ? "bn"
      : lang() === "en"
      ? "en"
      : "bn";

  if (effectiveLang === "en") {
    return {
      primary: p.name || p.nameBn || "",
      secondary: p.nameBn && p.nameBn !== p.name ? p.nameBn : null,
    };
  }

  // Bangla mode
  return {
    primary: p.nameBn || p.name || "",
    secondary: p.name && p.name !== p.nameBn ? p.name : null,
  };
}

/**
 * React hook that reacts to both backend settings and local preference changes.
 */
export function useProductNameDisplay() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
    staleTime: 60_000,
  });

  const backendPref = settings?.site?.productNameLanguage;
  const [localPref, setLocalPref] = useState<ProductNameLanguage>(() => {
    return backendPref || getSavedProductNameLang();
  });

  useEffect(() => {
    if (backendPref) {
      setLocalPref(backendPref);
      saveProductNameLang(backendPref);
    }
  }, [backendPref]);

  useEffect(() => {
    const handler = () => {
      setLocalPref(getSavedProductNameLang());
    };
    window.addEventListener("bs-product-name-lang-change", handler);
    return () => window.removeEventListener("bs-product-name-lang-change", handler);
  }, []);

  const format = (p: { name: string; nameBn?: string | null }): ProductNameDisplay => {
    return formatProductName(p, localPref);
  };

  return {
    preference: localPref,
    format,
  };
}

