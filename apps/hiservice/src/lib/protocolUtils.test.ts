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
    expect(visits[0]).toMatchObject({ itemDate: '2026-03-19', durationMinutes: 92 });
    expect(visits[1]).toMatchObject({ itemDate: '2026-03-22', durationMinutes: 135 });
  });

  it('returns empty array for items without work times', () => {
    expect(getVisitsFromChain([{ item_date: '2026-03-19' }])).toEqual([]);
  });
});

describe('client total rounding', () => {
  it('sums rounded per-visit values (not rounds the raw sum)', () => {
    // Two visits of 31min each → per-visit rounded: 60 + 60 = 120min
    // Wrong approach: roundUpTo30(31+31=62) = 90min — contradicts per-row values
    const visits = [
      { itemDate: '2026-03-19', durationMinutes: 31 },
      { itemDate: '2026-03-20', durationMinutes: 31 },
    ];

    const correctTotal = visits.reduce((sum, v) => sum + roundUpTo30(v.durationMinutes), 0);
    const wrongTotal = roundUpTo30(visits.reduce((sum, v) => sum + v.durationMinutes, 0));

    expect(correctTotal).toBe(120); // 60 + 60
    expect(wrongTotal).toBe(90); // roundUpTo30(62)
    expect(correctTotal).not.toBe(wrongTotal);
  });
});

describe('visits total rounding', () => {
  // Regression: the total "for client" duration must be the SUM of per-visit rounded
  // values, NOT roundUpTo30 applied to the raw sum.
  // Example: two 31-min visits → each rounds to 60min → total must be 120min.
  // roundUpTo30(31+31=62) would wrongly give 90min.
  it('summing rounded per-visit values differs from rounding the raw sum', () => {
    const visits = getVisitsFromChain([
      {
        item_date: '2026-03-01',
        work_started_at: '2026-03-01T08:00:00Z',
        work_ended_at: '2026-03-01T08:31:00Z', // 31 min → rounds to 60
      },
      {
        item_date: '2026-03-02',
        work_started_at: '2026-03-02T08:00:00Z',
        work_ended_at: '2026-03-02T08:31:00Z', // 31 min → rounds to 60
      },
    ]);

    expect(visits).toHaveLength(2);
    const sumOfRounded = visits.reduce((sum, v) => sum + roundUpTo30(v.durationMinutes), 0);
    const roundedSum = roundUpTo30(visits.reduce((sum, v) => sum + v.durationMinutes, 0));

    // Correct: sum of rounded per-visit values = 60 + 60 = 120
    expect(sumOfRounded).toBe(120);
    // Wrong approach: rounding the raw total = roundUpTo30(62) = 90 — inconsistent with per-row display
    expect(roundedSum).toBe(90);
    // They must not be equal in this case, confirming the distinction matters
    expect(sumOfRounded).not.toBe(roundedSum);
  });
});
