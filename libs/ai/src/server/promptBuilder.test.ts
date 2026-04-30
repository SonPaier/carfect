// libs/ai/src/server/promptBuilder.test.ts
import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from './promptBuilder';

describe('buildSystemPrompt', () => {
  it('embeds today date and schema context', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toContain('2026-04-30');
    expect(prompt).toContain('carfect');
  });

  it('mentions diagnostic loop rule', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/0 wier|brak danych|auto_overview/i);
  });

  it('explicitly forbids WHERE instance_id', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/instance_id/i);
    expect(prompt).toMatch(/RLS/i);
  });

  it('lists tool usage order', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/lookup_schema/);
    expect(prompt).toMatch(/find_similar_questions/);
    expect(prompt).toMatch(/run_sql/);
  });

  it('forbids hallucinating numbers', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/nie wymyślaj|nigdy.*wymyślaj/i);
  });

  it('forbids leaking technical details (UUIDs, table names, column names)', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/nie ujawniaj|nigdy.*nie.*ujawniaj/i);
    expect(prompt).toMatch(/UUID/);
    expect(prompt).toMatch(/nazw tabel|nazw kolumn/i);
  });

  it('refuses cross-tenant queries from the user', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/innego warsztatu|innej instancji/i);
    expect(prompt).toMatch(/odmów|odpowiedz odmownie/i);
  });

  it('requires business language over technical', () => {
    const prompt = buildSystemPrompt({ schemaContext: 'carfect', todayIso: '2026-04-30' });
    expect(prompt).toMatch(/biznesowym|biznesowy/i);
  });
});
