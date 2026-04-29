// libs/ai/src/server/tools/lookupSchema.test.ts
import { describe, expect, it, vi } from 'vitest';
import { runLookupSchema } from './lookupSchema';

describe('runLookupSchema', () => {
  it('embeds the joined terms and queries both RPCs with schema_context filter', async () => {
    const embed = vi.fn().mockResolvedValue([0.1, 0.2]);
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          { content: 'reservations table', metadata: { table_name: 'reservations', columns: [] } },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            content: 'zlecenia term',
            metadata: {
              term_pl: 'zlecenia',
              meaning: 'rezerwacje',
              related_tables: ['reservations'],
            },
          },
        ],
        error: null,
      });
    const supabase = { rpc } as unknown as Parameters<typeof runLookupSchema>[0];

    const result = await runLookupSchema(supabase, { embed, schemaContext: 'carfect' }, [
      'zlecenia',
      'marzec',
    ]);
    expect(embed).toHaveBeenCalledWith('zlecenia marzec');
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      'match_schema_chunks',
      expect.objectContaining({ filter: { schema_context: 'carfect' } }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'match_glossary',
      expect.objectContaining({ filter: { schema_context: 'carfect' } }),
    );
    expect(result.tables).toHaveLength(1);
    expect(result.glossary).toHaveLength(1);
  });

  it('handles empty embedding gracefully', async () => {
    const embed = vi.fn().mockResolvedValue([]);
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const supabase = { rpc } as unknown as Parameters<typeof runLookupSchema>[0];
    const result = await runLookupSchema(supabase, { embed, schemaContext: 'carfect' }, []);
    expect(result.tables).toEqual([]);
    expect(result.glossary).toEqual([]);
  });
});
