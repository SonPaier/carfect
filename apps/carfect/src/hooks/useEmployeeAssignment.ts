import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseEmployeeAssignmentOptions {
  reservationId: string | null;
  initialEmployeeIds: string[];
}

export function useEmployeeAssignment({
  reservationId,
  initialEmployeeIds,
}: UseEmployeeAssignmentOptions) {
  const { t } = useTranslation();
  const [localAssignedEmployeeIds, setLocalAssignedEmployeeIds] = useState<string[]>([]);
  const [savingEmployees, setSavingEmployees] = useState(false);
  const [employeeDrawerOpen, setEmployeeDrawerOpen] = useState(false);

  // Sync from reservation prop
  useEffect(() => {
    setLocalAssignedEmployeeIds(initialEmployeeIds);
  }, [initialEmployeeIds]);

  const handleEmployeeSelect = useCallback(
    async (employeeIds: string[]) => {
      if (!reservationId) return;
      setSavingEmployees(true);
      try {
        const { error } = await supabase
          .from('reservations')
          .update({ assigned_employee_ids: employeeIds })
          .eq('id', reservationId);

        if (error) throw error;
        setLocalAssignedEmployeeIds(employeeIds);
        toast.success(t('common.saved'));
      } catch (error: unknown) {
        console.error('Error saving employees:', error);
        toast.error(t('common.error'));
      } finally {
        setSavingEmployees(false);
      }
    },
    [reservationId, t],
  );

  const handleRemoveEmployee = useCallback(
    async (employeeId: string) => {
      const updatedIds = localAssignedEmployeeIds.filter((id) => id !== employeeId);
      await handleEmployeeSelect(updatedIds);
    },
    [localAssignedEmployeeIds, handleEmployeeSelect],
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
