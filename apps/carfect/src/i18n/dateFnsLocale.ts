import { pl } from 'date-fns/locale/pl';
import { enGB } from 'date-fns/locale/en-GB';
import { de } from 'date-fns/locale/de';
import i18n from './config';
import type { Locale } from 'date-fns';

const localeMap: Record<string, Locale> = {
  pl,
  en: enGB,
  de,
};

/** Returns the date-fns Locale matching the current i18n language. */
export function getDateLocale(): Locale {
  return localeMap[i18n.language] ?? pl;
}
