import { describe, it, expect } from 'vitest';
import { normalizeSearchQuery, sanitizeForPostgrest } from './textUtils';

describe('normalizeSearchQuery', () => {
  it('removes whitespace from query', () => {
    expect(normalizeSearchQuery('Jan Kowalski')).toBe('JanKowalski');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeSearchQuery('')).toBe('');
  });
});

describe('sanitizeForPostgrest', () => {
  it('strips PostgREST special characters', () => {
    expect(sanitizeForPostgrest('test(value)')).toBe('testvalue');
    expect(sanitizeForPostgrest('50%')).toBe('50');
    expect(sanitizeForPostgrest('a,b.c')).toBe('abc');
    expect(sanitizeForPostgrest('name_test')).toBe('nametest');
  });

  it('preserves normal text', () => {
    expect(sanitizeForPostgrest('Jan Kowalski')).toBe('Jan Kowalski');
    expect(sanitizeForPostgrest('ul. Marszałkowska')).toBe('ul Marszałkowska');
  });

  it('handles empty string', () => {
    expect(sanitizeForPostgrest('')).toBe('');
  });

  it('strips all special chars from complex input', () => {
    expect(sanitizeForPostgrest('test(1,2).value_3%')).toBe('test12value3');
  });
});
