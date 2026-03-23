import { useState, useRef, useEffect, useCallback } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const handleSubmit = (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto w-full">
      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto px-1">
        {/* Empty state with centered suggestions */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Asystent AI</h2>
              <p className="text-sm text-muted-foreground">
                Zapytaj o swój biznes — przychody, klientów, usługi, rezerwacje...
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
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
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div className="space-y-4 py-4">
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
                        if (toolInvocation.state === 'result') return null;
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

            {/* Loading indicator */}
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
        )}
      </div>

      {/* Fixed bottom input + suggestions */}
      <div className="shrink-0 border-t bg-background pt-3 pb-2 space-y-2">
        {/* Suggestions after messages */}
        {hasMessages && !isLoading && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleSubmit(s.prompt)}
                disabled={isLoading}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zapytaj o swój biznes..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            style={{ maxHeight: 200 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="inline-flex items-center justify-center rounded-md bg-primary h-9 w-9 shrink-0 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
