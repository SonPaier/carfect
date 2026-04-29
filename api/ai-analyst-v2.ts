// api/ai-analyst-v2.ts
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import {
  resolveInstanceId,
  AiAnalystAuthError,
  enforceRateLimit,
  insertAuditLog,
  buildAgent,
  computeCostUsd,
} from '../libs/ai/src/server';
import { computeTodayBoundaries } from '../libs/ai/src/server/tools/getToday';

export const config = { runtime: 'nodejs', maxDuration: 60 };

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const MODEL = process.env.AI_ANALYST_MODEL ?? 'gpt-4.1';

// Tenant-scoped tables the agent can read. Keep aligned with RLS migration 20260430140200.
const ALLOWED_TABLES_CARFECT = new Set([
  'reservations',
  'customers',
  'customer_vehicles',
  'stations',
  'employees',
  'unified_services',
  'unified_categories',
  'services',
  'service_categories',
  'offers',
  'offer_options',
  'offer_option_items',
  'offer_scopes',
  'vehicle_protocols',
  'sales_orders',
  'sales_order_items',
  'sales_customers',
  'sales_products',
  'sales_product_variants',
  'sales_rolls',
  'trainings',
  'breaks',
  'closed_days',
  'time_entries',
  'employee_days_off',
  'followup_events',
  'followup_tasks',
  'customer_reminders',
  'notifications',
  'sms_logs',
  'yard_vehicles',
]);

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-carfect-instance',
      },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startedAt = Date.now();

  let instance_id = '',
    user_id = '';
  try {
    ({ instance_id, user_id } = await resolveInstanceId(req, supabase));
    await enforceRateLimit(supabase, user_id, instance_id);

    const { messages } = (await req.json()) as { messages: UIMessage[] };
    if (!messages?.length) throw new AiAnalystAuthError(403, 'No messages');
    const lcMessages = await toBaseMessages(messages);

    const llm = new ChatOpenAI({ model: MODEL, temperature: 0, apiKey: OPENAI_API_KEY });
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
      apiKey: OPENAI_API_KEY,
    });
    const embed = (text: string) => embeddings.embedQuery(text);
    const today = computeTodayBoundaries();

    const agent = buildAgent({
      llm,
      embed,
      supabase,
      schemaContext: 'carfect',
      instanceId: instance_id,
      allowedTables: ALLOWED_TABLES_CARFECT,
      todayIso: today.date,
    });

    const stream = await agent.stream(
      { messages: lcMessages },
      { streamMode: ['values', 'messages', 'custom'], context: { instance_id } },
    );

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream, {
        onFinish: ({
          usage,
          finalMessage,
        }: {
          usage?: { promptTokens?: number; completionTokens?: number };
          finalMessage?: { content?: string };
        }) => {
          void insertAuditLog(supabase, {
            instance_id,
            user_id,
            question: extractLastUserText(messages),
            tool_calls: [], // populate from stream events in v2
            final_answer: finalMessage?.content ?? '',
            tokens_in: usage?.promptTokens ?? null,
            tokens_out: usage?.completionTokens ?? null,
            duration_ms: Date.now() - startedAt,
            status: 'success',
            error_message: null,
          });
        },
      }),
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    if (err instanceof AiAnalystAuthError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    const message = (err as Error).message ?? 'Internal error';
    if (instance_id && user_id) {
      void insertAuditLog(supabase, {
        instance_id,
        user_id,
        question: '',
        tool_calls: [],
        final_answer: '',
        tokens_in: null,
        tokens_out: null,
        duration_ms: Date.now() - startedAt,
        status: 'error',
        error_message: message,
      });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    const parts = (m as { parts?: Array<{ type: string; text?: string }> }).parts;
    return (
      parts
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text ?? '')
        .join('') ?? ''
    );
  }
  return '';
}
