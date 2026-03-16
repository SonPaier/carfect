import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  instance_id: string;
  name: string;
  photo_url: string | null;
  hourly_rate: number | null;
  active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeInput {
  name: string;
  photo_url?: string | null;
  hourly_rate?: number | null;
  active?: boolean;
  sort_order?: number | null;
}

const employeesKey = (instanceId: string | null) => ['employees', instanceId] as const;

export const useEmployees = (instanceId: string | null) => {
  return useQuery({
    queryKey: employeesKey(instanceId),
    queryFn: async (): Promise<Employee[]> => {
      if (!instanceId) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('instance_id', instanceId)
        .order('sort_order', { ascending: true, nullsFirst: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!instanceId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateEmployee = (instanceId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EmployeeInput) => {
      if (!instanceId) throw new Error('No instance ID');

      const { data, error } = await supabase
        .from('employees')
        .insert({
          instance_id: instanceId,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    },
    onSuccess: (newEmployee) => {
      queryClient.setQueryData<Employee[]>(employeesKey(instanceId), (old) =>
        old ? [...old, newEmployee] : [newEmployee],
      );
    },
  });
};

export const useUpdateEmployee = (instanceId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: EmployeeInput & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Employee[]>(
        employeesKey(instanceId),
        (old) => old?.map((e) => (e.id === updated.id ? updated : e)) ?? [],
      );
    },
  });
};

export const useDeleteEmployee = (instanceId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', employeeId);
      if (error) throw error;
      return employeeId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Employee[]>(
        employeesKey(instanceId),
        (old) => old?.filter((e) => e.id !== deletedId) ?? [],
      );
    },
  });
};
