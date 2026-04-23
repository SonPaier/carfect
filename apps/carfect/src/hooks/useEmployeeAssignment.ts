import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useReservationCacheUpdate } from './useReservationCacheUpdate';

interface UseEmployeeAssignmentOptions {
  reservationId: string | null;
  initialEmployeeIds: string[];
}

export function useEmployeeAssignment({
  reservationId,
  initialEmployeeIds,
}: UseEmployeeAssignmentOptions) {
  const { t } = useTranslation();
  const { invalidateReservations } = useReservationCacheUpdate();
  const [localAssignedEmployeeIds, setLocalAssignedEmployeeIds] = useState<string[]>([]);
  const [savingEmployees, setSavingEmployees] = useState(false);
  const [employeeDrawerOpen, setEmployeeDrawerOpen] = useState(false);

  // Ref to avoid stale closures in rapid mutations
  const employeeIdsRef = useRef(localAssignedEmployeeIds);
  employeeIdsRef.current = localAssignedEmployeeIds;

  // Sync from reservation prop — compare by value to avoid infinite loop
  const initialIdsKey = initialEmployeeIds.join(',');
  useEffect(() => {
    setLocalAssignedEmployeeIds(initialEmployeeIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stabilized via initialIdsKey
  }, [initialIdsKey]);

  const handleEmployeeSelect = useCallback(
    async (employeeIds: string[]) => {
      if (!reservationId) return;
      setSavingEmployees(true);

      // Snapshot for rollback
      const prevIds = employeeIdsRef.current;

      // Optimistic update (local state only — drawer updates instantly)
      setLocalAssignedEmployeeIds(employeeIds);

      try {
        const { error } = await supabase
          .from('reservations')
          .update({ assigned_employee_ids: employeeIds })
          .eq('id', reservationId);

        if (error) throw error;
        toast.success(t('common.saved'));
        invalidateReservations();
      } catch (error: unknown) {
        console.error('Error saving employees:', error);
        toast.error(t('common.error'));
        // Rollback
        setLocalAssignedEmployeeIds(prevIds);
      } finally {
        setSavingEmployees(false);
      }
    },
    [reservationId, invalidateReservations, t],
  );

  const handleRemoveEmployee = useCallback(
    async (employeeId: string) => {
      const updatedIds = employeeIdsRef.current.filter((id) => id !== employeeId);
      await handleEmployeeSelect(updatedIds);
    },
    [handleEmployeeSelect],
  );

  return {
    localAssignedEmployeeIds,
    setLocalAssignedEmployeeIds,
    savingEmployees,
    employeeDrawerOpen,
    setEmployeeDrawerOpen,
    handleEmployeeSelect,
    handleRemoveEmployee,
  };
}
