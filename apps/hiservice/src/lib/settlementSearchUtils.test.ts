import { describe, it, expect } from 'vitest';
import { matchesSearchQuery } from './settlementSearchUtils';

describe('matchesSearchQuery', () => {
  it('matches single word in customer name', () => {
    expect(matchesSearchQuery('tomasz', ['Tomasz Nastały', 'Montaż rury', null])).toBe(true);
  });

  it('matches single word in title', () => {
    expect(matchesSearchQuery('montaż', ['Tomasz Nastały', 'Montaż rury', null])).toBe(true);
  });

  it('matches words across different fields (name + address)', () => {
    expect(
      matchesSearchQuery('tomasz szarłata', [
        'Tomasz Nastały',
        'Montaż rury',
        null,
        'Zielona 9, Szarłata',
      ]),
    ).toBe(true);
  });

  it('matches words across name and title', () => {
    expect(
      matchesSearchQuery('nastały montaż', ['Tomasz Nastały', 'Montaż rury', null]),
    ).toBe(true);
  });

  it('rejects when one word does not match any field', () => {
    expect(
      matchesSearchQuery('tomasz gdańsk', ['Tomasz Nastały', 'Montaż rury', null, 'Szarłata']),
    ).toBe(false);
  });

  it('is case insensitive', () => {
    expect(matchesSearchQuery('TOMASZ', ['tomasz nastały', null])).toBe(true);
  });

  it('matches empty query to everything', () => {
    expect(matchesSearchQuery('', ['anything'])).toBe(true);
    expect(matchesSearchQuery('   ', ['anything'])).toBe(true);
  });

  it('handles all null fields gracefully', () => {
    expect(matchesSearchQuery('test', [null, null, undefined])).toBe(false);
  });

  it('matches date field', () => {
    expect(matchesSearchQuery('2026-03-20', [null, null, '2026-03-20'])).toBe(true);
  });
});
