import { describe, it, expect } from 'vitest';
import {
  POLISH_MONTH_NAMES,
  POLISH_MONTH_NAMES_GENITIVE,
  POLISH_MONTH_NAMES_SHORT,
} from './polishDateUtils';

describe('POLISH_MONTH_NAMES', () => {
  it('has exactly 12 entries', () => {
    expect(POLISH_MONTH_NAMES).toHaveLength(12);
  });

  it('starts with Styczeń (January)', () => {
    expect(POLISH_MONTH_NAMES[0]).toBe('Styczeń');
  });

  it('ends with Grudzień (December)', () => {
    expect(POLISH_MONTH_NAMES[11]).toBe('Grudzień');
  });

  it('contains the correct full list in order', () => {
    expect(POLISH_MONTH_NAMES).toEqual([
      'Styczeń',
      'Luty',
      'Marzec',
      'Kwiecień',
      'Maj',
      'Czerwiec',
      'Lipiec',
      'Sierpień',
      'Wrzesień',
      'Październik',
      'Listopad',
      'Grudzień',
    ]);
  });
});

describe('POLISH_MONTH_NAMES_GENITIVE', () => {
  it('has exactly 12 entries', () => {
    expect(POLISH_MONTH_NAMES_GENITIVE).toHaveLength(12);
  });

  it('starts with stycznia (January genitive)', () => {
    expect(POLISH_MONTH_NAMES_GENITIVE[0]).toBe('stycznia');
  });

  it('ends with grudnia (December genitive)', () => {
    expect(POLISH_MONTH_NAMES_GENITIVE[11]).toBe('grudnia');
  });

  it('contains the correct full list in order', () => {
    expect(POLISH_MONTH_NAMES_GENITIVE).toEqual([
      'stycznia',
      'lutego',
      'marca',
      'kwietnia',
      'maja',
      'czerwca',
      'lipca',
      'sierpnia',
      'wrzesnia',
      'pazdziernika',
      'listopada',
      'grudnia',
    ]);
  });
});

describe('POLISH_MONTH_NAMES_SHORT', () => {
  it('has exactly 12 entries', () => {
    expect(POLISH_MONTH_NAMES_SHORT).toHaveLength(12);
  });

  it('starts with sty (January abbreviation)', () => {
    expect(POLISH_MONTH_NAMES_SHORT[0]).toBe('sty');
  });

  it('ends with gru (December abbreviation)', () => {
    expect(POLISH_MONTH_NAMES_SHORT[11]).toBe('gru');
  });

  it('contains the correct full list in order', () => {
    expect(POLISH_MONTH_NAMES_SHORT).toEqual([
      'sty',
      'lut',
      'mar',
      'kwi',
      'maj',
      'cze',
      'lip',
      'sie',
      'wrz',
      'paź',
      'lis',
      'gru',
    ]);
  });
});
