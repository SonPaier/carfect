import 'jsr:@std/dotenv/load';
import { assertEquals } from 'jsr:@std/assert';
import { stub, type Stub } from 'jsr:@std/testing/mock';
import {
  shouldIncludeEditLink,
  claimReservation,
  sendSms,
  buildInstanceSettingsMap,
  isReminderEnabledForInstance,
  BACKOFF_MINUTES,
  MAX_FAILURE_COUNT,
  DEMO_INSTANCE_IDS,
} from './helpers.ts';

// ============================================================================
// Test helpers - Supabase mock builder
// ============================================================================

interface MockQueryState {
  table: string;
  operation: string;
  filters: Record<string, unknown>;
  result: { data: unknown; error: unknown; count?: number };
}

function createMockSupabase(handlers: {
  tables?: Record<
    string,
    {
      select?: (filters: Record<string, unknown>) => {
        data: unknown;
        error: unknown;
        count?: number;
      };
      insert?: (data: Record<string, unknown>) => { data: unknown; error: unknown };
      update?: (data: Record<string, unknown>) => { data: unknown; error: unknown };
    }
  >;
  rpc?: Record<string, (params: Record<string, unknown>) => { data: unknown; error: unknown }>;
}) {
  const insertCalls: Array<{ table: string; data: Record<string, unknown> }> = [];
  const updateCalls: Array<{
    table: string;
    data: Record<string, unknown>;
    filters: Record<string, unknown>;
  }> = [];

  function createChain(state: MockQueryState) {
    const chain: Record<string, unknown> = {};
    const chainMethods = ['eq', 'is', 'or', 'in', 'gte', 'lte'] as const;

    for (const method of chainMethods) {
      chain[method] = (col: string, val: unknown) => {
        state.filters[`${method}:${col}`] = val;
        return chain;
      };
    }

    chain.select = (cols: string, opts?: { count?: string; head?: boolean }) => {
      state.operation = 'select';
      return chain;
    };

    chain.insert = (data: Record<string, unknown>) => {
      state.operation = 'insert';
      insertCalls.push({ table: state.table, data });
      const handler = handlers.tables?.[state.table]?.insert;
      state.result = handler ? handler(data) : { data: null, error: null };
      return chain;
    };

    chain.update = (data: Record<string, unknown>) => {
      state.operation = 'update';
      updateCalls.push({ table: state.table, data, filters: { ...state.filters } });
      const handler = handlers.tables?.[state.table]?.update;
      state.result = handler ? handler(data) : { data: null, error: null };
      return chain;
    };

    chain.single = async () => {
      const handler = handlers.tables?.[state.table]?.select;
      return handler ? handler(state.filters) : { data: null, error: null };
    };

    chain.maybeSingle = async () => {
      const handler = handlers.tables?.[state.table]?.select;
      return handler ? handler(state.filters) : { data: null, error: null };
    };

    // Make the chain thenable for await supabase.from(...).insert(...)
    chain.then = (resolve: (v: unknown) => void) => {
      resolve(state.result);
    };

    return chain;
  }

  return {
    client: {
      from: (table: string) => {
        const state: MockQueryState = {
          table,
          operation: '',
          filters: {},
          result: { data: null, error: null },
        };
        return createChain(state);
      },
      rpc: async (fn: string, params: Record<string, unknown>) => {
        const handler = handlers.rpc?.[fn];
        return handler ? handler(params) : { data: null, error: { message: 'RPC not found' } };
      },
    },
    getInsertCalls: () => insertCalls,
    getUpdateCalls: () => updateCalls,
  };
}

// ============================================================================
// SRH - Send Reminders Helpers Tests
// ============================================================================

// ========================
// shouldIncludeEditLink
// ========================

Deno.test('SRH-001: shouldIncludeEditLink - feature not found returns false', async () => {
  const mock = createMockSupabase({
    tables: {
      instance_features: {
        select: () => ({ data: null, error: null }),
      },
    },
  });

  const result = await shouldIncludeEditLink(mock.client, 'inst-1', '+48733854184');
  assertEquals(result, false);
});

Deno.test('SRH-002: shouldIncludeEditLink - feature disabled returns false', async () => {
  const mock = createMockSupabase({
    tables: {
      instance_features: {
        select: () => ({ data: { enabled: false, parameters: null }, error: null }),
      },
    },
  });

  const result = await shouldIncludeEditLink(mock.client, 'inst-1', '+48733854184');
  assertEquals(result, false);
});

Deno.test('SRH-003: shouldIncludeEditLink - enabled, no phone whitelist returns true', async () => {
  const mock = createMockSupabase({
    tables: {
      instance_features: {
        select: () => ({ data: { enabled: true, parameters: null }, error: null }),
      },
    },
  });

  const result = await shouldIncludeEditLink(mock.client, 'inst-1', '+48733854184');
  assertEquals(result, true);
});

Deno.test('SRH-004: shouldIncludeEditLink - enabled, empty phone list returns true', async () => {
  const mock = createMockSupabase({
    tables: {
      instance_features: {
        select: () => ({ data: { enabled: true, parameters: { phones: [] } }, error: null }),
      },
    },
  });

  const result = await shouldIncludeEditLink(mock.client, 'inst-1', '+48733854184');
  assertEquals(result, true);
});

Deno.test('SRH-005: shouldIncludeEditLink - phone in whitelist returns true', async () => {
  const mock = createMockSupabase({
    tables: {
      instance_features: {
        select: () => ({
          data: { enabled: true, parameters: { phones: ['+48733854184', '+48500600700'] } },
          error: null,
        }),
      },
    },
  });

  const result = await shouldIncludeEditLink(mock.client, 'inst-1', '733854184');
  assertEquals(result, true);
});

Deno.test('SRH-006: shouldIncludeEditLink - phone NOT in whitelist returns false', async () => {
  const mock = createMockSupabase({
    tables: {
      instance_features: {
        select: () => ({
          data: { enabled: true, parameters: { phones: ['+48500600700'] } },
          error: null,
        }),
      },
    },
  });

  const result = await shouldIncludeEditLink(mock.client, 'inst-1', '733854184');
  assertEquals(result, false);
});

// ========================
// claimReservation
// ========================

Deno.test('SRH-010: claimReservation - RPC succeeds with true', async () => {
  const mock = createMockSupabase({
    rpc: {
      claim_reminder_1hour: () => ({ data: true, error: null }),
    },
  });

  const result = await claimReservation(mock.client, 'res-1', BACKOFF_MINUTES, '1hour');
  assertEquals(result, true);
});

Deno.test('SRH-011: claimReservation - RPC succeeds with false (already claimed)', async () => {
  const mock = createMockSupabase({
    rpc: {
      claim_reminder_1hour: () => ({ data: false, error: null }),
    },
  });

  const result = await claimReservation(mock.client, 'res-1', BACKOFF_MINUTES, '1hour');
  assertEquals(result, false);
});

Deno.test('SRH-012: claimReservation - RPC fails, direct update succeeds', async () => {
  const mock = createMockSupabase({
    rpc: {
      claim_reminder_1day: () => ({ data: null, error: { message: 'RPC not found' } }),
    },
    tables: {
      reservations: {
        select: () => ({ data: { id: 'res-1' }, error: null }),
        update: () => ({ data: { id: 'res-1' }, error: null }),
      },
    },
  });

  const result = await claimReservation(mock.client, 'res-1', BACKOFF_MINUTES, '1day');
  // Direct update path returns !!directData from maybeSingle
  // Our mock returns data from update handler via chain
  assertEquals(result, true);
});

Deno.test('SRH-013: claimReservation - uses correct RPC name per type', async () => {
  const calledRpcs: string[] = [];

  const mockHour = createMockSupabase({
    rpc: {
      claim_reminder_1hour: () => {
        calledRpcs.push('claim_reminder_1hour');
        return { data: true, error: null };
      },
      claim_reminder_1day: () => {
        calledRpcs.push('claim_reminder_1day');
        return { data: true, error: null };
      },
    },
  });

  await claimReservation(mockHour.client, 'res-1', BACKOFF_MINUTES, '1hour');
  assertEquals(calledRpcs, ['claim_reminder_1hour']);

  calledRpcs.length = 0;
  await claimReservation(mockHour.client, 'res-1', BACKOFF_MINUTES, '1day');
  assertEquals(calledRpcs, ['claim_reminder_1day']);
});

// ========================
// sendSms
// ========================

Deno.test(
  'SRH-020: sendSms - demo instance within limit logs simulated, returns success',
  async () => {
    const demoInstanceId = DEMO_INSTANCE_IDS[0];
    const mock = createMockSupabase({
      rpc: {
        check_sms_available: () => ({ data: true, error: null }),
        increment_sms_usage: () => ({ data: true, error: null }),
      },
      tables: {
        sms_logs: {
          insert: () => ({ data: null, error: null }),
        },
      },
    });

    const result = await sendSms(
      '+48733854184',
      'Test message',
      'token123',
      mock.client,
      demoInstanceId,
      'res-1',
      'reminder_1day',
    );

    assertEquals(result.success, true);

    const inserts = mock.getInsertCalls().filter((c) => c.table === 'sms_logs');
    assertEquals(inserts.length, 1);
    assertEquals(inserts[0].data.status, 'simulated');
  },
);

Deno.test('SRH-020b: sendSms - demo instance over limit returns failure', async () => {
  const demoInstanceId = DEMO_INSTANCE_IDS[0];
  const mock = createMockSupabase({
    rpc: {
      check_sms_available: () => ({ data: false, error: null }),
    },
    tables: {
      sms_logs: {
        insert: () => ({ data: null, error: null }),
      },
    },
  });

  const result = await sendSms(
    '+48733854184',
    'Test message',
    'token123',
    mock.client,
    demoInstanceId,
    'res-1',
    'reminder_1day',
  );

  assertEquals(result.success, false);
  assertEquals(result.errorReason, 'demo_sms_limit_exceeded');

  const inserts = mock.getInsertCalls().filter((c) => c.table === 'sms_logs');
  assertEquals(inserts.length, 1);
  assertEquals(inserts[0].data.status, 'failed');
});

Deno.test('SRH-021: sendSms - invalid phone (too short) returns failure', async () => {
  const mock = createMockSupabase({
    tables: {
      sms_logs: {
        insert: () => ({ data: null, error: null }),
      },
    },
  });

  const result = await sendSms(
    '12345',
    'Test',
    'token123',
    mock.client,
    'inst-1',
    'res-1',
    'reminder_1day',
  );

  assertEquals(result.success, false);
  assertEquals(result.errorReason, 'invalid_phone_length');

  const inserts = mock.getInsertCalls().filter((c) => c.table === 'sms_logs');
  assertEquals(inserts.length, 1);
  assertEquals(inserts[0].data.status, 'failed');
});

Deno.test('SRH-022: sendSms - SMSAPI success logs sent', async () => {
  const fetchStub = stub(globalThis, 'fetch', () =>
    Promise.resolve(new Response(JSON.stringify({ count: 1, list: [{ id: '123' }] }))),
  );

  try {
    const mock = createMockSupabase({
      tables: {
        sms_logs: {
          insert: () => ({ data: null, error: null }),
        },
      },
    });

    const result = await sendSms(
      '+48733854184',
      'Reminder',
      'token123',
      mock.client,
      'inst-1',
      'res-1',
      'reminder_1day',
      'MySender',
    );

    assertEquals(result.success, true);

    const inserts = mock.getInsertCalls().filter((c) => c.table === 'sms_logs');
    assertEquals(inserts.length, 1);
    assertEquals(inserts[0].data.status, 'sent');
  } finally {
    fetchStub.restore();
  }
});

Deno.test('SRH-023: sendSms - SMSAPI error returns failure with error code', async () => {
  const fetchStub = stub(globalThis, 'fetch', () =>
    Promise.resolve(new Response(JSON.stringify({ error: 101, message: 'Invalid number' }))),
  );

  try {
    const mock = createMockSupabase({
      tables: {
        sms_logs: {
          insert: () => ({ data: null, error: null }),
        },
      },
    });

    const result = await sendSms(
      '+48733854184',
      'Reminder',
      'token123',
      mock.client,
      'inst-1',
      'res-1',
      'reminder_1hour',
    );

    assertEquals(result.success, false);
    assertEquals(result.errorReason, '101');

    const inserts = mock.getInsertCalls().filter((c) => c.table === 'sms_logs');
    assertEquals(inserts.length, 1);
    assertEquals(inserts[0].data.status, 'failed');
  } finally {
    fetchStub.restore();
  }
});

Deno.test('SRH-024: sendSms - network error returns failure', async () => {
  const fetchStub = stub(globalThis, 'fetch', () => Promise.reject(new Error('Network error')));

  try {
    const mock = createMockSupabase({
      tables: {
        sms_logs: {
          insert: () => ({ data: null, error: null }),
        },
      },
    });

    const result = await sendSms(
      '+48733854184',
      'Reminder',
      'token123',
      mock.client,
      'inst-1',
      'res-1',
      'reminder_1day',
    );

    assertEquals(result.success, false);
    assertEquals(result.errorReason, 'network_error');
  } finally {
    fetchStub.restore();
  }
});

Deno.test('SRH-025: sendSms - includes sender name in SMSAPI request', async () => {
  let capturedBody: string | undefined;

  const fetchStub = stub(
    globalThis,
    'fetch',
    (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body?.toString();
      return Promise.resolve(new Response(JSON.stringify({ count: 1, list: [{ id: '123' }] })));
    },
  );

  try {
    const mock = createMockSupabase({
      tables: {
        sms_logs: {
          insert: () => ({ data: null, error: null }),
        },
      },
    });

    await sendSms(
      '+48733854184',
      'Test',
      'token123',
      mock.client,
      'inst-1',
      'res-1',
      'reminder_1day',
      'MySender',
    );

    assertEquals(capturedBody?.includes('from=MySender'), true);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("SRH-026: sendSms - no sender name omits 'from' param", async () => {
  let capturedBody: string | undefined;

  const fetchStub = stub(
    globalThis,
    'fetch',
    (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body?.toString();
      return Promise.resolve(new Response(JSON.stringify({ count: 1, list: [{ id: '123' }] })));
    },
  );

  try {
    const mock = createMockSupabase({
      tables: {
        sms_logs: {
          insert: () => ({ data: null, error: null }),
        },
      },
    });

    await sendSms(
      '+48733854184',
      'Test',
      'token123',
      mock.client,
      'inst-1',
      'res-1',
      'reminder_1day',
      null,
    );

    assertEquals(capturedBody?.includes('from='), false);
  } finally {
    fetchStub.restore();
  }
});

// ========================
// buildInstanceSettingsMap
// ========================

Deno.test('SRH-030: buildInstanceSettingsMap - null input returns empty map', () => {
  const map = buildInstanceSettingsMap(null);
  assertEquals(map.size, 0);
});

Deno.test('SRH-031: buildInstanceSettingsMap - groups settings by instance', () => {
  const settings = [
    { instance_id: 'inst-1', message_type: 'reminder_1day', enabled: true, send_at_time: '19:00' },
    { instance_id: 'inst-1', message_type: 'reminder_1hour', enabled: false, send_at_time: null },
    { instance_id: 'inst-2', message_type: 'reminder_1day', enabled: false, send_at_time: null },
  ];

  const map = buildInstanceSettingsMap(settings);

  assertEquals(map.size, 2);
  assertEquals(map.get('inst-1')?.reminder1day?.enabled, true);
  assertEquals(map.get('inst-1')?.reminder1hour?.enabled, false);
  assertEquals(map.get('inst-2')?.reminder1day?.enabled, false);
  assertEquals(map.get('inst-2')?.reminder1hour, null);
});

// ========================
// isReminderEnabledForInstance
// ========================

Deno.test('SRH-035: isReminderEnabledForInstance - no settings returns true (default)', () => {
  const map = new Map();

  assertEquals(isReminderEnabledForInstance(map, 'inst-1', '1day'), true);
  assertEquals(isReminderEnabledForInstance(map, 'inst-1', '1hour'), true);
});

Deno.test('SRH-036: isReminderEnabledForInstance - explicitly disabled returns false', () => {
  const map = buildInstanceSettingsMap([
    { instance_id: 'inst-1', message_type: 'reminder_1day', enabled: false, send_at_time: null },
  ]);

  assertEquals(isReminderEnabledForInstance(map, 'inst-1', '1day'), false);
  // 1hour has no setting for this instance, so default true
  assertEquals(isReminderEnabledForInstance(map, 'inst-1', '1hour'), true);
});

Deno.test('SRH-037: isReminderEnabledForInstance - explicitly enabled returns true', () => {
  const map = buildInstanceSettingsMap([
    { instance_id: 'inst-1', message_type: 'reminder_1hour', enabled: true, send_at_time: null },
  ]);

  assertEquals(isReminderEnabledForInstance(map, 'inst-1', '1hour'), true);
});

// ========================
// Constants
// ========================

Deno.test('SRH-040: BACKOFF_MINUTES is 15', () => {
  assertEquals(BACKOFF_MINUTES, 15);
});

Deno.test('SRH-041: MAX_FAILURE_COUNT is 3', () => {
  assertEquals(MAX_FAILURE_COUNT, 3);
});

Deno.test('SRH-042: DEMO_INSTANCE_IDS contains expected ID', () => {
  assertEquals(DEMO_INSTANCE_IDS.length, 1);
  assertEquals(DEMO_INSTANCE_IDS[0], 'b3c29bfe-f393-4e1a-a837-68dd721df420');
});
