import { describe, it, expect } from 'vitest';
import { filterVisibleItems } from './types';
import type { InstructionListItem } from './types';

const builtin = (key: 'ppf' | 'ceramic'): InstructionListItem => ({
  kind: 'builtin',
  template: {
    key,
    titlePl: `Builtin ${key}`,
    titleEn: `Builtin ${key}`,
    getContent: () => ({ type: 'doc', content: [] }),
  },
});

const custom = (
  id: string,
  hardcodedKey: 'ppf' | 'ceramic' | null = null,
): InstructionListItem => ({
  kind: 'custom',
  row: {
    id,
    instance_id: 'inst-1',
    title: `Custom ${id}`,
    slug: `custom-${id}`,
    content: { type: 'doc', content: [] },
    hardcoded_key: hardcodedKey,
    created_by: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
});

describe('filterVisibleItems — auto-promote semantics', () => {
  it('returns the input unchanged when there are no customs', () => {
    const items = [builtin('ppf'), builtin('ceramic')];
    expect(filterVisibleItems(items)).toHaveLength(2);
  });

  it('hides only the builtin whose hardcoded_key is owned by a custom row', () => {
    const items = [builtin('ppf'), builtin('ceramic'), custom('row-1', 'ppf')];
    const visible = filterVisibleItems(items);
    expect(visible).toHaveLength(2);
    expect(visible.map((i) => (i.kind === 'builtin' ? i.template.key : i.row.id))).toEqual([
      'ceramic',
      'row-1',
    ]);
  });

  it('keeps unrelated custom rows visible', () => {
    const items = [builtin('ppf'), custom('row-2', null)];
    expect(filterVisibleItems(items)).toHaveLength(2);
  });

  it('"editing the global template" semantics — once a custom with matching hardcoded_key exists, the builtin disappears for THIS instance only', () => {
    // Per-instance scoping is enforced by useInstructions(instanceId, ...)
    // which RLS-filters customs to instance_id. filterVisibleItems works on
    // the already-filtered list, so it can never hide a builtin globally —
    // an instance with no matching custom row still sees the builtin.
    const instanceWithCustom = filterVisibleItems([builtin('ppf'), custom('row-1', 'ppf')]);
    const instanceWithoutCustom = filterVisibleItems([builtin('ppf')]);

    expect(instanceWithCustom.some((i) => i.kind === 'builtin' && i.template.key === 'ppf')).toBe(
      false,
    );
    expect(
      instanceWithoutCustom.some((i) => i.kind === 'builtin' && i.template.key === 'ppf'),
    ).toBe(true);
  });
});
