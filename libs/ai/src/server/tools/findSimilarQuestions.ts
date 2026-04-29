// libs/ai/src/server/tools/findSimilarQuestions.ts
import { tool } from 'langchain';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface FindSimilarDeps {
  embed: (text: string) => Promise<number[]>;
  schemaContext: 'carfect' | 'hiservice';
}

export interface SimilarQuestion {
  question_pl: string;
  sql: string;
  notes?: string;
}

export async function runFindSimilar(
  supabase: SupabaseClient,
  { embed, schemaContext }: FindSimilarDeps,
  question: string,
): Promise<{ examples: SimilarQuestion[] }> {
  if (!question.trim()) return { examples: [] };
  const embedding = await embed(question);
  const { data } = await supabase.rpc('match_training_examples', {
    query_embedding: embedding,
    match_count: 5,
    filter: { schema_context: schemaContext },
  });
  return {
    examples: (data ?? []).map(
      (r: { content: string; metadata: { sql: string; notes?: string } }) => ({
        question_pl: r.content,
        sql: r.metadata.sql,
        notes: r.metadata.notes,
      }),
    ),
  };
}

export function createFindSimilarTool(supabase: SupabaseClient, deps: FindSimilarDeps) {
  return tool(
    async ({ question }) => JSON.stringify(await runFindSimilar(supabase, deps, question)),
    {
      name: 'find_similar_questions',
      description:
        'Retrieve top 5 most similar past question→SQL pairs from training set. Use these as few-shot exemplars when generating new SQL.',
      schema: z.object({ question: z.string().min(1) }),
    },
  );
}
