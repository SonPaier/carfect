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
  const { messages, sendMessage, status, error } = useAiAnalyst({
    instanceId,
    schemaContext,
    supabaseClient,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage({ text });
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
          disabled={isLoading}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Analizuję...' : 'Wyślij'}
        </button>
      </form>

      {/* Suggestions — show when no messages */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSubmit(s.prompt)}
              disabled={isLoading}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {message.role === 'user' ? (
              <div className="flex justify-end">
                <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm max-w-[80%]">
                  {message.parts?.map((part, i) =>
                    part.type === 'text' ? <span key={i}>{part.text}</span> : null,
                  ) || message.content}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {message.parts?.map((part, i) => {
                  if (part.type === 'text' && part.text) {
                    return (
                      <p key={i} className="text-sm whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }
                  if (part.type === 'tool-invocation') {
                    const toolInvocation = part as any;
                    if (toolInvocation.state === 'result') return null; // Don't show raw results
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Pobieram dane...
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator when waiting for first response */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Analizuję...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message || 'Nie udało się przetworzyć zapytania'}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions — show after messages too */}
      {messages.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSubmit(s.prompt)}
              disabled={isLoading}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
