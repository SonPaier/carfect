import { useEffect } from 'react';
import i18n from '@/i18n/config';
import type { SupportedLanguage } from '@/i18n/config';

const LANGUAGE_CACHE_KEY = 'carfect_language';

/**
 * Syncs i18n language with instance settings.
 * Also caches to localStorage so login page can use it without fetching instance.
 */
export function useInstanceLanguage(language: string | undefined | null) {
  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language as SupportedLanguage);
      localStorage.setItem(LANGUAGE_CACHE_KEY, language);
    }
  }, [language]);
}

/**
 * Restores cached language from localStorage (for login page).
 * Call before instanceData is available.
 */
export function restoreCachedLanguage() {
  const cached = localStorage.getItem(LANGUAGE_CACHE_KEY);
  if (cached && cached !== i18n.language) {
    i18n.changeLanguage(cached as SupportedLanguage);
  }
}
