import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HintsRenderer } from '@shared/in-app-hints';

// Thin wrapper that reads auth context and current route,
// then passes them to the shared HintsRenderer.
export function AdminHintsRenderer() {
  const { user, roles } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  const userRoles = roles.map((r) => r.role);

  return (
    <HintsRenderer
      supabaseClient={supabase}
      userId={user.id}
      userRoles={userRoles}
      currentRoute={pathname}
    />
  );
}
