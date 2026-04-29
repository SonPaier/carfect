-- ivfflat with lists=10 + default probes=1 misses results for small training
-- datasets (<100 rows). Sequential scan is faster and more accurate at our
-- scale. Drop ivfflat indexes; reintroduce when training data grows past 1000
-- rows (and tune lists ≈ sqrt(rows)).
--
-- Also restore match_* functions to plain plpgsql (no SET — that requires
-- superuser and PostgREST runs as `authenticator`).

DROP INDEX IF EXISTS ai_analyst_schema_chunks_embedding_idx;
DROP INDEX IF EXISTS ai_analyst_glossary_embedding_idx;
DROP INDEX IF EXISTS ai_analyst_training_examples_embedding_idx;

-- Functions stay as defined in 20260430140100 (already use (embedding::text)::jsonb cast).
-- No-op redeclare here to be explicit about intent.

CREATE OR REPLACE FUNCTION match_schema_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id bigint, content text, metadata jsonb, embedding jsonb, similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.content, c.metadata, (c.embedding::text)::jsonb,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM ai_analyst_schema_chunks c
    WHERE c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_glossary(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id bigint, content text, metadata jsonb, embedding jsonb, similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.content, c.metadata, (c.embedding::text)::jsonb,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM ai_analyst_glossary c
    WHERE c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_training_examples(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id bigint, content text, metadata jsonb, embedding jsonb, similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.content, c.metadata, (c.embedding::text)::jsonb,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM ai_analyst_training_examples c
    WHERE c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
