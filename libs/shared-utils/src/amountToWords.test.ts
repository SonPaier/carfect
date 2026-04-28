import { describe, expect, it } from 'vitest';
import { amountToWords } from './amountToWords';

describe('amountToWords', () => {
  it('zero', () => {
    expect(amountToWords(0)).toBe('zero PLN zero gr');
  });

  it('integer below 100', () => {
    expect(amountToWords(7)).toBe('siedem PLN zero gr');
    expect(amountToWords(15)).toBe('piętnaście PLN zero gr');
    expect(amountToWords(42)).toBe('czterdzieści dwa PLN zero gr');
  });

  it('integer below 1000', () => {
    expect(amountToWords(123)).toBe('sto dwadzieścia trzy PLN zero gr');
    expect(amountToWords(900)).toBe('dziewięćset PLN zero gr');
  });

  it('thousands singular', () => {
    expect(amountToWords(1000)).toBe('tysiąc PLN zero gr');
    expect(amountToWords(1234)).toBe('tysiąc dwieście trzydzieści cztery PLN zero gr');
  });

  it('thousands plural 2-4', () => {
    expect(amountToWords(2000)).toBe('dwa tysiące PLN zero gr');
    expect(amountToWords(3000)).toBe('trzy tysiące PLN zero gr');
  });

  it('thousands genitive (5+, teens)', () => {
    expect(amountToWords(5000)).toBe('pięć tysięcy PLN zero gr');
    expect(amountToWords(12000)).toBe('dwanaście tysięcy PLN zero gr');
    expect(amountToWords(13000)).toBe('trzynaście tysięcy PLN zero gr');
    expect(amountToWords(22000)).toBe('dwadzieścia dwa tysiące PLN zero gr');
  });

  it('millions', () => {
    expect(amountToWords(1_000_000)).toBe('milion PLN zero gr');
    expect(amountToWords(2_000_000)).toBe('dwa miliony PLN zero gr');
    expect(amountToWords(5_000_000)).toBe('pięć milionów PLN zero gr');
  });

  it('grosze', () => {
    expect(amountToWords(0.5)).toBe('zero PLN pięćdziesiąt gr');
    expect(amountToWords(1.99)).toBe('jeden PLN dziewięćdziesiąt dziewięć gr');
    expect(amountToWords(123.45)).toBe('sto dwadzieścia trzy PLN czterdzieści pięć gr');
  });

  it('rounds to 2 decimal places', () => {
    expect(amountToWords(0.999)).toBe('jeden PLN zero gr');
    expect(amountToWords(99.995)).toBe('sto PLN zero gr');
  });

  it('matches Fakturownia screenshot example', () => {
    // 8926.91 → "osiem tysięcy dziewięćset dwadzieścia sześć PLN dziewięćdziesiąt jeden gr"
    expect(amountToWords(8926.91)).toBe(
      'osiem tysięcy dziewięćset dwadzieścia sześć PLN dziewięćdziesiąt jeden gr',
    );
  });

  it('custom currency', () => {
    expect(amountToWords(10, 'EUR')).toBe('dziesięć EUR zero gr');
  });

  it('returns empty string for negative or invalid', () => {
    expect(amountToWords(-1)).toBe('');
    expect(amountToWords(NaN)).toBe('');
    expect(amountToWords(Infinity)).toBe('');
  });
});
