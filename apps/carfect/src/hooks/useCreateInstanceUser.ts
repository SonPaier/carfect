import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreateUserParams {
  instanceId: string;
  username: string;
  password: string;
  role: 'employee' | 'admin' | 'hall' | 'sales';
  hallId?: string;
}

export const useCreateInstanceUser = () => {
  const [isPending, setIsPending] = useState(false);

  const createUser = async ({ instanceId, username, password, role, hallId }: CreateUserParams) => {
    setIsPending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesja wygasła');

      const response = await supabase.functions.invoke('manage-instance-users', {
        body: {
          action: 'create',
          instanceId,
          username,
          password,
          role,
          ...(role === 'hall' && hallId ? { hallId } : {}),
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      return response.data;
    } finally {
      setIsPending(false);
    }
  };

  return { createUser, isPending };
};
