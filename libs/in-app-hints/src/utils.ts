import type { AppHint } from './types';

export function routeMatches(pattern: string | null, currentRoute: string): boolean {
  if (!pattern || pattern === '*') return true;
  return currentRoute.startsWith(pattern);
}

export function filterHints(
  hints: AppHint[],
  userRoles: string[],
  currentRoute: string,
): AppHint[] {
  return hints.filter(
    (hint) =>
      hint.target_roles.some((r) => userRoles.includes(r)) &&
      routeMatches(hint.route_pattern, currentRoute),
  );
}
