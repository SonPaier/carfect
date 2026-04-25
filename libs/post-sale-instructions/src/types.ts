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
