import { describe, it, expect } from 'vitest';
import { mergeVehiclesByPhone } from './mergeVehiclesByPhone';

const vehicle = (overrides: Partial<{ id: string; phone: string; model: string; customer_id: string | null; customer_name: string; plate: string | null }> = {}) => ({
  id: 'v1',
  phone: '+48503011126',
  model: 'Porsche Panamera',
  plate: null,
  customer_id: 'c1',
  customer_name: 'Stalowy',
  ...overrides,
});

describe('mergeVehiclesByPhone', () => {
  it('merges two vehicles with the same phone into one entry with joined models', () => {
    const result = mergeVehiclesByPhone([
      vehicle({ id: 'v1', model: 'Porsche Panamera' }),
      vehicle({ id: 'v2', model: 'Lamborghini Urus' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('Porsche Panamera, Lamborghini Urus');
    expect(result[0].phone).toBe('+48503011126');
    expect(result[0].customer_name).toBe('Stalowy');
  });

  it('keeps the first vehicle id and customer_id', () => {
    const result = mergeVehiclesByPhone([
      vehicle({ id: 'v1', customer_id: 'c1' }),
      vehicle({ id: 'v2', customer_id: 'c1' }),
    ]);

    expect(result[0].id).toBe('v1');
    expect(result[0].customer_id).toBe('c1');
  });

  it('does not duplicate the same model name', () => {
    const result = mergeVehiclesByPhone([
      vehicle({ id: 'v1', model: 'BMW X5' }),
      vehicle({ id: 'v2', model: 'BMW X5' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('BMW X5');
  });

  it('returns separate entries for different phones', () => {
    const result = mergeVehiclesByPhone([
      vehicle({ id: 'v1', phone: '+48111', model: 'Audi A4' }),
      vehicle({ id: 'v2', phone: '+48222', model: 'BMW X3' }),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].model).toBe('Audi A4');
    expect(result[1].model).toBe('BMW X3');
  });

  it('handles single vehicle without changes', () => {
    const result = mergeVehiclesByPhone([
      vehicle({ id: 'v1', model: 'Tesla Model 3' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('Tesla Model 3');
  });

  it('returns empty array for empty input', () => {
    expect(mergeVehiclesByPhone([])).toEqual([]);
  });

  it('merges three vehicles with same phone', () => {
    const result = mergeVehiclesByPhone([
      vehicle({ id: 'v1', model: 'Car A' }),
      vehicle({ id: 'v2', model: 'Car B' }),
      vehicle({ id: 'v3', model: 'Car C' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('Car A, Car B, Car C');
  });

  it('handles vehicle with empty model string', () => {
    const result = mergeVehiclesByPhone([
      vehicle({ id: 'v1', model: 'BMW X5' }),
      vehicle({ id: 'v2', model: '' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('BMW X5');
  });
});
