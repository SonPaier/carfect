// libs/ai/src/server/tools/findSimilarQuestions.test.ts
import { describe, expect, it, vi } from 'vitest';
import { runFindSimilar } from './findSimilarQuestions';

describe('runFindSimilar', () => {
  it('embeds question and queries match_training_examples', async () => {
    const embed = vi.fn().mockResolvedValue([0.1, 0.2]);
    const rpc = vi.fn().mockResolvedValue({
      data: [{ content: 'Q?', metadata: { sql: 'SELECT 1', notes: 'x' } }],
      error: null,
    });
    const supabase = { rpc } as unknown as Parameters<typeof runFindSimilar>[0];
    const result = await runFindSimilar(supabase, { embed, schemaContext: 'carfect' }, 'test question');
    expect(embed).toHaveBeenCalledWith('test question');
    expect(rpc).toHaveBeenCalledWith('match_training_examples', expect.objectContaining({ filter: { schema_context: 'carfect' } }));
    expect(result.examples).toHaveLength(1);
    expect(result.examples[0].sql).toBe('SELECT 1');
    expect(result.examples[0].notes).toBe('x');
  });

  it('returns empty examples for empty question', async () => {
    const embed = vi.fn();
    const rpc = vi.fn();
    const supabase = { rpc } as unknown as Parameters<typeof runFindSimilar>[0];
    const result = await runFindSimilar(supabase, { embed, schemaContext: 'carfect' }, '   ');
    expect(result.examples).toEqual([]);
    expect(embed).not.toHaveBeenCalled();
  });
});
