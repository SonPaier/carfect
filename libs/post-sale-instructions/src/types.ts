import type { Database } from '../../../apps/carfect/src/integrations/supabase/types';

export type PostSaleInstructionRow = Database['public']['Tables']['post_sale_instructions']['Row'];
export type PostSaleInstructionInsert =
  Database['public']['Tables']['post_sale_instructions']['Insert'];
export type PostSaleInstructionUpdate =
  Database['public']['Tables']['post_sale_instructions']['Update'];
export type InstructionSendRow = Database['public']['Tables']['post_sale_instruction_sends']['Row'];

// Tiptap document shape — minimal type, avoids hard dep on @tiptap types
export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}
export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

export type HardcodedKey = 'ppf' | 'ceramic';

export interface BuiltinTemplate {
  key: HardcodedKey;
  titlePl: string;
  titleEn: string;
  getContent: () => TiptapDocument;
}

// Discriminated union for list rendering (built-ins first, then DB rows)
export type InstructionListItem =
  | { kind: 'builtin'; template: BuiltinTemplate }
  | { kind: 'custom'; row: PostSaleInstructionRow };
