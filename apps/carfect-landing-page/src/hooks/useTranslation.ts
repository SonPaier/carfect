import pl from '@/locales/pl.json';

type TranslationKeys = typeof pl;

export const useTranslation = () => {
  const t = <K extends keyof TranslationKeys>(section: K): TranslationKeys[K] => {
    return pl[section];
  };

  const tRaw = () => pl;

  return { t, tRaw };
};
