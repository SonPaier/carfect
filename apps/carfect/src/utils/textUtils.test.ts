import { describe, it, expect } from 'vitest';
import { autoCapitalizeWords } from '@shared/utils';

describe('autoCapitalizeWords', () => {
  it('capitalizes first letter of each word', () => {
    expect(autoCapitalizeWords('jan kowalski')).toBe('Jan Kowalski');
  });

  it('capitalizes three-word name', () => {
    expect(autoCapitalizeWords('marian jan rokita')).toBe('Marian Jan Rokita');
  });

  it('preserves already capitalized letters', () => {
    expect(autoCapitalizeWords('Jan Kowalski')).toBe('Jan Kowalski');
  });

  it('handles single word', () => {
    expect(autoCapitalizeWords('adam')).toBe('Adam');
  });

  it('returns empty string for empty input', () => {
    expect(autoCapitalizeWords('')).toBe('');
  });

  it('handles mixed case input', () => {
    expect(autoCapitalizeWords('jAN kOWALSKI')).toBe('JAN KOWALSKI');
  });

  it('handles multiple spaces between words', () => {
    expect(autoCapitalizeWords('jan  kowalski')).toBe('Jan  Kowalski');
  });

  it('handles leading space', () => {
    expect(autoCapitalizeWords(' jan')).toBe(' Jan');
  });
});
