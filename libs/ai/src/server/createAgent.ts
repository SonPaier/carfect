// libs/ai/src/server/createAgent.ts
import { createAgent, toolCallLimitMiddleware, createMiddleware, ToolMessage } from 'langchain';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from './promptBuilder';
import { createGetTodayTool } from './tools/getToday';
import { createDataOverviewTool } from './tools/dataOverview';
import { createRunSqlTool } from './tools/runSql';
import { createLookupSchemaTool } from './tools/lookupSchema';
import { createFindSimilarTool } from './tools/findSimilarQuestions';
import { createMakeChartTool } from './tools/makeChart';

export interface BuildAgentInput {
  llm: unknown; // ChatOpenAI instance (typed loosely to avoid version coupling)
  embed: (text: string) => Promise<number[]>;
  supabase: SupabaseClient;
  schemaContext: 'carfect' | 'hiservice';
  instanceId: string;
  allowedTables: Set<string>;
  todayIso: string;
  instanceName?: string;
}

const handleToolErrors = createMiddleware({
  name: 'HandleToolErrors',
  wrapToolCall: async (request, next) => {
    try {
      return await next(request);
    } catch (e) {
      return new ToolMessage({
        content: `Tool error: ${(e as Error).message}. Try a different approach.`,
        tool_call_id: request.toolCall.id ?? 'unknown',
      });
    }
  },
});

export function buildAgent(input: BuildAgentInput) {
  const { llm, embed, supabase, schemaContext, instanceId, allowedTables, todayIso, instanceName } =
    input;

  const tools = [
    createLookupSchemaTool(supabase, { embed, schemaContext }),
    createFindSimilarTool(supabase, { embed, schemaContext }),
    createGetTodayTool(),
    createRunSqlTool(supabase, instanceId, allowedTables),
    createDataOverviewTool(supabase, allowedTables),
    createMakeChartTool(),
  ];

  return createAgent({
    model: llm as never,
    tools,
    contextSchema: z.object({ instance_id: z.string() }),
    systemPrompt: buildSystemPrompt({ schemaContext, todayIso, instanceName }),
    middleware: [handleToolErrors, toolCallLimitMiddleware({ runLimit: 12, exitBehavior: 'end' })],
  });
}
