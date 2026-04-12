import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CheckCircle } from 'lucide-react';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushNotifications';
import { POLISH_MONTH_NAMES_GENITIVE } from '@/lib/polishDateUtils';
import { normalizePhone as normalizePhoneForStorage } from '@shared/utils';
import type { Reservation } from '@/types/reservation';

export interface UseReservationMutationsOptions {
  instanceId: string | null;
  reservations: Reservation[];
  updateReservationsCache: (updater: (prev: Reservation[]) => Reservation[]) => void;
  invalidateReservations: () => void;
  setSelectedReservation: React.Dispatch<React.SetStateAction<Reservation | null>>;
  markAsLocallyUpdated: (reservationId: string, durationMs?: number) => void;
  instanceData: {
    name?: string;
    short_name?: string;
    slug?: string;
    google_maps_url?: string;
  } | null;
  userId: string | null;
}

export function useReservationMutations({
  instanceId,
  reservations,
  updateReservationsCache,
  invalidateReservations,
  setSelectedReservation,
  markAsLocallyUpdated,
  instanceData,
  userId,
}: UseReservationMutationsOptions) {
  const { t } = useTranslation();

  const optimisticMutation = useCallback(
    async (
      reservationId: string,
      optimisticChanges: Partial<Reservation>,
      operation: () => Promise<{ error: unknown }>,
      options?: {
        successMessage?: string;
        errorMessage?: string;
      },
    ): Promise<boolean> => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return false;

      updateReservationsCache((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, ...optimisticChanges } : r)),
      );
      markAsLocallyUpdated(reservationId);

      const { error } = await operation();

      if (error) {
        updateReservationsCache((prev) =>
          prev.map((r) => (r.id === reservationId ? reservation : r)),
        );
        console.error(options?.errorMessage ?? 'Mutation error:', error);
        toast.error(t('errors.generic'));
        return false;
      }

      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      return true;
    },
    [reservations, updateReservationsCache, markAsLocallyUpdated, t],
  );

  const handleDeleteReservation = useCallback(
    async (
      reservationId: string,
      customerData: {
        name: string;
        phone: string;
        email?: string;
        instance_id: string;
      },
    ) => {
      try {
        const { error: customerError } = await supabase.from('customers').upsert(
          {
            instance_id: customerData.instance_id,
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
          },
          {
            onConflict: 'instance_id,phone',
            ignoreDuplicates: false,
          },
        );
        if (customerError) {
          console.error('Error saving customer:', customerError);
        }

        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_by: userId || null,
          })
          .eq('id', reservationId);

        if (updateError) {
          toast.error(t('errors.generic'));
          console.error('Error cancelling reservation:', updateError);
          return;
        }

        if (instanceId) {
          sendPushNotification({
            instanceId,
            title: `🚫 Rezerwacja anulowana`,
            body: `${customerData.name} - anulowana przez admina`,
            url: '/admin',
            tag: `deleted-reservation-${reservationId}`,
          });
        }

        updateReservationsCache((prev) => prev.filter((r) => r.id !== reservationId));
        setSelectedReservation(null);
        toast.success(t('reservations.reservationRejected'));
      } catch (error) {
        console.error('Error in cancel operation:', error);
        toast.error(t('errors.generic'));
      }
    },
    [instanceId, userId, updateReservationsCache, setSelectedReservation, t],
  );

  const handleRejectReservation = useCallback(
    async (reservationId: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation || !instanceId) return;

      updateReservationsCache((prev) => prev.filter((r) => r.id !== reservationId));

      let deleteExecuted = false;

      const executeDelete = async () => {
        if (deleteExecuted) return;
        deleteExecuted = true;

        try {
          await supabase.from('customers').upsert(
            {
              instance_id: instanceId,
              name: reservation.customer_name,
              phone: reservation.customer_phone,
            },
            {
              onConflict: 'instance_id,phone',
              ignoreDuplicates: false,
            },
          );

          const { error } = await supabase
            .from('reservations')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancelled_by: userId || null,
            })
            .eq('id', reservationId);

          if (error) {
            console.error('Error rejecting reservation:', error);
            updateReservationsCache((prev) => [...prev, reservation]);
            toast.error(t('errors.generic'));
          }
        } catch (error) {
          console.error('Error rejecting reservation:', error);
          updateReservationsCache((prev) => [...prev, reservation]);
          toast.error(t('errors.generic'));
        }
      };

      toast(t('reservations.reservationRejected'), {
        action: {
          label: t('common.undo'),
          onClick: () => {
            deleteExecuted = true;
            updateReservationsCache((prev) => [...prev, reservation]);
            toast.success(t('common.success'));
          },
        },
        duration: 5000,
        onDismiss: () => {
          executeDelete();
        },
        onAutoClose: () => {
          executeDelete();
        },
      });
    },
    [instanceId, reservations, userId, updateReservationsCache, t],
  );

  const handleReservationSave = useCallback(
    (reservationId: string, data: Partial<Reservation>) => {
      updateReservationsCache((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                ...data,
              }
            : r,
        ),
      );
      setSelectedReservation(null);
      toast.success(t('reservations.reservationUpdated'));
    },
    [updateReservationsCache, setSelectedReservation, t],
  );

  const handleConfirmReservation = useCallback(
    async (reservationId: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      setSelectedReservation((prev) =>
        prev && prev.id === reservationId ? { ...prev, status: 'confirmed' } : prev,
      );

      const success = await optimisticMutation(
        reservationId,
        { status: 'confirmed' },
        () =>
          supabase
            .from('reservations')
            .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
            .eq('id', reservationId),
        { errorMessage: 'Error confirming reservation:' },
      );

      if (!success) {
        setSelectedReservation((prev) =>
          prev && prev.id === reservationId ? { ...prev, status: reservation.status } : prev,
        );
        return;
      }

      try {
        const dateObj = new Date(reservation.reservation_date);
        const dayNum = dateObj.getDate();
        const monthName = POLISH_MONTH_NAMES_GENITIVE[dateObj.getMonth()];
        const instName = instanceData?.short_name || instanceData?.name || 'Myjnia';
        const manageUrl = `${window.location.origin}/moja-rezerwacja?code=${reservation.confirmation_code}`;
        const message = `${instName}: Rezerwacja potwierdzona! ${dayNum} ${monthName} o ${reservation.start_time?.slice(0, 5)}. Zmien lub anuluj: ${manageUrl}`;
        await supabase.functions.invoke('send-sms-message', {
          body: {
            phone: reservation.customer_phone,
            message,
            instanceId,
          },
        });
        toast.success(t('reservations.reservationConfirmed'));
      } catch (smsError) {
        console.error('Failed to send confirmation SMS:', smsError);
        toast.success(t('reservations.reservationConfirmed'));
      }
    },
    [instanceId, instanceData, reservations, optimisticMutation, setSelectedReservation, t],
  );

  const handleStartWork = useCallback(
    async (reservationId: string) => {
      const started_at = new Date().toISOString();
      const success = await optimisticMutation(
        reservationId,
        { status: 'in_progress', started_at },
        () =>
          supabase
            .from('reservations')
            .update({ status: 'in_progress', started_at })
            .eq('id', reservationId),
        { errorMessage: 'Update error:' },
      );
      if (success) {
        toast.success(t('reservations.workStarted'), {
          icon: React.createElement(CheckCircle, { className: 'h-5 w-5 text-green-500' }),
        });
      }
    },
    [optimisticMutation, t],
  );

  const handleEndWork = useCallback(
    async (reservationId: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      const now = new Date();
      const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const updateData: Record<string, string> = {
        status: 'completed',
        completed_at: now.toISOString(),
      };

      if (nowTime < reservation.end_time) {
        updateData.end_time = nowTime;
      }

      const { error: updateError } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId);

      if (updateError) {
        toast.error(t('errors.generic'));
        console.error('Update error:', updateError);
        return;
      }

      updateReservationsCache((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                status: 'completed',
                ...(updateData.end_time ? { end_time: updateData.end_time } : {}),
              }
            : r,
        ),
      );

      toast.success(t('reservations.workEnded'), {
        icon: React.createElement(CheckCircle, { className: 'h-5 w-5 text-green-500' }),
      });
    },
    [reservations, updateReservationsCache, t],
  );

  const handleReleaseVehicle = useCallback(
    async (reservationId: string) => {
      const released_at = new Date().toISOString();
      const success = await optimisticMutation(
        reservationId,
        { status: 'released', released_at },
        () =>
          supabase
            .from('reservations')
            .update({ status: 'released', released_at })
            .eq('id', reservationId),
        { errorMessage: 'Update error:' },
      );
      if (success) {
        toast.success(t('reservations.vehicleReleased'), {
          icon: React.createElement(CheckCircle, { className: 'h-5 w-5 text-green-500' }),
        });
      }
    },
    [optimisticMutation, t],
  );

  const handleSendPickupSms = useCallback(
    async (reservationId: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      const instName = instanceData?.short_name || instanceData?.name || 'Myjnia';

      const now = new Date().toISOString();
      updateReservationsCache((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                pickup_sms_sent_at: now,
              }
            : r,
        ),
      );
      setSelectedReservation((prev) =>
        prev && prev.id === reservationId
          ? {
              ...prev,
              pickup_sms_sent_at: now,
            }
          : prev,
      );

      try {
        await supabase.functions.invoke('send-sms-message', {
          body: {
            phone: reservation.customer_phone,
            message: `${instName}: Twoj samochod jest gotowy do odbioru. Zapraszamy!`,
            instanceId,
          },
        });

        await supabase
          .from('reservations')
          .update({ pickup_sms_sent_at: now })
          .eq('id', reservationId);

        toast.success(t('reservations.pickupSmsSent', { customerName: reservation.customer_name }));
      } catch (error) {
        console.error('SMS error:', error);
        updateReservationsCache((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? {
                  ...r,
                  pickup_sms_sent_at: reservation.pickup_sms_sent_at,
                }
              : r,
          ),
        );
        setSelectedReservation((prev) =>
          prev && prev.id === reservationId
            ? {
                ...prev,
                pickup_sms_sent_at: reservation.pickup_sms_sent_at,
              }
            : prev,
        );
        toast.error(t('errors.generic'));
      }
    },
    [instanceId, instanceData, reservations, updateReservationsCache, setSelectedReservation, t],
  );

  const handleSendConfirmationSms = useCallback(
    async (reservationId: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation || !reservation.customer_phone) return;

      const now = new Date().toISOString();
      updateReservationsCache((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                confirmation_sms_sent_at: now,
              }
            : r,
        ),
      );
      setSelectedReservation((prev) =>
        prev && prev.id === reservationId
          ? {
              ...prev,
              confirmation_sms_sent_at: now,
            }
          : prev,
      );

      try {
        const { data: instData } = await supabase
          .from('instances')
          .select('name, short_name, google_maps_url, slug')
          .eq('id', instanceId)
          .single();

        if (!instData) return;

        const { data: smsEditLinkFeature } = await supabase
          .from('instance_features')
          .select('enabled, parameters')
          .eq('instance_id', instanceId)
          .eq('feature_key', 'sms_edit_link')
          .maybeSingle();

        let includeEditLink = false;
        if (smsEditLinkFeature?.enabled) {
          const params = smsEditLinkFeature.parameters as { phones?: string[] } | null;
          if (!params || !params.phones || params.phones.length === 0) {
            includeEditLink = true;
          } else {
            const normalizedPhone = normalizePhoneForStorage(reservation.customer_phone) || '';
            includeEditLink = params.phones.some((p) => {
              const normalizedAllowed = normalizePhoneForStorage(p) || '';
              return normalizedPhone === normalizedAllowed;
            });
          }
        }

        const dateObj = new Date(reservation.reservation_date);
        const dayNum = dateObj.getDate();
        const monthNameFull = POLISH_MONTH_NAMES_GENITIVE[dateObj.getMonth()];

        const instName = instData.short_name || instData.name || 'Myjnia';
        const mapsLink = instData.google_maps_url ? ` Dojazd: ${instData.google_maps_url}` : '';
        const reservationUrl = `https://${instData.slug}.carfect.pl/res?code=${reservation.confirmation_code}`;
        const editLink = includeEditLink ? ` Zmien lub anuluj: ${reservationUrl}` : '';

        const smsMessage = `${instName}: Rezerwacja potwierdzona! ${dayNum} ${monthNameFull} o ${reservation.start_time.slice(0, 5)}.${mapsLink}${editLink}`;

        await supabase.functions.invoke('send-sms-message', {
          body: {
            phone: reservation.customer_phone,
            message: smsMessage,
            instanceId,
          },
        });

        await supabase
          .from('reservations')
          .update({ confirmation_sms_sent_at: now })
          .eq('id', reservationId);

        toast.success(
          t('reservations.confirmationSmsSent', { customerName: reservation.customer_name }),
        );
      } catch (error) {
        console.error('SMS error:', error);
        updateReservationsCache((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? {
                  ...r,
                  confirmation_sms_sent_at: reservation.confirmation_sms_sent_at,
                }
              : r,
          ),
        );
        setSelectedReservation((prev) =>
          prev && prev.id === reservationId
            ? {
                ...prev,
                confirmation_sms_sent_at: reservation.confirmation_sms_sent_at,
              }
            : prev,
        );
        toast.error(t('errors.generic'));
      }
    },
    [instanceId, reservations, updateReservationsCache, setSelectedReservation, t],
  );

  const handleRevertToConfirmed = useCallback(
    async (reservationId: string) => {
      const success = await optimisticMutation(
        reservationId,
        { status: 'confirmed', started_at: null, completed_at: null },
        () =>
          supabase
            .from('reservations')
            .update({ status: 'confirmed', started_at: null, completed_at: null })
            .eq('id', reservationId),
        { errorMessage: 'Update error:' },
      );
      if (success) {
        toast.success(t('reservations.revertedToConfirmed'), {
          icon: React.createElement(CheckCircle, { className: 'h-5 w-5 text-green-500' }),
        });
      }
    },
    [optimisticMutation, t],
  );

  const handleRevertToInProgress = useCallback(
    async (reservationId: string) => {
      const success = await optimisticMutation(
        reservationId,
        { status: 'in_progress', completed_at: null, released_at: null },
        () =>
          supabase
            .from('reservations')
            .update({ status: 'in_progress', completed_at: null, released_at: null })
            .eq('id', reservationId),
        { errorMessage: 'Update error:' },
      );
      if (success) {
        toast.success(t('reservations.revertedToInProgress'), {
          icon: React.createElement(CheckCircle, { className: 'h-5 w-5 text-green-500' }),
        });
      }
    },
    [optimisticMutation, t],
  );

  const handleStatusChange = useCallback(
    async (reservationId: string, newStatus: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      const updateData: Record<string, string | null> = { status: newStatus };

      if (newStatus === 'confirmed') {
        updateData.started_at = null;
        updateData.completed_at = null;
        updateData.released_at = null;
      } else if (newStatus === 'in_progress') {
        updateData.completed_at = null;
        updateData.released_at = null;
      } else if (newStatus === 'completed') {
        updateData.released_at = null;
        updateData.completed_at = new Date().toISOString();
        const now = new Date();
        const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        if (nowTime < reservation.end_time) {
          updateData.end_time = nowTime;
        }
      }

      const optimisticChanges: Partial<Reservation> = {
        status: newStatus,
        ...(updateData.end_time ? { end_time: updateData.end_time } : {}),
      };

      const success = await optimisticMutation(
        reservationId,
        optimisticChanges,
        () =>
          supabase
            .from('reservations')
            .update(updateData)
            .eq('id', reservationId),
        { errorMessage: 'Update error:' },
      );
      if (success) {
        toast.success(t('reservations.statusChanged'));
      }
    },
    [reservations, optimisticMutation, t],
  );

  const handleApproveChangeRequest = useCallback(
    async (changeRequestId: string) => {
      const changeRequest = reservations.find((r) => r.id === changeRequestId);
      if (!changeRequest || !instanceId) return;

      const originalId = (changeRequest as Reservation & { original_reservation_id?: string })
        .original_reservation_id;
      if (!originalId) {
        toast.error(t('errors.generic'));
        return;
      }

      const { data: originalReservation, error: fetchError } = await supabase
        .from('reservations')
        .select('confirmation_code')
        .eq('id', originalId)
        .single();

      if (fetchError || !originalReservation) {
        toast.error(t('errors.generic'));
        return;
      }

      const originalCode = originalReservation.confirmation_code;

      const { error: rpcError } = await supabase.rpc('approve_change_request', {
        p_change_request_id: changeRequestId,
        p_original_id: originalId,
      });

      if (rpcError) {
        console.error('Error approving change request:', rpcError);
        toast.error(t('errors.generic'));
        return;
      }

      try {
        const dateFormatted = format(new Date(changeRequest.reservation_date), 'd MMMM', {
          locale: pl,
        });
        const timeFormatted = changeRequest.start_time.slice(0, 5);
        const manageUrl = `https://${instanceData?.slug || 'demo'}.carfect.pl/res?code=${originalCode}`;

        const instanceName = instanceData?.short_name || instanceData?.name || 'Myjnia';
        const smsMessage = `${instanceName}: Potwierdzamy nowy termin: ${dateFormatted} o ${timeFormatted}. Zmien lub anuluj: ${manageUrl}`;

        await supabase.functions.invoke('send-sms-message', {
          body: {
            phone: changeRequest.customer_phone,
            message: smsMessage,
            instanceId,
          },
        });
      } catch (smsError) {
        console.error('SMS error:', smsError);
      }

      updateReservationsCache((prev) =>
        prev
          .filter((r) => r.id !== originalId)
          .map((r) =>
            r.id === changeRequestId
              ? ({
                  ...r,
                  confirmation_code: originalCode,
                  status: 'confirmed',
                  original_reservation_id: null,
                } as Reservation & { original_reservation_id: null })
              : r,
          ),
      );

      toast.success(t('myReservation.changeApproved'), {
        icon: React.createElement(CheckCircle, { className: 'h-5 w-5 text-green-500' }),
      });
    },
    [instanceId, instanceData, reservations, updateReservationsCache, t],
  );

  const handleRejectChangeRequest = useCallback(
    async (changeRequestId: string) => {
      const changeRequest = reservations.find((r) => r.id === changeRequestId);
      if (!changeRequest || !instanceId) return;

      const originalId = (changeRequest as Reservation & { original_reservation_id?: string })
        .original_reservation_id;

      let originalReservation: {
        reservation_date: string;
        start_time: string;
        confirmation_code: string;
      } | null = null;
      if (originalId) {
        const { data } = await supabase
          .from('reservations')
          .select('reservation_date, start_time, confirmation_code')
          .eq('id', originalId)
          .single();
        originalReservation = data;
      }

      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', changeRequestId);

      if (deleteError) {
        toast.error(t('errors.generic'));
        return;
      }

      if (originalReservation) {
        try {
          const dateFormatted = format(new Date(originalReservation.reservation_date), 'd MMMM', {
            locale: pl,
          });
          const timeFormatted = originalReservation.start_time.slice(0, 5);
          const manageUrl = `https://${instanceData?.slug || 'demo'}.carfect.pl/res?code=${originalReservation.confirmation_code}`;

          const instanceName = instanceData?.short_name || instanceData?.name || 'Myjnia';
          const smsMessage = `${instanceName}: Niestety nie mozemy zmienic terminu rezerwacji: ${dateFormatted} o ${timeFormatted}. Wybierz inny lub anuluj: ${manageUrl}`;

          await supabase.functions.invoke('send-sms-message', {
            body: {
              phone: changeRequest.customer_phone,
              message: smsMessage,
              instanceId,
            },
          });
        } catch (smsError) {
          console.error('SMS error:', smsError);
        }
      }

      updateReservationsCache((prev) => prev.filter((r) => r.id !== changeRequestId));

      toast.success(t('myReservation.changeRejected'));
    },
    [instanceId, instanceData, reservations, updateReservationsCache, t],
  );

  const handleNoShow = useCallback(
    async (reservationId: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation || !instanceId) return;

      await supabase.from('customers').upsert(
        {
          instance_id: instanceId,
          name: reservation.customer_name,
          phone: reservation.customer_phone,
        },
        {
          onConflict: 'instance_id,phone',
          ignoreDuplicates: false,
        },
      );

      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'no_show',
          no_show_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (error) {
        toast.error(t('errors.generic'));
        console.error('Error marking no-show:', error);
        return;
      }

      updateReservationsCache((prev) => prev.filter((r) => r.id !== reservationId));
      setSelectedReservation(null);
      toast.success(t('reservations.noShowMarked'));
    },
    [instanceId, reservations, updateReservationsCache, setSelectedReservation, t],
  );

  const handleReservationMove = useCallback(
    async (
      reservationId: string,
      newStationId: string,
      newDate: string,
      newTime?: string,
    ) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      const originalState = {
        station_id: reservation.station_id,
        reservation_date: reservation.reservation_date,
        start_time: reservation.start_time,
        end_time: reservation.end_time,
      };
      const updates: Record<string, string> = {
        station_id: newStationId,
        reservation_date: newDate,
      };
      if (newTime) {
        const [startHours, startMinutes] = newTime.split(':').map(Number);
        const [endHours, endMinutes] = reservation.end_time.split(':').map(Number);
        const [origStartHours, origStartMinutes] = reservation.start_time.split(':').map(Number);
        const durationMinutes =
          endHours * 60 + endMinutes - (origStartHours * 60 + origStartMinutes);
        const newEndTotalMinutes = startHours * 60 + startMinutes + durationMinutes;
        const newEndHours = Math.floor(newEndTotalMinutes / 60);
        const newEndMins = newEndTotalMinutes % 60;
        updates.start_time = newTime;
        updates.end_time = `${newEndHours.toString().padStart(2, '0')}:${newEndMins.toString().padStart(2, '0')}`;
      }

      markAsLocallyUpdated(reservationId);

      const { error } = await supabase.from('reservations').update(updates).eq('id', reservationId);
      if (error) {
        toast.error(t('errors.generic'));
        console.error('Error moving reservation:', error);
        return;
      }

      updateReservationsCache((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                ...updates,
              }
            : r,
        ),
      );

      const vehicleModel = reservation.vehicle_plate || t('addReservation.defaultVehicle');

      toast.success(t('reservations.reservationMoved'), {
        description: React.createElement(
          'div',
          { className: 'flex flex-col' },
          React.createElement('span', null, `${updates.start_time} - ${updates.end_time}`),
          React.createElement('span', null, vehicleModel),
        ),
        icon: React.createElement(CheckCircle, { className: 'h-5 w-5 text-green-500' }),
        duration: 5000,
        action: {
          label: t('common.undo'),
          onClick: async () => {
            const { error: undoError } = await supabase
              .from('reservations')
              .update(originalState)
              .eq('id', reservationId);
            if (undoError) {
              toast.error(t('errors.generic'));
              console.error('Error undoing move:', undoError);
              return;
            }

            updateReservationsCache((prev) =>
              prev.map((r) =>
                r.id === reservationId
                  ? {
                      ...r,
                      ...originalState,
                    }
                  : r,
              ),
            );
            toast.success(t('common.success'));
          },
        },
      });
    },
    [reservations, updateReservationsCache, markAsLocallyUpdated, t],
  );

  return {
    handleDeleteReservation,
    handleRejectReservation,
    handleReservationSave,
    handleConfirmReservation,
    handleStartWork,
    handleEndWork,
    handleReleaseVehicle,
    handleSendPickupSms,
    handleSendConfirmationSms,
    handleRevertToConfirmed,
    handleRevertToInProgress,
    handleStatusChange,
    handleApproveChangeRequest,
    handleRejectChangeRequest,
    handleNoShow,
    handleReservationMove,
  };
}
