import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from './locales/pl.json';
import en from './locales/en.json';
import de from './locales/de.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'pl', label: 'Polski' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const LANGUAGE_CACHE_KEY = 'carfect_language';
const cachedLang = localStorage.getItem(LANGUAGE_CACHE_KEY);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: pl },
      en: { translation: en },
      de: { translation: de },
    },
    lng: cachedLang || 'pl',
    fallbackLng: 'pl',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
