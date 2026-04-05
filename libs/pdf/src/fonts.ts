import { Font } from '@react-pdf/renderer';
import path from 'path';

export function registerFonts() {
  const fontsDir = path.join(__dirname, '..', 'fonts');

  Font.register({
    family: 'Inter',
    fonts: [
      { src: path.join(fontsDir, 'Inter-Regular.ttf'), fontWeight: 'normal' },
      { src: path.join(fontsDir, 'Inter-Bold.ttf'), fontWeight: 'bold' },
    ],
  });

  // Custom fonts lack hyphenation dictionaries — disable to prevent crashes
  Font.registerHyphenationCallback((word: string) => [word]);
}
