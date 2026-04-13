import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ServiceItem } from '@/types/reservation';

interface ServiceWithPricing {
  id: string;
  name: string;
  short_name?: string | null;
  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;
  price_from?: number | null;
}

interface UseServiceManagementOptions {
  reservationId: string | null;
  currentServiceIds: string[];
  currentServiceItems: ServiceItem[] | null;
}

export function useServiceManagement({
  reservationId,
  currentServiceIds,
  currentServiceItems,
}: UseServiceManagementOptions) {
  const { t } = useTranslation();
  const [savingService, setSavingService] = useState(false);
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);

  const handleAddServices = useCallback(
    async (newServiceIds: string[], servicesData: ServiceWithPricing[]) => {
      if (!reservationId) return;
      setSavingService(true);

      try {
        const mergedIds = [...new Set([...currentServiceIds, ...newServiceIds])];

        const existingItems = currentServiceItems || [];
        const existingServiceIds = new Set(existingItems.map((item) => item.service_id));

        const newItems: ServiceItem[] = newServiceIds
          .filter((id) => !existingServiceIds.has(id))
          .map((id) => {
            const svc = servicesData.find((s) => s.id === id);
            return {
              service_id: id,
              id: id,
              name: svc?.name || 'Usługa',
              short_name: svc?.short_name || null,
              custom_price: null,
              price_small: svc?.price_small ?? null,
              price_medium: svc?.price_medium ?? null,
              price_large: svc?.price_large ?? null,
              price_from: svc?.price_from ?? null,
            };
          });

        const mergedItems = [...existingItems, ...newItems];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase
          .from('reservations')
          .update({
            service_ids: mergedIds,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            service_items: mergedItems as any,
          })
          .eq('id', reservationId);

        if (error) throw error;
        toast.success(t('common.saved'));
      } catch (error: unknown) {
        console.error('Error adding services:', error);
        toast.error(t('common.error'));
      } finally {
        setSavingService(false);
      }
    },
    [reservationId, currentServiceIds, currentServiceItems, t],
  );

  const handleRemoveService = useCallback(
    async (serviceId: string) => {
      if (!reservationId) return;
      setSavingService(true);

      try {
        const updatedIds = currentServiceIds.filter((id) => id !== serviceId);
        const updatedItems = (currentServiceItems || []).filter(
          (item) => item.service_id !== serviceId,
        );

        const { error } = await supabase
          .from('reservations')
          .update({
            service_ids: updatedIds,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            service_items: (updatedItems.length > 0 ? updatedItems : null) as any,
          })
          .eq('id', reservationId);

        if (error) throw error;
        toast.success(t('common.saved'));
      } catch (error: unknown) {
        console.error('Error removing service:', error);
        toast.error(t('common.error'));
      } finally {
        setSavingService(false);
      }
    },
    [reservationId, currentServiceIds, currentServiceItems, t],
  );

  const handleConfirmServices = useCallback(
    (serviceIds: string[], _duration: number, servicesData: ServiceWithPricing[]) => {
      const newIds = serviceIds.filter((id) => !currentServiceIds.includes(id));
      if (newIds.length > 0) {
        handleAddServices(newIds, servicesData);
      }
      setServiceDrawerOpen(false);
    },
    [currentServiceIds, handleAddServices],
  );

  return {
    savingService,
    serviceDrawerOpen,
    setServiceDrawerOpen,
    handleAddServices,
    handleRemoveService,
    handleConfirmServices,
  };
}
