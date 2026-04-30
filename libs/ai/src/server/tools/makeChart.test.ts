// libs/ai/src/server/tools/makeChart.test.ts
import { describe, expect, it } from 'vitest';
import { createMakeChartTool } from './makeChart';

describe('createMakeChartTool', () => {
  it('exposes correct name and schema', () => {
    const tool = createMakeChartTool();
    expect(tool.name).toBe('make_chart');
    expect(tool.description).toMatch(/chart/i);
  });

  it('rejects invalid chart type via schema', async () => {
    const tool = createMakeChartTool();
    await expect(
      tool.invoke({ type: 'donut', title: 'x', data: [{ a: 1 }], x_key: 'a', y_keys: ['b'] } as never),
    ).rejects.toThrow();
  });
});
