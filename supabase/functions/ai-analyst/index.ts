import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SCHEMA_CONTEXTS: Record<string, string> = {
  carfect: `Available PostgreSQL tables (all have instance_id uuid column for tenant isolation):

CORE:
- reservations: id, instance_id, customer_name, customer_phone, customer_email, vehicle_plate, car_size (enum: small/medium/large), service_ids (uuid[]), service_items (jsonb array of {id,name,price}), checked_service_ids (jsonb), start_time (timestamptz), end_time (timestamptz), reservation_date (date), end_date (date), status (enum: pending/confirmed/in_progress/completed/cancelled/no_show/change_request), price (numeric — this is the total price, there is NO total_price column), station_id (uuid FK), assigned_employee_ids (jsonb), admin_notes, customer_notes, offer_number, confirmation_code, created_at, completed_at, cancelled_at, has_unified_services (bool)
- customers: id, instance_id, name, phone, email, company, nip, address, notes, discount_percent, is_net_payer, has_no_show, sms_consent, created_at
- customer_vehicles: id, instance_id, customer_id, phone, model, plate, car_size, usage_count, last_used_at
- stations: id, instance_id, name, type (enum: station_type), active, color, sort_order
- employees: id, instance_id, name, photo_url, hourly_rate, active, sort_order, deleted_at

SERVICES & PRICING:
- unified_services: id, instance_id, category_id (FK), name, short_name, description, default_price, price_small, price_medium, price_large, price_from, duration_minutes, duration_small, duration_medium, duration_large, requires_size, is_popular, prices_are_net, active, service_type, station_type, unit, shortcut, visibility, deleted_at
- unified_categories: id, instance_id, name, slug, category_type, sort_order, prices_are_net, active, deleted_at
- services: id, instance_id, category_id, name, price_from, price_small, price_medium, price_large, duration_minutes, requires_size, station_type, active, is_popular
- service_categories: id, instance_id, name, slug, sort_order, active, prices_are_net

OFFERS & PROTOCOLS:
- offers: id, instance_id, offer_number, status (draft/sent/viewed/approved/rejected), total_price, customer_data (jsonb: name,phone,email), vehicle_data (jsonb), created_at, sent_at, viewed_at, approved_at, rejected_at, selected_state (jsonb)
- offer_options: id, offer_id, scope_id, name, sort_order, is_selected
- offer_option_items: id, option_id, product_id, name, custom_name, price, quantity, sort_order
- offer_scopes: id, instance_id, name, short_name, description, is_extras_scope, has_unified_services, sort_order, active, source
- vehicle_protocols: id, instance_id, offer_id, offer_number, customer_name, vehicle_model, registration_number, fuel_level, odometer_reading, body_type, protocol_type (reception/release), status, protocol_date, notes, nip, phone, customer_email

SALES:
- sales_orders: id, instance_id, status, total_amount, customer_id (FK), created_at
- sales_order_items: id, order_id, product_id, variant_id, quantity, unit_price, total_price
- sales_customers: id, instance_id, name, phone, email, nip, company, default_currency, is_net_payer, discount_percent
- sales_products: id, instance_id, name, description, sku, category, active
- sales_product_variants: id, product_id, name, sku, price, weight_kg, dimensions, stock_quantity
- sales_rolls: id, instance_id, brand, product_name, product_code, width_mm, length_m, initial_length_m, delivery_date, status

SCHEDULING:
- trainings: id, instance_id, training_type, title, start_date, end_date, start_time, end_time, station_id, status, assigned_employee_ids
- training_types: id, instance_id, name, duration_days, active
- breaks: id, instance_id, station_id, break_date, start_time, end_time, note
- closed_days: id, instance_id, closed_date, reason
- time_entries: id, instance_id, employee_id, entry_date, start_time, end_time, total_minutes, entry_type
- employee_breaks: id, instance_id, employee_id, break_date, start_time, end_time, duration_minutes
- employee_days_off: id, instance_id, employee_id, date_from, date_to, day_off_type

FOLLOW-UPS & REMINDERS:
- followup_events: id, instance_id, customer_id, customer_name, customer_phone, notes, status, followup_service_id, next_reminder_date
- followup_tasks: id, instance_id, event_id, title, customer_name, customer_phone, due_date, status, notes, completed_at
- followup_services: id, instance_id, name, description, default_interval_months, active
- customer_reminders: id, instance_id, reminder_template_id, reservation_id, customer_name, customer_phone, vehicle_plate, scheduled_date, months_after, service_type, status, sent_at
- offer_reminders: id, instance_id, offer_id, customer_name, customer_phone, scheduled_date, months_after, status

NOTIFICATIONS & SMS:
- notifications: id, instance_id, type, title, message, description, entity_type, entity_id, is_read, created_at
- sms_logs: id, instance_id, phone, message, message_type, sent_by, status, error_message, created_at

OTHER:
- yard_vehicles: id, instance_id, customer_name, customer_phone, vehicle_plate, car_size, service_ids, arrival_date, deadline_time, notes, status, pickup_date
- reservation_changes: id, instance_id, reservation_id, change_type, field_name, old_value, new_value, changed_by_username
- car_models: id, brand, name, size, active (no instance_id — global table)

Important rules:
- ALWAYS filter by instance_id = $INSTANCE_ID on every table (except car_models)
- Dates: reservation_date/start_date are date type, start_time/end_time/created_at are timestamptz
- Use date_trunc, extract for date grouping
- price, default_price are numeric
- Polish locale: months = styczeń, luty, marzec, kwiecień, maj, czerwiec, lipiec, sierpień, wrzesień, październik, listopad, grudzień

Critical: How to query services per reservation:
- service_ids is jsonb (NOT uuid[]), e.g. ["uuid1","uuid2"]
- service_items is jsonb array of objects, e.g. [{"id":"...","name":"Korekta","price":1500}]
- To get service names/prices from a reservation, use: jsonb_array_elements(service_items) AS si, then si->>'name', (si->>'price')::numeric
- To check if reservation has a specific service: service_items::text ILIKE '%service_name%'
- To count services by name: SELECT si->>'name' AS service_name, COUNT(*) FROM reservations, jsonb_array_elements(service_items) AS si WHERE instance_id = ... GROUP BY si->>'name'
- Do NOT use service_ids for joins — use service_items instead
- CRITICAL: service_items can be NULL — ALWAYS add "AND service_items IS NOT NULL" before using jsonb_array_elements(service_items)
- For questions that need creative analysis (not just numbers), first query the raw data, the formatting step will provide insights`,
};

function validateSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;$/, '').trim();
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith('SELECT')) return 'Query must start with SELECT';
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE'];
  for (const word of forbidden) {
    // Match as whole word to avoid false positives like "UPDATED_AT"
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(trimmed) && word !== 'CREATE') return `Forbidden keyword: ${word}`;
    // Allow CREATE only inside subqueries like "created_at" — check if it's standalone
    if (word === 'CREATE' && /\bCREATE\s+(TABLE|INDEX|VIEW|FUNCTION)/i.test(trimmed)) {
      return `Forbidden keyword: ${word}`;
    }
  }
  return null;
}

async function callOpenAI(messages: Array<{ role: string; content: string }>, jsonMode = false) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages,
      temperature: 0,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, instanceId, schemaContext } = await req.json();

    if (!prompt || !instanceId || !schemaContext) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has access to this instance
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('instance_id', instanceId);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'No access to this instance' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const schemaDesc = SCHEMA_CONTEXTS[schemaContext];
    if (!schemaDesc) {
      return new Response(JSON.stringify({ error: `Unknown schema context: ${schemaContext}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Generate SQL
    const systemPrompt = `You are a PostgreSQL analyst for a car detailing / PPF studio management SaaS.

${schemaDesc}

Business metric definitions:
- przychód/revenue = SUM(price) FROM reservations WHERE status IN ('completed','confirmed','in_progress')
- liczba rezerwacji = COUNT(*) FROM reservations
- przychód z usługi X = SUM((si->>'price')::numeric) FROM reservations, jsonb_array_elements(service_items) AS si WHERE si->>'name' ILIKE '%X%'
- liczba usługi X = COUNT(*) FROM reservations, jsonb_array_elements(service_items) AS si WHERE si->>'name' ILIKE '%X%'
- nowi klienci = COUNT(DISTINCT id) FROM customers WHERE created_at in period
- top klienci = customers ranked by COUNT or SUM of their reservations
- średnia wartość rezerwacji = AVG(price) FROM reservations

Rules:
- Output ONLY the raw SQL query. No markdown, no explanation, no backticks.
- ALWAYS include WHERE instance_id = '${instanceId}' on EVERY table in the query.
- Never invent tables or columns that are not in the schema above.
- If a column doesn't exist, find the closest match from the schema.
- Current date: ${new Date().toISOString().split('T')[0]}
- Limit results to 50 rows max.
- For aggregations, use meaningful aliases in Polish.
- Use ILIKE for fuzzy name matching (user may not type exact service name).
- When comparing months, use date_trunc('month', reservation_date) and generate one row per month.`;

    const fewShotExamples = [
      {
        role: 'user' as const,
        content: 'Ile zarobiłem na komplet mycia w lutym?',
      },
      {
        role: 'assistant' as const,
        content: `SELECT COUNT(*) AS liczba, COALESCE(SUM((si->>'price')::numeric), 0) AS przychod FROM reservations, jsonb_array_elements(service_items) AS si WHERE instance_id = '${instanceId}' AND service_items IS NOT NULL AND si->>'name' ILIKE '%komplet mycia%' AND reservation_date >= '2026-02-01' AND reservation_date < '2026-03-01' AND status IN ('completed','confirmed','in_progress')`,
      },
      {
        role: 'user' as const,
        content: 'Porównanie usług styczeń vs luty vs marzec',
      },
      {
        role: 'assistant' as const,
        content: `SELECT si->>'name' AS usluga, date_trunc('month', reservation_date)::date AS miesiac, COUNT(*) AS liczba, COALESCE(SUM((si->>'price')::numeric), 0) AS przychod FROM reservations, jsonb_array_elements(service_items) AS si WHERE instance_id = '${instanceId}' AND service_items IS NOT NULL AND reservation_date >= '2026-01-01' AND reservation_date < '2026-04-01' AND status IN ('completed','confirmed','in_progress') GROUP BY si->>'name', date_trunc('month', reservation_date) ORDER BY miesiac, przychod DESC LIMIT 50`,
      },
      {
        role: 'user' as const,
        content: 'Top 5 klientów',
      },
      {
        role: 'assistant' as const,
        content: `SELECT customer_name, customer_phone, COUNT(*) AS liczba_wizyt, COALESCE(SUM(price), 0) AS laczny_przychod FROM reservations WHERE instance_id = '${instanceId}' AND status IN ('completed','confirmed','in_progress') GROUP BY customer_name, customer_phone ORDER BY laczny_przychod DESC LIMIT 5`,
      },
    ];

    const sqlRaw = await callOpenAI([
      { role: 'system', content: systemPrompt },
      ...fewShotExamples,
      { role: 'user', content: prompt },
    ]);
    const sql = sqlRaw.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim().replace(/;+$/, '').trim();

    // Validate SQL
    const validationError = validateSql(sql);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: `Wygenerowane zapytanie jest nieprawidłowe: ${validationError}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 2: Validate instance_id safety — reject if SQL references a different instance
    const instanceIdPattern = /instance_id\s*=\s*'([^']+)'/gi;
    let match;
    while ((match = instanceIdPattern.exec(sql)) !== null) {
      if (match[1] !== instanceId) {
        return new Response(
          JSON.stringify({ error: 'Zapytanie odwołuje się do nieautoryzowanych danych.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Step 3: Execute SQL with instance_id enforcement
    const { data: queryResult, error: queryError } = await supabase.rpc('execute_readonly_query', {
      query_text: sql,
      target_instance_id: instanceId,
    });

    if (queryError) {
      console.error('SQL execution error:', queryError, 'SQL:', sql);
      return new Response(
        JSON.stringify({
          error: 'Nie udało się wykonać zapytania. Spróbuj inaczej sformułować pytanie.',
          _debug: { sqlError: queryError.message, generatedSql: sql },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 3: Format response
    const formatPrompt = `You are a business analyst assistant. The user asked a question about their business and here are the SQL results.

User question: ${prompt}

SQL results (JSON):
${JSON.stringify(queryResult, null, 2)}

Respond in Polish. Return a JSON object with this structure:
{
  "answer": "Human-readable summary of the results in Polish. Use numbers, percentages, comparisons where relevant. Format currency as X XXX,XX zł.",
  "table": {
    "headers": ["Column 1", "Column 2"],
    "rows": [["val1", "val2"]]
  }
}

Rules:
- "answer" is required — always provide a text summary
- "table" is optional — include ONLY if the data has multiple rows that benefit from tabular display
- For single values (totals, counts), just put them in "answer" without a table
- Format numbers with Polish locale (space as thousands separator, comma for decimals)
- Keep answer concise — 2-3 sentences max`;

    const formatRaw = await callOpenAI(
      [{ role: 'user', content: formatPrompt }],
      true, // JSON mode
    );

    const formatted = JSON.parse(formatRaw);

    return new Response(JSON.stringify({ ...formatted, _debug: { generatedSql: sql, rowCount: Array.isArray(queryResult) ? queryResult.length : 0 } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('AI Analyst error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
