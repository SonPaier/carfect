// Konwersja kwoty PLN na zapis słowny (po polsku) — używane na fakturach.
// Obsługuje wartości 0-999_999_999_999 z dokładnością do groszy.

const ONES = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];

const TEENS = [
  'dziesięć',
  'jedenaście',
  'dwanaście',
  'trzynaście',
  'czternaście',
  'piętnaście',
  'szesnaście',
  'siedemnaście',
  'osiemnaście',
  'dziewiętnaście',
];

const TENS = [
  '',
  '',
  'dwadzieścia',
  'trzydzieści',
  'czterdzieści',
  'pięćdziesiąt',
  'sześćdziesiąt',
  'siedemdziesiąt',
  'osiemdziesiąt',
  'dziewięćdziesiąt',
];

const HUNDREDS = [
  '',
  'sto',
  'dwieście',
  'trzysta',
  'czterysta',
  'pięćset',
  'sześćset',
  'siedemset',
  'osiemset',
  'dziewięćset',
];

type GrammarForm = [singular: string, plural234: string, pluralRest: string];

const SCALES: GrammarForm[] = [
  ['', '', ''],
  ['tysiąc', 'tysiące', 'tysięcy'],
  ['milion', 'miliony', 'milionów'],
  ['miliard', 'miliardy', 'miliardów'],
];

function pickGrammar(n: number, forms: GrammarForm): string {
  if (n === 1) return forms[0];
  const lastTwo = n % 100;
  const lastOne = n % 10;
  if (lastTwo >= 12 && lastTwo <= 14) return forms[2];
  if (lastOne >= 2 && lastOne <= 4) return forms[1];
  return forms[2];
}

function below1000ToWords(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h > 0) parts.push(HUNDREDS[h]);

  if (rest >= 10 && rest <= 19) {
    parts.push(TEENS[rest - 10]);
  } else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (t > 0) parts.push(TENS[t]);
    if (o > 0) parts.push(ONES[o]);
  }

  return parts.join(' ');
}

function integerToWords(n: number): string {
  if (n === 0) return 'zero';

  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.push(rest % 1000);
    rest = Math.floor(rest / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;

    let groupWords: string;
    if (i === 1 && g === 1) {
      // "jeden tysiąc" → po prostu "tysiąc"
      groupWords = '';
    } else {
      groupWords = below1000ToWords(g);
    }

    parts.push(groupWords);
    const scale = SCALES[i];
    if (scale[0]) parts.push(pickGrammar(g, scale));
  }

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Zamienia kwotę (np. 8926.91) na słowny zapis po polsku (np.
 * "osiem tysięcy dziewięćset dwadzieścia sześć PLN dziewięćdziesiąt jeden gr").
 *
 * @param amount kwota dziesiętna (zł.gr)
 * @param currency kod waluty (default: 'PLN')
 */
export function amountToWords(amount: number, currency = 'PLN'): string {
  if (!Number.isFinite(amount) || amount < 0) return '';

  const rounded = Math.round(amount * 100);
  const zlote = Math.floor(rounded / 100);
  const grosze = rounded % 100;

  const zloteWords = integerToWords(zlote);
  const groszeWords = integerToWords(grosze);

  return `${zloteWords} ${currency} ${groszeWords} gr`;
}
