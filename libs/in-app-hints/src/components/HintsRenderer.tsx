import { useEffect, useState } from 'react';
import { useAppHints } from '../hooks/useAppHints';
import { useDismissHint } from '../hooks/useDismissHint';
import { HintPopup } from './HintPopup';
import { HintInfobox } from './HintInfobox';
import { HintTooltip } from './HintTooltip';
import { filterHints } from '../utils';
import type { HintsRendererProps } from '../types';

export function HintsRenderer({
  supabaseClient,
  userId,
  userRoles,
  currentRoute,
}: HintsRendererProps) {
  const { data: hints = [] } = useAppHints({ supabaseClient, userId });
  const dismiss = useDismissHint({ supabaseClient, userId });

  // Track which hints have been locally dismissed (before the query refetches)
  const [locallyDismissed, setLocallyDismissed] = useState<Set<string>>(new Set());

  // Reset local dismissals when userId changes (different user logged in)
  useEffect(() => {
    setLocallyDismissed(new Set());
  }, [userId]);

  const handleDismiss = (hintId: string) => {
    setLocallyDismissed((prev) => new Set(prev).add(hintId));
    dismiss.mutate(hintId);
  };

  const visibleHints = filterHints(hints, userRoles, currentRoute).filter(
    (h) => !locallyDismissed.has(h.id),
  );

  const popups = visibleHints.filter((h) => h.type === 'popup');
  const infoboxes = visibleHints.filter((h) => h.type === 'infobox');
  const tooltips = visibleHints.filter((h) => h.type === 'tooltip');

  if (visibleHints.length === 0) return null;

  return (
    <>
      {/* Show only the first popup at a time */}
      {popups[0] && <HintPopup hint={popups[0]} onDismiss={handleDismiss} />}

      {/* Infoboxes rendered in a fixed banner area at the top */}
      {infoboxes.length > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-1 px-4 pt-2"
          aria-label="Komunikaty aplikacji"
        >
          {infoboxes.map((hint) => (
            <HintInfobox key={hint.id} hint={hint} onDismiss={handleDismiss} />
          ))}
        </div>
      )}

      {/* Tooltips anchored to DOM elements */}
      {tooltips.map((hint) => (
        <HintTooltip key={hint.id} hint={hint} onDismiss={handleDismiss} />
      ))}
    </>
  );
}
