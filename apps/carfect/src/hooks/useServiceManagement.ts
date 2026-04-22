import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ServiceItem } from '@/types/reservation';
import { useReservationCacheUpdate } from './useReservationCacheUpdate';

interface ServiceWithPricing {
  id: string;
  name: string;
  short_name?: string | null;
  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;
  price_from?: number | null;
}

export interface ServiceData {
  id?: string;
  name: string;
  shortcut?: string | null;
  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;
  price_from?: number | null;
}

interface UseServiceManagementOptions {
  reservationId: string | null;
  currentServiceIds: string[];
  currentServiceItems: ServiceItem[] | null;
  currentServicesData?: ServiceData[];
}

export function useServiceManagement({
  reservationId,
  currentServiceIds,
  currentServiceItems,
  currentServicesData,
}: UseServiceManagementOptions) {
  const { t } = useTranslation();
  const { invalidateReservations } = useReservationCacheUpdate();
  const [savingService, setSavingService] = useState(false);
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
  const [localServicesData, setLocalServicesData] = useState<ServiceData[]>(currentServicesData || []);
  const [localServiceIds, setLocalServiceIds] = useState<string[]>(currentServiceIds);
  const [localServiceItems, setLocalServiceItems] = useState<ServiceItem[] | null>(currentServiceItems);

  // Refs to avoid stale closures in rapid mutations
  const servicesDataRef = useRef(localServicesData);
  servicesDataRef.current = localServicesData;
  const serviceIdsRef = useRef(localServiceIds);
  serviceIdsRef.current = localServiceIds;
  const serviceItemsRef = useRef(localServiceItems);
  serviceItemsRef.current = localServiceItems;

  // Sync from reservation prop
  const servicesDataKey = JSON.stringify(currentServicesData?.map((s) => s.id));
  const serviceIdsKey = currentServiceIds.join(',');
  useEffect(() => {
    setLocalServicesData(currentServicesData || []);
    setLocalServiceIds(currentServiceIds);
    setLocalServiceItems(currentServiceItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stabilized via servicesDataKey + serviceIdsKey
  }, [servicesDataKey, serviceIdsKey]);

  const handleAddServices = useCallback(
    async (newServiceIds: string[], servicesData: ServiceWithPricing[]) => {
      if (!reservationId) return;
      setSavingService(true);

      // Read from refs to get latest state (avoids stale closure)
      const currentIds = serviceIdsRef.current;
      const currentItems = serviceItemsRef.current;
      const currentData = servicesDataRef.current;

      const mergedIds = [...new Set([...currentIds, ...newServiceIds])];

      const existingItems = currentItems || [];
      const existingServiceIds = new Set(existingItems.map((item) => item.service_id));

      const newItems: ServiceItem[] = newServiceIds
        .filter((id) => !existingServiceIds.has(id))
        .map((id) => {
          const svc = servicesData.find((s) => s.id === id);
          return {
            service_id: id,
            id: id,
            name: svc?.name || t('reservations.service'),
            short_name: svc?.short_name || null,
            custom_price: null,
            price_small: svc?.price_small ?? null,
            price_medium: svc?.price_medium ?? null,
            price_large: svc?.price_large ?? null,
            price_from: svc?.price_from ?? null,
          };
        });

      const mergedItems = [...existingItems, ...newItems];

      const newServicesData: ServiceData[] = newServiceIds
        .filter((id) => !currentData.some((s) => s.id === id))
        .map((id) => {
          const svc = servicesData.find((s) => s.id === id);
          return {
            id,
            name: svc?.name || t('reservations.service'),
            shortcut: svc?.short_name || null,
            price_small: svc?.price_small ?? null,
            price_medium: svc?.price_medium ?? null,
            price_large: svc?.price_large ?? null,
            price_from: svc?.price_from ?? null,
          };
        });

      // Snapshot for rollback
      const prevServicesData = currentData;
      const prevServiceIds = currentIds;
      const prevServiceItems = currentItems;

      // Optimistic update (local state only — drawer updates instantly)
      const updatedData = [...currentData, ...newServicesData];
      setLocalServicesData(updatedData);
      setLocalServiceIds(mergedIds);
      setLocalServiceItems(mergedItems);

      try {
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
        invalidateReservations();
      } catch (error: unknown) {
        console.error('Error adding services:', error);
        toast.error(t('common.error'));
        // Rollback
        setLocalServicesData(prevServicesData);
        setLocalServiceIds(prevServiceIds);
        setLocalServiceItems(prevServiceItems);
      } finally {
        setSavingService(false);
      }
    },
    [reservationId, invalidateReservations, t],
  );

  const handleRemoveService = useCallback(
    async (serviceId: string) => {
      if (!reservationId) return;
      setSavingService(true);

      // Read from refs to get latest state (avoids stale closure)
      const currentIds = serviceIdsRef.current;
      const currentItems = serviceItemsRef.current;
      const currentData = servicesDataRef.current;

      const updatedIds = currentIds.filter((id) => id !== serviceId);
      const updatedItems = (currentItems || []).filter(
        (item) => item.service_id !== serviceId,
      );
      const updatedServicesData = currentData.filter((s) => s.id !== serviceId);

      // Snapshot for rollback
      const prevServicesData = currentData;
      const prevServiceIds = currentIds;
      const prevServiceItems = currentItems;

      // Optimistic update (local state only — drawer updates instantly)
      setLocalServicesData(updatedServicesData);
      setLocalServiceIds(updatedIds);
      setLocalServiceItems(updatedItems.length > 0 ? updatedItems : null);

      try {
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
        invalidateReservations();
      } catch (error: unknown) {
        console.error('Error removing service:', error);
        toast.error(t('common.error'));
        // Rollback
        setLocalServicesData(prevServicesData);
        setLocalServiceIds(prevServiceIds);
        setLocalServiceItems(prevServiceItems);
      } finally {
        setSavingService(false);
      }
    },
    [reservationId, invalidateReservations, t],
  );

  const handleConfirmServices = useCallback(
    (serviceIds: string[], _duration: number, servicesData: ServiceWithPricing[]) => {
      const newIds = serviceIds.filter((id) => !serviceIdsRef.current.includes(id));
      if (newIds.length > 0) {
        handleAddServices(newIds, servicesData);
      }
      setServiceDrawerOpen(false);
    },
    [handleAddServices],
  );

  return {
    savingService,
    serviceDrawerOpen,
    setServiceDrawerOpen,
    handleAddServices,
    handleRemoveService,
    handleConfirmServices,
    localServicesData,
    localServiceItems,
  };
}
