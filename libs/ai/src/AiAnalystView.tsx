import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ChartRenderer, type ChartRendererSpec } from '@shared/ui';
import { useAiAnalyst } from './useAiAnalyst';
import type { AiAnalystSuggestion } from './types';
import { ChartSpecSchema, type ChartSpec } from './charts/chartSpec';

interface Props {
  instanceId: string;
  suggestions: AiAnalystSuggestion[];
  schemaContext: 'carfect' | 'hiservice';
  supabaseClient: SupabaseClient;
}

// tool-* parts (LLM tool invocations) stay hidden; data-chart is rendered below.
const HIDDEN_PART_PREFIXES = ['tool-'];

export function specToRenderer(spec: ChartSpec): ChartRendererSpec {
  return {
    type: spec.type,
    title: spec.title,
    data: spec.data,
    xKey: spec.x_key,
    yKeys: spec.y_keys,
    unit: spec.unit,
  };
}

export function parseChartPart(part: { type: string }): ChartSpec | null {
  if (part.type !== 'data-chart') return null;
  const rawSpec = (part as { data?: { spec?: unknown } }).data?.spec;
  const result = ChartSpecSchema.safeParse(rawSpec);
  return result.success ? result.data : null;
}

export function AiAnalystView({ instanceId, suggestions, schemaContext, supabaseClient }: Props) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useAiAnalyst({
    instanceId,
    schemaContext,
    supabaseClient,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const adjustHeight = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const submit = (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    sendMessage({ text });
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 border-b bg-background px-4 py-3">
        <div className="max-w-3xl mx-auto w-full flex items-baseline gap-2 flex-wrap">
          <h2 className="text-base font-semibold">{t('aiAnalyst.title')}</h2>
          <span className="text-sm text-muted-foreground">— {t('aiAnalyst.tagline')}</span>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => submit(s.prompt)}
                  disabled={isLoading}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="space-y-4 py-4 max-w-3xl mx-auto w-full">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm max-w-[80%]">
                      {(message.parts ?? [])
                        .filter((p) => p.type === 'text')
                        .map((p, i) => (
                          <span key={i}>{(p as { text: string }).text}</span>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(message.parts ?? []).map((part, i) => {
                      if (HIDDEN_PART_PREFIXES.some((prefix) => part.type.startsWith(prefix))) {
                        return null;
                      }
                      if (part.type === 'text') {
                        const text = (part as { text: string }).text;
                        return text ? (
                          <div key={i} className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                          </div>
                        ) : null;
                      }
                      const chartSpec = parseChartPart(part);
                      if (chartSpec) {
                        return <ChartRenderer key={i} spec={specToRenderer(chartSpec)} />;
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {t('aiAnalyst.analyzing')}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error.message || t('aiAnalyst.error')}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-background pt-3 pb-4 space-y-2 px-4">
        <div className="max-w-3xl mx-auto w-full space-y-2">
          {hasMessages && !isLoading && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => submit(s.prompt)}
                  disabled={isLoading}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t('aiAnalyst.placeholder')}
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
    </div>
  );
}
