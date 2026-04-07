import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { AppHint } from '../types';

interface HintTooltipProps {
  hint: AppHint;
  onDismiss: (id: string) => void;
}

interface Position {
  top: number;
  left: number;
  placement: 'above' | 'below';
}

const OFFSET = 8;
const TOOLTIP_WIDTH = 280;

function computePosition(targetEl: Element): Position {
  const rect = targetEl.getBoundingClientRect();
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const placement = spaceAbove >= spaceBelow ? 'above' : 'below';

  const top =
    placement === 'above'
      ? rect.top + window.scrollY - OFFSET
      : rect.bottom + window.scrollY + OFFSET;

  // Center horizontally over the target, clamped within viewport
  const centeredLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  const left = Math.max(8, Math.min(centeredLeft, window.innerWidth - TOOLTIP_WIDTH - 8));

  return { top, left, placement };
}

export function HintTooltip({ hint, onDismiss }: HintTooltipProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!hint.target_element_id) return;

    const update = () => {
      const el = document.querySelector(`[data-hint-id="${hint.target_element_id}"]`);
      if (el) {
        setPosition(computePosition(el));
      }
    };

    update();

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    });

    // Observe body size changes (layout shifts)
    observer.observe(document.body);
    window.addEventListener('scroll', update, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      cancelAnimationFrame(rafRef.current);
    };
  }, [hint.target_element_id]);

  if (!position) return null;

  const transformY = position.placement === 'above' ? '-100%' : '0';

  return createPortal(
    <div
      role="tooltip"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: TOOLTIP_WIDTH,
        transform: `translateY(${transformY})`,
        zIndex: 9999,
      }}
      className="rounded-lg border border-border bg-popover text-popover-foreground shadow-md px-3 py-2.5 text-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug">{hint.title}</p>
        <button
          type="button"
          aria-label="Zamknij"
          onClick={() => onDismiss(hint.id)}
          className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {hint.image_url && (
        <img src={hint.image_url} alt="" className="mt-2 rounded-md object-cover max-h-32 w-full" />
      )}
      {hint.body && <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{hint.body}</p>}
    </div>,
    document.body,
  );
}
