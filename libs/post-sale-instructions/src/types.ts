import type { Database } from '../../../apps/carfect/src/integrations/supabase/types';

export type PostSaleInstructionRow = Database['public']['Tables']['post_sale_instructions']['Row'];
export type PostSaleInstructionInsert =
  Database['public']['Tables']['post_sale_instructions']['Insert'];
export type PostSaleInstructionUpdate =
  Database['public']['Tables']['post_sale_instructions']['Update'];
export type InstructionSendRow = Database['public']['Tables']['post_sale_instruction_sends']['Row'];

// TiptapDocument and related types live in @shared/ui to avoid circular deps.
// Re-export so consumers of @shared/post-sale-instructions get them from one place.
export type { TiptapDocument, TiptapNode, TiptapMark } from '@shared/ui';

export type HardcodedKey = 'ppf' | 'ceramic';

export interface BuiltinTemplate {
  key: HardcodedKey;
  titlePl: string;
  titleEn: string;
  getContent: () => import('@shared/ui').TiptapDocument;
}

// Discriminated union for list rendering (built-ins first, then DB rows)
export type InstructionListItem =
  | { kind: 'builtin'; template: BuiltinTemplate }
  | { kind: 'custom'; row: PostSaleInstructionRow };

/**
 * Hide a builtin template once a custom row exists for the same hardcoded_key
 * — both the settings list and the send picker need this to avoid the user
 * seeing a stale builtin alongside its customized variant.
 */
export function filterVisibleItems(items: InstructionListItem[]): InstructionListItem[] {
  const customKeys = new Set(
    items
      .filter((i): i is Extract<InstructionListItem, { kind: 'custom' }> => i.kind === 'custom')
      .map((i) => i.row.hardcoded_key)
      .filter((k): k is HardcodedKey => k !== null && k !== undefined),
  );
  return items.filter((item) => item.kind !== 'builtin' || !customKeys.has(item.template.key));
}
