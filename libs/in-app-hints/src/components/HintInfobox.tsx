import { X } from 'lucide-react';
import type { AppHint } from '../types';

interface HintInfoboxProps {
  hint: AppHint;
  onDismiss: (id: string) => void;
}

export function HintInfobox({ hint, onDismiss }: HintInfoboxProps) {
  return (
    <div
      role="note"
      className="relative flex gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-snug">{hint.title}</p>
        {hint.body && <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{hint.body}</p>}
        {hint.image_url && (
          <img
            src={hint.image_url}
            alt=""
            className="mt-2 rounded-md object-cover max-h-40 w-full"
          />
        )}
      </div>
      <button
        type="button"
        aria-label="Zamknij"
        onClick={() => onDismiss(hint.id)}
        className="shrink-0 self-start rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
