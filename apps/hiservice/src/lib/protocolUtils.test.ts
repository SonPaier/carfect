import { describe, it, expect } from 'vitest';
import {
  buildProtocolNotes,
  getVisitDurationMinutes,
  roundUpTo30,
  formatDuration,
  getVisitsFromChain,
} from './protocolUtils';

describe('buildProtocolNotes', () => {
  it('generates notes with done and todo sections', () => {
    const chain = [
      {
        checklist_items: [
          { id: '1', text: 'Sprawdź ciśnienie', checked: true },
          { id: '2', text: 'Wymień filtr', checked: false },
        ],
      },
      {
        checklist_items: [{ id: '3', text: 'Test szczelności', checked: true }],
      },
    ];

    const result = buildProtocolNotes(chain);
    expect(result).toBe(
      'Wykonano:\n- Sprawdź ciśnienie\n- Test szczelności\n\nPozostało do wykonania:\n- Wymień filtr',
    );
  });

  it('deduplicates by text (case-insensitive)', () => {
    const chain = [
      {
        checklist_items: [{ id: '1', text: 'Wymień filtr', checked: true }],
      },
      {
        checklist_items: [{ id: '2', text: 'wymień filtr', checked: false }],
      },
    ];

    const result = buildProtocolNotes(chain);
    expect(result).toBe('Wykonano:\n- Wymień filtr');
  });

  it('omits "Pozostało" section when all done', () => {
    const chain = [
      {
        checklist_items: [
          { id: '1', text: 'Task A', checked: true },
          { id: '2', text: 'Task B', checked: true },
        ],
      },
    ];

    const result = buildProtocolNotes(chain);
    expect(result).toBe('Wykonano:\n- Task A\n- Task B');
    expect(result).not.toContain('Pozostało');
  });

  it('omits "Wykonano" section when nothing done', () => {
    const chain = [
      {
        checklist_items: [{ id: '1', text: 'Task A', checked: false }],
      },
    ];

    const result = buildProtocolNotes(chain);
    expect(result).toBe('Pozostało do wykonania:\n- Task A');
    expect(result).not.toContain('Wykonano');
  });

  it('returns empty string when no checklist items', () => {
    expect(buildProtocolNotes([])).toBe('');
    expect(buildProtocolNotes([{ checklist_items: null }])).toBe('');
    expect(buildProtocolNotes([{ checklist_items: [] }])).toBe('');
  });
});

describe('getVisitDurationMinutes', () => {
  it('calculates duration between timestamps', () => {
    expect(getVisitDurationMinutes('2026-03-19T08:00:00Z', '2026-03-19T09:32:00Z')).toBe(92);
  });

  it('returns null for missing timestamps', () => {
    expect(getVisitDurationMinutes(null, '2026-03-19T09:00:00Z')).toBeNull();
    expect(getVisitDurationMinutes('2026-03-19T08:00:00Z', null)).toBeNull();
    expect(getVisitDurationMinutes(null, null)).toBeNull();
  });

  it('returns null for zero or negative duration', () => {
    expect(getVisitDurationMinutes('2026-03-19T09:00:00Z', '2026-03-19T08:00:00Z')).toBeNull();
  });
});

describe('roundUpTo30', () => {
  it('rounds up to nearest 30 minutes', () => {
    expect(roundUpTo30(1)).toBe(30);
    expect(roundUpTo30(30)).toBe(30);
    expect(roundUpTo30(31)).toBe(60);
    expect(roundUpTo30(60)).toBe(60);
    expect(roundUpTo30(92)).toBe(120);
    expect(roundUpTo30(120)).toBe(120);
    expect(roundUpTo30(135)).toBe(150);
  });
});

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(92)).toBe('1h 32min');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(30)).toBe('30min');
    expect(formatDuration(150)).toBe('2h 30min');
    expect(formatDuration(60)).toBe('1h');
  });
});

describe('getVisitsFromChain', () => {
  it('extracts visits with duration from chain', () => {
    const chain = [
      {
        item_date: '2026-03-22',
        work_started_at: '2026-03-22T10:00:00Z',
        work_ended_at: '2026-03-22T12:15:00Z',
      },
      {
        item_date: '2026-03-19',
        work_started_at: '2026-03-19T08:00:00Z',
        work_ended_at: '2026-03-19T09:32:00Z',
      },
      {
        item_date: '2026-03-25',
        work_started_at: null,
        work_ended_at: null,
      },
    ];

    const visits = getVisitsFromChain(chain);
    expect(visits).toHaveLength(2);
    expect(visits[0]).toEqual({ itemDate: '2026-03-19', durationMinutes: 92 });
    expect(visits[1]).toEqual({ itemDate: '2026-03-22', durationMinutes: 135 });
  });

  it('returns empty array for items without work times', () => {
    expect(getVisitsFromChain([{ item_date: '2026-03-19' }])).toEqual([]);
  });
});
