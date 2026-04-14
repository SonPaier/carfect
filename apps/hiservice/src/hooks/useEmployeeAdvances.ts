import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface EmployeeAdvance {
  id: string;
  instance_id: string;
  employee_id: string;
  amount: number;
  advance_date: string;
  note: string | null;
  created_at: string;
}

interface UseEmployeeAdvancesOptions {
  instanceId: string | null;
  month: Date;
}

export function useEmployeeAdvances({ instanceId, month }: UseEmployeeAdvancesOptions) {
  const queryClient = useQueryClient();
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  const queryKey = ['employee-advances', instanceId, monthStart];

  const { data: advances = [], isLoading } = useQuery({
    queryKey,
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('employee_advances')
        .select('*')
        .eq('instance_id', instanceId!)
        .gte('advance_date', monthStart)
        .lte('advance_date', monthEnd)
        .order('advance_date', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as EmployeeAdvance[];
    },
  });

  const addAdvance = useMutation({
    mutationFn: async (params: {
      employeeId: string;
      amount: number;
      date: string;
      note?: string;
    }) => {
      const { error } = await (supabase.from('employee_advances').insert({
        instance_id: instanceId,
        employee_id: params.employeeId,
        amount: params.amount,
        advance_date: params.date,
        note: params.note || null,
      }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteAdvance = useMutation({
    mutationFn: async (advanceId: string) => {
      const { error } = await (supabase
        .from('employee_advances')
        .delete()
        .eq('id', advanceId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const advancesByEmployee = new Map<string, number>();
  for (const a of advances) {
    const current = advancesByEmployee.get(a.employee_id) || 0;
    advancesByEmployee.set(a.employee_id, current + Number(a.amount));
  }

  return {
    advances,
    advancesByEmployee,
    isLoading,
    addAdvance: addAdvance.mutate,
    deleteAdvance: deleteAdvance.mutate,
    isAdding: addAdvance.isPending,
    isDeleting: deleteAdvance.isPending,
  };
}
