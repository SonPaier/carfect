import { describe, it, expect } from 'vitest';
import { routeMatches, filterHints } from './utils';
import type { AppHint } from './types';

const makeHint = (overrides: Partial<AppHint> = {}): AppHint => ({
  id: '1',
  type: 'popup',
  title: 'Test',
  body: 'Body',
  image_url: null,
  target_element_id: null,
  route_pattern: null,
  target_roles: ['admin'],
  delay_ms: 0,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('routeMatches', () => {
  it('IAH-U-001: null pattern matches any route', () => {
    expect(routeMatches(null, '/admin')).toBe(true);
    expect(routeMatches(null, '/halls/123')).toBe(true);
  });

  it('IAH-U-002: wildcard pattern matches any route', () => {
    expect(routeMatches('*', '/admin')).toBe(true);
    expect(routeMatches('*', '/')).toBe(true);
  });

  it('IAH-U-003: exact prefix match', () => {
    expect(routeMatches('/admin', '/admin')).toBe(true);
    expect(routeMatches('/admin', '/admin/settings')).toBe(true);
  });

  it('IAH-U-004: does not match different prefix', () => {
    expect(routeMatches('/admin', '/halls')).toBe(false);
    expect(routeMatches('/admin', '/sales-crm')).toBe(false);
  });

  it('IAH-U-005: empty string pattern matches any route', () => {
    expect(routeMatches('', '/admin')).toBe(true);
  });
});

describe('filterHints', () => {
  it('IAH-U-006: filters hints by matching role', () => {
    const hints = [
      makeHint({ id: '1', target_roles: ['admin'] }),
      makeHint({ id: '2', target_roles: ['employee'] }),
      makeHint({ id: '3', target_roles: ['admin', 'employee'] }),
    ];

    const result = filterHints(hints, ['admin'], '/admin');

    expect(result.map((h) => h.id)).toEqual(['1', '3']);
  });

  it('IAH-U-007: filters hints by route pattern', () => {
    const hints = [
      makeHint({ id: '1', route_pattern: '/admin' }),
      makeHint({ id: '2', route_pattern: '/halls' }),
      makeHint({ id: '3', route_pattern: null }),
    ];

    const result = filterHints(hints, ['admin'], '/admin');

    expect(result.map((h) => h.id)).toEqual(['1', '3']);
  });

  it('IAH-U-008: returns empty array when no hints match role', () => {
    const hints = [makeHint({ target_roles: ['sales'] })];
    expect(filterHints(hints, ['admin'], '/admin')).toHaveLength(0);
  });

  it('IAH-U-009: returns empty array for empty hints list', () => {
    expect(filterHints([], ['admin'], '/admin')).toHaveLength(0);
  });

  it('IAH-U-010: applies both role and route filters simultaneously', () => {
    const hints = [
      makeHint({ id: '1', target_roles: ['admin'], route_pattern: '/admin' }),
      makeHint({ id: '2', target_roles: ['admin'], route_pattern: '/halls' }),
      makeHint({ id: '3', target_roles: ['sales'], route_pattern: '/admin' }),
    ];

    const result = filterHints(hints, ['admin'], '/admin');

    expect(result.map((h) => h.id)).toEqual(['1']);
  });
});
