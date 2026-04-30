// api/ai-analyst-v2.ts
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import * as _resolveMod from '../libs/ai/src/server/resolveInstanceId';
import * as _rateMod from '../libs/ai/src/server/rateLimit';
import * as _auditMod from '../libs/ai/src/server/auditLog';
import * as _agentMod from '../libs/ai/src/server/createAgent';
import * as _todayMod from '../libs/ai/src/server/tools/getToday';

// tsx dynamic-import via Node ESM/CJS interop wraps named exports under `default`.
// Static-import-only callers see them flat. Unwrap defensively.
type Mod<T> = T & { default?: T };
const resolveMod = ((_resolveMod as Mod<typeof _resolveMod>).default ?? _resolveMod) as typeof _resolveMod;
const rateMod = ((_rateMod as Mod<typeof _rateMod>).default ?? _rateMod) as typeof _rateMod;
const auditMod = ((_auditMod as Mod<typeof _auditMod>).default ?? _auditMod) as typeof _auditMod;
const agentMod = ((_agentMod as Mod<typeof _agentMod>).default ?? _agentMod) as typeof _agentMod;
const todayMod = ((_todayMod as Mod<typeof _todayMod>).default ?? _todayMod) as typeof _todayMod;

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
    ({ instance_id, user_id } = await resolveMod.resolveInstanceId(req, supabase));
    await rateMod.enforceRateLimit(supabase, user_id, instance_id);

    // execute_readonly_query requires auth.role()='authenticated', so the agent's
    // tools (esp. run_sql) need a Supabase client carrying the user's JWT.
    // Service-role client is kept only for auth resolution + audit logging.
    const userJwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
      auth: { persistSession: false },
    });

    const { messages } = (await req.json()) as { messages: UIMessage[] };
    if (!messages?.length) throw resolveMod.AiAnalystAuthError(403, 'No messages');
    const lcMessages = await toBaseMessages(messages);

    const llm = new ChatOpenAI({ model: MODEL, temperature: 0, apiKey: OPENAI_API_KEY });
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
      apiKey: OPENAI_API_KEY,
    });
    const embed = (text: string) => embeddings.embedQuery(text);
    const today = todayMod.computeTodayBoundaries();

    const agent = agentMod.buildAgent({
      llm,
      embed,
      supabase: supabaseUser,
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
          void auditMod.insertAuditLog(supabase, {
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
    console.error('[ai-analyst-v2] handler error:', err);
    const e = err as { status?: number; message?: string; isAiAnalystAuthError?: boolean };
    if (e?.isAiAnalystAuthError === true && typeof e.status === 'number') {
      return Response.json({ error: e.message }, { status: e.status });
    }
    const message = e?.message ?? 'Internal error';
    if (instance_id && user_id) {
      void auditMod.insertAuditLog(supabase, {
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
