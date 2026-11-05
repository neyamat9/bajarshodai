import { useState, useEffect } from 'react';
import en from './locales/en.json';
import bn from './locales/bn.json';
import { storage } from '@/utils/storage';

export type AppLanguage = 'en' | 'bn';

const STORAGE_LANG_KEY = 'bazar_app_language';

const translations: Record<AppLanguage, Record<string, any>> = {
  en,
  bn,
};

let currentLanguage: AppLanguage = (storage.getString(STORAGE_LANG_KEY) as AppLanguage) || 'bn';

const listeners = new Set<(lang: AppLanguage) => void>();

export function getAppLanguage(): AppLanguage {
  return currentLanguage;
}

export function setAppLanguage(lang: AppLanguage): void {
  currentLanguage = lang;
  storage.setString(STORAGE_LANG_KEY, lang);
  listeners.forEach((fn) => fn(lang));
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLanguage] || translations.en;
  const parts = key.split('.');

  let val: any = dict;
  for (const p of parts) {
    if (val && typeof val === 'object' && p in val) {
      val = val[p];
    } else {
      // Fallback to English
      let fallbackVal: any = translations.en;
      for (const fp of parts) {
        if (fallbackVal && typeof fallbackVal === 'object' && fp in fallbackVal) {
          fallbackVal = fallbackVal[fp];
        } else {
          return key;
        }
      }
      val = fallbackVal;
      break;
    }
  }

  if (typeof val !== 'string') {
    return key;
  }

  if (params) {
    let result = val;
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
    return result;
  }

  return val;
}

export function useTranslation() {
  const [lang, setLang] = useState<AppLanguage>(currentLanguage);

  useEffect(() => {
    const handler = (newLang: AppLanguage) => setLang(newLang);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    t,
    language: lang,
    setLanguage: setAppLanguage,
    isBengali: lang === 'bn',
    isBn: lang === 'bn',
  };
}
