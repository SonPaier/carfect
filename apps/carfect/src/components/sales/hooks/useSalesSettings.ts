import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SalesCompanyData {
  name: string;
  short_name: string;
  invoice_company_name: string;
  nip: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string;
  website: string;
  contact_person: string;
  social_facebook: string;
  social_instagram: string;
  google_maps_url: string;
  bank_accounts: { name: string; number: string }[];
}

export const useSalesSettings = (instanceId: string | null) => {
  return useQuery({
    queryKey: ['sales_instance_settings', instanceId],
    queryFn: async () => {
      if (!instanceId) return null;
      const { data, error } = await (supabase
        .from('sales_instance_settings')
        .select('*')
        .eq('instance_id', instanceId)
        .maybeSingle() as any);
      if (error) throw error;
      return data;
    },
    enabled: !!instanceId,
    staleTime: 0,
  });
};

export const useSaveSalesSettings = (instanceId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: SalesCompanyData) => {
      if (!instanceId) throw new Error('No instance ID');
      const { error } = await (supabase.from('sales_instance_settings').upsert(
        {
          instance_id: instanceId,
          name: form.name || null,
          short_name: form.short_name || null,
          invoice_company_name: form.invoice_company_name || null,
          nip: form.nip || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
          logo_url: form.logo_url || null,
          website: form.website || null,
          contact_person: form.contact_person || null,
          social_facebook: form.social_facebook || null,
          social_instagram: form.social_instagram || null,
          google_maps_url: form.google_maps_url || null,
          bank_accounts: form.bank_accounts.filter((a) => a.number.trim() !== ''),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'instance_id' },
      ) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_instance_settings', instanceId] });
      toast.success('Dane firmy zapisane');
    },
    onError: (error) => {
      console.error('Error saving sales settings:', error);
      toast.error('Nie udało się zapisać danych firmy');
    },
  });
};
