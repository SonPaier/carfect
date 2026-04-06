export interface AppHint {
  id: string;
  type: 'tooltip' | 'popup' | 'infobox';
  title: string;
  body: string;
  image_url: string | null;
  target_element_id: string | null;
  route_pattern: string | null;
  target_roles: string[];
  delay_ms: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppHintDismissal {
  id: string;
  hint_id: string;
  user_id: string;
  dismissed_at: string;
}

// Minimal structural interface — avoids coupling to a specific Supabase client version
export interface SupabaseClientLike {
  from: (table: string) => {
    select: (...args: unknown[]) => unknown;
    insert: (data: unknown) => unknown;
    eq: (...args: unknown[]) => unknown;
  };
}

export interface HintsRendererProps {
  supabaseClient: SupabaseClientLike;
  userId: string;
  userRoles: string[];
  currentRoute: string;
}
