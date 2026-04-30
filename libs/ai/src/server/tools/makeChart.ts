// libs/ai/src/server/tools/makeChart.ts
import { tool } from 'langchain';
import { ChartSpecSchema, type ChartSpec } from '../../charts/chartSpec';

export function createMakeChartTool() {
  return tool(
    async (spec: ChartSpec, config) => {
      const id = crypto.randomUUID();
      const writer = (config as { writer?: (chunk: unknown) => void }).writer;
      writer?.({ type: 'chart', id, spec });
      return `Chart ${id} emitted to client.`;
    },
    {
      name: 'make_chart',
      description:
        'Render a bar/line/pie chart from query results. Call AFTER run_sql when results are visualizable (≥3 categories, ranking, or time series).',
      schema: ChartSpecSchema,
    },
  );
}
