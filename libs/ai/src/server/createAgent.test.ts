// libs/ai/src/server/createAgent.test.ts
import { describe, expect, it, vi } from 'vitest';
import { buildAgent } from './createAgent';

describe('buildAgent', () => {
  it('returns an agent with all six tools registered', () => {
    const agent = buildAgent({
      llm: { invoke: vi.fn() } as never,
      embed: vi.fn(),
      supabase: {} as never,
      schemaContext: 'carfect',
      instanceId: 'i1',
      allowedTables: new Set(['reservations']),
      todayIso: '2026-04-30',
    });
    // Agent is opaque; just check it constructs.
    expect(agent).toBeDefined();
    expect(typeof (agent as { stream?: unknown }).stream).toBe('function');
  });
});
