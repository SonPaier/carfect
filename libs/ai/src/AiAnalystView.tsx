import { useState, useRef, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAiAnalyst } from './useAiAnalyst';
import type { AiAnalystSuggestion } from './types';

interface AiAnalystViewProps {
  instanceId: string;
  suggestions: AiAnalystSuggestion[];
  schemaContext: 'carfect' | 'hiservice';
  supabaseClient: SupabaseClient;
}

export function AiAnalystView({
  instanceId,
  suggestions,
  schemaContext,
  supabaseClient,
}: AiAnalystViewProps) {
  const [input, setInput] = useState('');
  const { history, ask } = useAiAnalyst({ instanceId, schemaContext, supabaseClient });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text) return;
    setInput('');
    ask(text);
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <h2 className="text-xl font-semibold">Asystent AI</h2>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Zapytaj o swój biznes..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Wyślij
        </button>
      </form>

      {/* Suggestions — show when no history */}
      {history.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSubmit(s.prompt)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* History */}
      <div className="space-y-6">
        {history.map((entry) => (
          <div key={entry.id} className="space-y-3">
            {/* User prompt */}
            <div className="flex justify-end">
              <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm max-w-[80%]">
                {entry.prompt}
              </div>
            </div>

            {/* Response */}
            {entry.loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Analizuję...
              </div>
            ) : entry.error ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {entry.error}
              </div>
            ) : entry.response ? (
              <div className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{entry.response.answer}</p>
                {entry.response.table && (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {entry.response.table.headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {entry.response.table.rows.map((row, ri) => (
                          <tr key={ri} className="border-b last:border-0">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — show after queries too */}
      {history.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSubmit(s.prompt)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
