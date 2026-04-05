import { Font } from '@react-pdf/renderer';

// Full Inter TTF with Polish characters, hosted on Supabase Storage
const INTER_REGULAR_URL =
  'https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/instance-logos/fonts/Inter-Regular.ttf';
const INTER_BOLD_URL =
  'https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/instance-logos/fonts/Inter-Bold.ttf';

export function registerFonts() {
  Font.register({
    family: 'Inter',
    fonts: [
      { src: INTER_REGULAR_URL, fontWeight: 'normal' },
      { src: INTER_BOLD_URL, fontWeight: 'bold' },
    ],
  });

  // Custom fonts lack hyphenation dictionaries — disable to prevent crashes
  Font.registerHyphenationCallback((word: string) => [word]);
}
