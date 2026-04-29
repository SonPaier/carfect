// libs/ai/src/server/validateSql.ts
const FORBIDDEN_KEYWORDS = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create)\b/i;

export function validateSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;+$/, '').trim();
  if (!/^select\b/i.test(trimmed)) return 'Only SELECT statements are allowed';
  if (trimmed.includes(';')) return 'Multi-statement queries are not allowed';
  if (FORBIDDEN_KEYWORDS.test(trimmed)) return 'DDL/DML keyword detected';
  return null;
}
