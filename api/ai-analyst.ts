import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const maxDuration = 30;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const SCHEMA_CONTEXTS: Record<string, string> = {
  carfect: `You have access to a PostgreSQL database for a car detailing / PPF studio management SaaS.
All tables have an instance_id uuid column for tenant isolation.

CORE:
- reservations: id, instance_id, customer_name, customer_phone, customer_email, vehicle_plate, car_size (enum: small/medium/large), service_items (jsonb array of {id,name,price}), reservation_date (date), end_date (date), start_time (timestamptz), end_time (timestamptz), status (enum: pending/confirmed/in_progress/completed/cancelled/no_show/change_request), price (numeric — total price), station_id (uuid FK), assigned_employee_ids (jsonb), admin_notes, customer_notes, offer_number, confirmation_code, created_at, completed_at, cancelled_at
  NOTE: NO customer_id column! Use customer_name/customer_phone. To join with customers: JOIN customers c ON c.phone = r.customer_phone AND c.instance_id = r.instance_id
  NOTE: service_items can be NULL — always add "service_items IS NOT NULL" before jsonb_array_elements(service_items)
  NOTE: To query service names/prices: jsonb_array_elements(service_items) AS si, then si->>'name', (si->>'price')::numeric
- customers: id, instance_id, name, phone, email, company, nip, address, notes, discount_percent, is_net_payer, has_no_show, sms_consent, created_at
- customer_vehicles: id, instance_id, customer_id, phone, model, plate, car_size, usage_count, last_used_at
- stations: id, instance_id, name, type (enum), active, color, sort_order
- employees: id, instance_id, name, photo_url, hourly_rate, active, sort_order, deleted_at

SERVICES & PRICING:
- unified_services: id, instance_id, category_id (FK), name, short_name, default_price, price_small, price_medium, price_large, price_from, duration_minutes, active, service_type, unit, deleted_at
- unified_categories: id, instance_id, name, slug, category_type, sort_order, active, deleted_at
- services: id, instance_id, category_id, name, price_from, price_small, price_medium, price_large, duration_minutes, active, is_popular
- service_categories: id, instance_id, name, slug, sort_order, active

OFFERS & PROTOCOLS:
- offers: id, instance_id, offer_number, status (draft/sent/viewed/approved/rejected), total_price, customer_data (jsonb: name,phone,email), vehicle_data (jsonb), created_at, sent_at, approved_at
- offer_options: id, offer_id, scope_id, name, sort_order, is_selected
- offer_option_items: id, option_id, product_id, name, custom_name, price, quantity, sort_order
- offer_scopes: id, instance_id, name, short_name, is_extras_scope, has_unified_services, sort_order, active
- vehicle_protocols: id, instance_id, offer_id, customer_name, vehicle_model, registration_number, fuel_level, odometer_reading, body_type, protocol_type (reception/release), status, protocol_date, notes

SALES:
- sales_orders: id, instance_id, status, total_amount, customer_id (FK), created_at
- sales_order_items: id, order_id, product_id, variant_id, quantity, unit_price, total_price
- sales_customers: id, instance_id, name, phone, email, nip, company, default_currency, is_net_payer, discount_percent
- sales_products: id, instance_id, name, sku, category, active
- sales_product_variants: id, product_id, name, sku, price, weight_kg, stock_quantity
- sales_rolls: id, instance_id, brand, product_name, product_code, width_mm, length_m, initial_length_m, delivery_date, status

SCHEDULING:
- trainings: id, instance_id, training_type, title, start_date, end_date, start_time, end_time, station_id, status, assigned_employee_ids
- breaks: id, instance_id, station_id, break_date, start_time, end_time, note
- closed_days: id, instance_id, closed_date, reason
- time_entries: id, instance_id, employee_id, entry_date, start_time, end_time, total_minutes, entry_type
- employee_days_off: id, instance_id, employee_id, date_from, date_to, day_off_type

FOLLOW-UPS & REMINDERS:
- followup_events: id, instance_id, customer_id, customer_name, customer_phone, notes, status, next_reminder_date
- followup_tasks: id, instance_id, event_id, title, customer_name, customer_phone, due_date, status, completed_at
- customer_reminders: id, instance_id, customer_name, customer_phone, vehicle_plate, scheduled_date, status, sent_at
- notifications: id, instance_id, type, title, message, is_read, created_at
- sms_logs: id, instance_id, phone, message, message_type, status, created_at

OTHER:
- yard_vehicles: id, instance_id, customer_name, customer_phone, vehicle_plate, car_size, arrival_date, notes, status, pickup_date
- car_models: id, brand, name, size, active (NO instance_id — global table)`,
};

function validateSql(sql: string): string | null {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith('SELECT')) return 'Query must start with SELECT';
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'];
  for (const word of forbidden) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(trimmed)) return `Forbidden keyword: ${word}`;
  }
  if (/\bCREATE\s+(TABLE|INDEX|VIEW|FUNCTION)/i.test(trimmed)) return 'Forbidden: CREATE statement';
  if (trimmed.includes(';')) return 'Multi-statement queries not allowed';
  return null;
}

export default async function handler(req: Request) {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { instanceId, schemaContext } = body;

    // Extract messages from useChat format
    let chatMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (body.messages) {
      chatMessages = body.messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.parts
          ? m.parts
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text)
              .join('')
          : m.content || '',
      }));
    }

    if (chatMessages.length === 0 || !instanceId || !schemaContext) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify access
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('instance_id', instanceId);
    if (!roles || roles.length === 0) {
      return Response.json({ error: 'No access to this instance' }, { status: 403 });
    }

    const schemaDesc = SCHEMA_CONTEXTS[schemaContext];
    if (!schemaDesc) {
      return Response.json({ error: `Unknown schema context: ${schemaContext}` }, { status: 400 });
    }

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const result = streamText({
      model: openai('gpt-4.1-mini'),
      system: `Jesteś asystentem biznesowym studia detailingowego / PPF. Odpowiadasz po polsku.

${schemaDesc}

Zasady:
- Używaj narzędzia run_sql aby pobrać dane z bazy ZANIM odpowiesz na pytanie liczbowe.
- NIGDY nie wymyślaj liczb — zawsze najpierw pobierz dane.
- ZAWSZE dodawaj WHERE instance_id = '${instanceId}' do każdej tabeli w zapytaniu.
- Nie wymyślaj kolumn ani tabel których nie ma w schemacie.
- Dzisiejsza data: ${new Date().toISOString().split('T')[0]}
- Limituj wyniki do 50 wierszy.
- Używaj ILIKE do fuzzy matchowania nazw usług.
- Formatuj kwoty jako X XXX,XX zł.
- W odpowiedzi podawaj: wynik, zakres dat, główne wnioski.
- Bądź zwięzły — 2-4 zdania, potem opcjonalnie tabela w markdown.
- Możesz wywołać run_sql wielokrotnie jeśli potrzebujesz danych z różnych tabel.
- Jeśli SQL zwraca error, popraw zapytanie i spróbuj ponownie.`,
      messages: chatMessages,
      tools: {
        run_sql: tool({
          description:
            'Execute a read-only SQL query against the database. Use this to fetch any data needed to answer the user question. Always include WHERE instance_id clause.',
          parameters: z.object({
            sql: z
              .string()
              .describe(
                'The SELECT SQL query to execute. Must be a single SELECT statement with instance_id filter.',
              ),
          }),
          execute: async ({ sql }) => {
            const cleanSql = sql.trim().replace(/;+$/, '').trim();

            const validationError = validateSql(cleanSql);
            if (validationError) {
              return { error: validationError };
            }

            // Check instance_id safety
            const instanceIdPattern = /instance_id\s*=\s*'([^']+)'/gi;
            let match;
            while ((match = instanceIdPattern.exec(cleanSql)) !== null) {
              if (match[1] !== instanceId) {
                return { error: 'Unauthorized instance_id reference' };
              }
            }

            const { data, error } = await supabase.rpc('execute_readonly_query', {
              query_text: cleanSql,
              target_instance_id: instanceId,
            });

            if (error) {
              console.error('SQL error:', error.message, 'SQL:', cleanSql);
              return { error: `SQL error: ${error.message}. Fix the query and try again.` };
            }

            return { rows: data, rowCount: Array.isArray(data) ? data.length : 0 };
          },
        }),
      },
      maxSteps: 5,
    });

    return result.toUIMessageStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('AI Analyst error:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
