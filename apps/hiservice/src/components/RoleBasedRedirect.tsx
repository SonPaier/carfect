import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const RoleBasedRedirect = () => {
  const { user, roles, loading, signOut } = useAuth();
  const [employeeConfigId, setEmployeeConfigId] = useState<string | null>(null);
  const [configResolved, setConfigResolved] = useState(false);

  const isEmployeeOnly =
    roles.some((r) => r.role === 'employee') &&
    !roles.some((r) => r.role === 'admin' || r.role === 'super_admin');

  useEffect(() => {
    if (!user) return; // don't touch configResolved until we have a user
    if (!isEmployeeOnly) {
      setConfigResolved(true);
      return;
    }
    setConfigResolved(false);
    supabase
      .from('employee_calendar_configs')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('sort_order')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setEmployeeConfigId(data?.id || null);
        setConfigResolved(true);
      });
  }, [user, isEmployeeOnly]);

  if (loading || (user && isEmployeeOnly && !configResolved)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Employee-only -> employee calendar view
  if (isEmployeeOnly && employeeConfigId) {
    return <Navigate to={`/employee-calendars/${employeeConfigId}`} replace />;
  }

  // Employee without calendar config — show message instead of redirect loop
  if (isEmployeeOnly && configResolved && !employeeConfigId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-muted-foreground">
          Brak przypisanego kalendarza. Skontaktuj się z administratorem.
        </p>
        <button onClick={() => signOut()} className="text-sm text-primary hover:underline">
          Wyloguj
        </button>
      </div>
    );
  }

  // Hall role -> halls view
  const hallRole = roles.find((r) => r.role === 'hall');
  if (hallRole) {
    if (hallRole.hall_id) {
      return <Navigate to={`/halls/${hallRole.hall_id}`} replace />;
    }
    return <Navigate to="/halls/1" replace />;
  }

  // Super admin
  if (roles.some((r) => r.role === 'super_admin')) {
    return <Navigate to="/super-admin" replace />;
  }

  // Sales-only
  const hasSalesRole = roles.some((r) => r.role === 'sales');
  const hasStudioAccess = roles.some((r) => r.role === 'admin' || r.role === 'employee');

  if (hasSalesRole && !hasStudioAccess) {
    return <Navigate to="/sales" replace />;
  }

  // Admin -> dashboard
  if (hasStudioAccess) {
    const hostname = window.location.hostname;
    const isSubdomain = hostname.endsWith('.hiservice.pl');
    return <Navigate to={isSubdomain ? '/' : '/admin'} replace />;
  }

  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect;
