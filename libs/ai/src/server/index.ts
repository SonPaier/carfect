// Server-only exports for @shared/ai. Importable as `@shared/ai/server`.

export { resolveInstanceId, AiAnalystAuthError } from './resolveInstanceId';
export { enforceRateLimit, USER_HOURLY_LIMIT } from './rateLimit';
export { insertAuditLog, computeCostUsd, type AuditLogPayload } from './auditLog';
export { buildSystemPrompt } from './promptBuilder';
export { buildAgent, type BuildAgentInput } from './createAgent';
export { validateSql } from './validateSql';
