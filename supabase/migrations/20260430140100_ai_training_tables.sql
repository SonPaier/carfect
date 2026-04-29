-- Training data tables for AI Analyst RAG (LangChain SupabaseVectorStore-compatible shape).

CREATE TABLE ai_analyst_schema_chunks (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_analyst_glossary (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_analyst_training_examples (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes (lists=10, sqrt of initial seed ~30-50 rows)
CREATE INDEX ai_analyst_schema_chunks_embedding_idx
  ON ai_analyst_schema_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX ai_analyst_glossary_embedding_idx
  ON ai_analyst_glossary USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX ai_analyst_training_examples_embedding_idx
  ON ai_analyst_training_examples USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- RPCs matching LangChain SupabaseVectorStore signature
CREATE OR REPLACE FUNCTION match_schema_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id bigint, content text, metadata jsonb, embedding jsonb, similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.content, c.metadata, c.embedding::jsonb,
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
    SELECT c.id, c.content, c.metadata, c.embedding::jsonb,
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
    SELECT c.id, c.content, c.metadata, c.embedding::jsonb,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM ai_analyst_training_examples c
    WHERE c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Read-only for authenticated; writes only via service_role (sync script)
ALTER TABLE ai_analyst_schema_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyst_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyst_training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_schema_chunks" ON ai_analyst_schema_chunks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_glossary" ON ai_analyst_glossary
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_training_examples" ON ai_analyst_training_examples
  FOR SELECT TO authenticated USING (true);
