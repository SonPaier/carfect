/**
 * Minimal structural interface for the Supabase client subset used by billing hooks.
 * Avoids importing @supabase/supabase-js as a dependency in the shared lib.
 */

interface SupabaseQueryBuilder {
  select: (...args: unknown[]) => SupabaseQueryBuilder;
  eq: (col: string, val: unknown) => SupabaseQueryBuilder;
  order: (col: string, opts?: Record<string, unknown>) => SupabaseQueryBuilder;
  range: (from: number, to: number) => SupabaseQueryBuilder;
  single: () => Promise<{ data: unknown; error: unknown }>;
  then: (resolve: (val: unknown) => void) => Promise<unknown>;
}

export interface BillingSupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
}
