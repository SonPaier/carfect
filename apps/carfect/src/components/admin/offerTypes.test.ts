import { describe, it, expect } from 'vitest';
import { formatPrice, statusColors } from './offerTypes';

describe('formatPrice', () => {
  it('formats integer price in PLN', () => {
    const result = formatPrice(1000);
    // Intl formats with non-breaking space: "1 000,00 zł" or "1\u00a0000,00\u00a0zł"
    expect(result).toContain('1');
    expect(result).toContain('000');
    expect(result).toContain('zł');
  });

  it('formats decimal price', () => {
    const result = formatPrice(99.99);
    expect(result).toContain('99');
    expect(result).toContain('zł');
  });

  it('formats zero', () => {
    const result = formatPrice(0);
    expect(result).toContain('0');
    expect(result).toContain('zł');
  });

  it('formats large numbers with thousands separator', () => {
    const result = formatPrice(12345.67);
    expect(result).toContain('12');
    expect(result).toContain('345');
    expect(result).toContain('67');
    expect(result).toContain('zł');
  });

  it('formats negative price', () => {
    const result = formatPrice(-500);
    expect(result).toContain('500');
    expect(result).toContain('zł');
  });

  it('uses Polish locale (comma as decimal separator)', () => {
    const result = formatPrice(1234.56);
    // Polish locale uses comma for decimals
    expect(result).toContain(',');
    expect(result).toContain('56');
  });
});

describe('statusColors', () => {
  it('has entries for all standard statuses', () => {
    const expectedStatuses = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'completed'];
    expectedStatuses.forEach((status) => {
      expect(statusColors[status]).toBeDefined();
      expect(typeof statusColors[status]).toBe('string');
    });
  });

  it('returns CSS class strings', () => {
    Object.values(statusColors).forEach((cssClass) => {
      // All values should be non-empty strings containing color classes
      expect(cssClass.length).toBeGreaterThan(0);
    });
  });
});
