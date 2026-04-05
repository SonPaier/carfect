import { describe, it, expect } from 'vitest';
import { autoCapitalizeWords, sanitizeUsername } from '@shared/utils';

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

describe('sanitizeUsername', () => {
  it('converts uppercase letters to lowercase', () => {
    expect(sanitizeUsername('JohnDoe')).toBe('johndoe');
  });

  it('strips spaces', () => {
    expect(sanitizeUsername('jan kowalski')).toBe('jankowalski');
  });

  it('strips Polish diacritics', () => {
    expect(sanitizeUsername('ąćęłńóśźż')).toBe('');
  });

  it('strips special characters like @, !, #', () => {
    expect(sanitizeUsername('jan@kowalski!')).toBe('jankowalski');
  });

  it('allows letters, digits, dots and hyphens', () => {
    expect(sanitizeUsername('jan.kowalski-123')).toBe('jan.kowalski-123');
  });

  it('strips underscores', () => {
    expect(sanitizeUsername('jan_kowalski')).toBe('jankowalski');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeUsername('')).toBe('');
  });

  it('returns empty string for input with only special chars', () => {
    expect(sanitizeUsername('!@#$%^&*()')).toBe('');
  });

  it('preserves digits', () => {
    expect(sanitizeUsername('user123')).toBe('user123');
  });

  it('strips Polish chars from realistic employee name', () => {
    // "Anna Kowalska-Nowak" has a hyphen that should be preserved
    expect(sanitizeUsername('Anna Kowalska-Nowak')).toBe('annakowalska-nowak');
  });

  it('strips diacritics and spaces from Polish name with accents', () => {
    // "Łukasz" → strip Ł (not ascii), keep "ukasz"
    expect(sanitizeUsername('Łukasz')).toBe('ukasz');
  });
});
