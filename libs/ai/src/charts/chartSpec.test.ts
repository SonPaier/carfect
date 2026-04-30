// libs/ai/src/charts/chartSpec.test.ts
import { describe, expect, it } from 'vitest';
import { ChartSpecSchema, type ChartSpec } from './chartSpec';

describe('ChartSpecSchema', () => {
  it('accepts a valid bar chart spec', () => {
    const valid: ChartSpec = {
      type: 'bar',
      title: 'Revenue per service',
      data: [{ name: 'Detail', value: 12000 }],
      x_key: 'name',
      y_keys: ['value'],
      unit: 'zł',
    };
    expect(() => ChartSpecSchema.parse(valid)).not.toThrow();
  });

  it('rejects unknown chart type', () => {
    expect(() =>
      ChartSpecSchema.parse({ type: 'donut', data: [], x_key: 'x', y_keys: ['y'], title: 't' }),
    ).toThrow();
  });

  it('requires non-empty data', () => {
    expect(() =>
      ChartSpecSchema.parse({ type: 'bar', data: [], x_key: 'x', y_keys: ['y'], title: 't' }),
    ).toThrow(/at least one row/i);
  });

  it('requires y_keys to be non-empty', () => {
    expect(() =>
      ChartSpecSchema.parse({
        type: 'bar',
        data: [{ x: 1, y: 2 }],
        x_key: 'x',
        y_keys: [],
        title: 't',
      }),
    ).toThrow();
  });

  it('allows optional unit', () => {
    const result = ChartSpecSchema.parse({
      type: 'pie',
      data: [{ name: 'A', v: 1 }],
      x_key: 'name',
      y_keys: ['v'],
      title: 'P',
    });
    expect(result.unit).toBeUndefined();
  });
});
