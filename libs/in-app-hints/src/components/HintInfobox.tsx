import { X, Info } from 'lucide-react';
import type { AppHint } from '../types';

interface HintInfoboxProps {
  hint: AppHint;
  onDismiss: (id: string) => void;
}

export function HintInfobox({ hint, onDismiss }: HintInfoboxProps) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm"
    >
      <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-snug text-blue-900">{hint.title}</p>
        {hint.body && <p className="mt-1 text-foreground whitespace-pre-wrap">{hint.body}</p>}
      </div>
      <button
        type="button"
        aria-label="Zamknij"
        onClick={() => onDismiss(hint.id)}
        className="shrink-0 self-start rounded-sm p-0.5 text-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
