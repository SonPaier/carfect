import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppHints } from '../hooks/useAppHints';
import { useDismissHint } from '../hooks/useDismissHint';
import { HintPopup } from './HintPopup';
import { HintInfobox } from './HintInfobox';
import { HintTooltip } from './HintTooltip';
import { filterHints } from '../utils';
import type { HintsRendererProps } from '../types';

const SLOT_ID = 'hint-infobox-slot';

/**
 * Watches for the infobox slot element to appear/change in the DOM.
 * On initial load or route change, the slot may not exist yet when hints
 * data arrives, so we observe mutations and re-resolve the element.
 */
function useInfoboxSlot() {
  const [slot, setSlot] = useState<HTMLElement | null>(() => document.getElementById(SLOT_ID));

  useEffect(() => {
    // Re-check immediately (covers SSR hydration / late mounts)
    setSlot(document.getElementById(SLOT_ID));

    const observer = new MutationObserver(() => {
      const el = document.getElementById(SLOT_ID);
      setSlot((prev) => (prev === el ? prev : el));
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return slot;
}

export function HintsRenderer({
  supabaseClient,
  userId,
  userRoles,
  currentRoute,
}: HintsRendererProps) {
  const { data: hints = [] } = useAppHints({ supabaseClient, userId });
  const dismiss = useDismissHint({ supabaseClient, userId });
  const infoboxSlot = useInfoboxSlot();

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

      {/* Infoboxes rendered into the slot element via portal */}
      {infoboxes.length > 0 &&
        infoboxSlot &&
        createPortal(
          <>
            {infoboxes.map((hint) => (
              <HintInfobox key={hint.id} hint={hint} onDismiss={handleDismiss} />
            ))}
          </>,
          infoboxSlot,
        )}

      {/* Tooltips anchored to DOM elements */}
      {tooltips.map((hint) => (
        <HintTooltip key={hint.id} hint={hint} onDismiss={handleDismiss} />
      ))}
    </>
  );
}
