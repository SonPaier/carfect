import { Font } from '@react-pdf/renderer';

const INTER_REGULAR_URL =
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2';
const INTER_BOLD_URL =
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2';

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
