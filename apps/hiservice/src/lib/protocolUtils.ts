import type { ChecklistItem } from '@shared/ui';

/**
 * Builds default protocol notes from checklist items across a chain of calendar items.
 * Deduplicates by text (case-insensitive, trimmed).
 */
export function buildProtocolNotes(
  chainItems: Array<{ checklist_items?: ChecklistItem[] | null }>,
): string {
  const seen = new Set<string>();
  const done: string[] = [];
  const todo: string[] = [];

  for (const item of chainItems) {
    if (!Array.isArray(item.checklist_items)) continue;
    for (const task of item.checklist_items) {
      const key = task.text.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (task.checked) {
        done.push(task.text.trim());
      } else {
        todo.push(task.text.trim());
      }
    }
  }

  const sections: string[] = [];
  if (done.length > 0) {
    sections.push(`Wykonano:\n${done.map((t) => `- ${t}`).join('\n')}`);
  }
  if (todo.length > 0) {
    sections.push(`Pozostało do wykonania:\n${todo.map((t) => `- ${t}`).join('\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * Calculates visit duration in minutes from work_started_at and work_ended_at.
 * Returns null if either timestamp is missing.
 */
export function getVisitDurationMinutes(
  workStartedAt: string | null | undefined,
  workEndedAt: string | null | undefined,
): number | null {
  if (!workStartedAt || !workEndedAt) return null;
  const start = new Date(workStartedAt);
  const end = new Date(workEndedAt);
  const diff = end.getTime() - start.getTime();
  if (diff <= 0) return null;
  return Math.round(diff / (1000 * 60));
}

/**
 * Rounds minutes up to the nearest 30-minute increment.
 * e.g. 92 → 120, 30 → 30, 31 → 60
 */
export function roundUpTo30(minutes: number): number {
  return Math.ceil(minutes / 30) * 30;
}

/**
 * Formats duration in minutes as human-readable string.
 * e.g. 92 → "1h 32min", 120 → "2h", 30 → "30min"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export interface VisitInfo {
  itemDate: string;
  durationMinutes: number;
}

/**
 * Extracts visit info from a chain of calendar items.
 * Only includes items that have both work_started_at and work_ended_at.
 * Sorted by item_date ascending.
 */
export function getVisitsFromChain(
  chainItems: Array<{
    item_date?: string | null;
    work_started_at?: string | null;
    work_ended_at?: string | null;
  }>,
): VisitInfo[] {
  return chainItems
    .map((item) => {
      const dur = getVisitDurationMinutes(item.work_started_at, item.work_ended_at);
      if (dur === null || !item.item_date) return null;
      return { itemDate: item.item_date, durationMinutes: dur };
    })
    .filter((v): v is VisitInfo => v !== null)
    .sort((a, b) => a.itemDate.localeCompare(b.itemDate));
}
