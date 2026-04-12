import { useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone } from '@shared/utils';
import { sendPushNotification, formatDateForPush } from '@/lib/pushNotifications';
import { calculatePricePair } from '@/utils/pricing';
import { carSizeToCode } from '@/lib/reservationPricing';
import type {
  CarSize,
  DialogMode,
  EditingReservation,
  YardVehicle,
  ReservationSlot,
} from '../components/admin/reservation-form';
import type { ServiceWithCategory } from '../components/admin/ServiceSelectionDrawer';

export interface ValidationErrors {
  phone?: string;
  carModel?: string;
  services?: string;
  time?: string;
  station?: string;
  dateRange?: string;
}

export interface ServiceItem {
  service_id: string;
  custom_price: number | null;
  name?: string;
  short_name?: string | null;
  custom_price_netto?: number | null;
}

export interface ReservationFormData {
  customerName: string;
  phone: string;
  carModel: string;
  carSize: CarSize;
  selectedServices: string[];
  serviceItems: ServiceItem[];
  servicesWithCategory: ServiceWithCategory[];
  adminNotes: string;
  finalPrice: string;
  totalPrice: number;
  offerNumber: string;
  assignedEmployeeIds: string[];
  isCustomCarModel: boolean;
  selectedCustomerId: string | null;
  // Slot data
  slots: ReservationSlot[];
  // Yard data
  arrivalDate: Date;
  pickupDate: Date | null;
  deadlineTime: string;
  // Callback for car model proposal (only for reservation create mode)
  saveCarModelProposal?: (carModel: string, carSize: CarSize) => Promise<void>;
}

interface UseReservationSubmitOptions {
  instanceId: string;
  mode: DialogMode;
  editingReservation?: EditingReservation | null;
  editingYardVehicle?: YardVehicle | null;
  initialStationId?: string;
  currentUsername?: string | null;
  pricingMode: 'netto' | 'brutto';
  onSuccess: (reservationId?: string) => void;
  onClose: () => void;
  onSlotPreviewChange?: (
    preview: {
      date: string;
      startTime: string;
      endTime: string;
      stationId: string;
    } | null,
  ) => void;
}

interface UseReservationSubmitReturn {
  loading: boolean;
  validationErrors: ValidationErrors;
  setValidationErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;

  // Refs for scroll-to-error
  phoneInputRef: React.RefObject<HTMLDivElement>;
  carModelRef: React.RefObject<HTMLDivElement>;
  servicesRef: React.RefObject<HTMLDivElement>;
  timeRef: React.RefObject<HTMLDivElement>;
  dateRangeRef: React.RefObject<HTMLDivElement>;

  // Main submit function - takes all form data as params
  handleSubmit: (formData: ReservationFormData) => Promise<void>;
}

/**
 * Pure validation function for reservation form data.
 * Extracted for testability.
 */
export function validateReservationForm(
  formData: Pick<
    ReservationFormData,
    'phone' | 'carModel' | 'selectedServices' | 'slots'
  >,
  options: {
    isYardMode: boolean;
    isEditMode: boolean;
    initialStationId?: string;
  },
  t: (key: string) => string,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!formData.phone.trim()) {
    errors.phone = t('validation.phoneRequired');
  }
  if (!formData.carModel.trim()) {
    errors.carModel = t('validation.carModelRequired');
  }
  if (formData.selectedServices.length === 0) {
    errors.services = t('validation.servicesRequired');
  }

  if (!options.isYardMode) {
    // Reservation mode: validate slots
    for (const slot of formData.slots) {
      if (!slot.dateRange?.from) {
        errors.dateRange = t('validation.dateRequired');
        break;
      }
      if (!slot.startTime || !slot.endTime) {
        errors.time = t('validation.timeRequired');
        break;
      }
      if (!slot.stationId && (options.isEditMode || !options.initialStationId)) {
        errors.station = t('validation.stationRequired');
        break;
      }
    }
  }

  return errors;
}

export function useReservationSubmit(
  options: UseReservationSubmitOptions,
): UseReservationSubmitReturn {
  const {
    instanceId,
    mode,
    editingReservation,
    editingYardVehicle,
    initialStationId,
    currentUsername,
    pricingMode,
    onSuccess,
    onClose,
    onSlotPreviewChange,
  } = options;

  const { t } = useTranslation();
  const isYardMode = mode === 'yard';
  const isEditMode = isYardMode ? !!editingYardVehicle : !!editingReservation?.id;

  const upsertCustomerVehicle = useCallback(
    async (params: {
      carModel: string;
      phone: string;
      carSize: CarSize;
      customerId: string | null;
    }) => {
      if (!params.carModel || !params.carModel.trim() || params.carModel.trim() === 'BRAK' || !params.phone) return;
      await supabase.rpc('upsert_customer_vehicle', {
        _instance_id: instanceId,
        _phone: normalizePhone(params.phone),
        _model: params.carModel.trim(),
        _plate: null,
        _customer_id: params.customerId || null,
        _car_size: carSizeToCode(params.carSize),
      });
    },
    [instanceId],
  );

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Refs for scroll-to-error
  const phoneInputRef = useRef<HTMLDivElement>(null);
  const carModelRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  const scrollToFirstError = useCallback(
    (errors: ValidationErrors) => {
      if (errors.phone && phoneInputRef.current) {
        phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = phoneInputRef.current.querySelector('input');
        if (input) input.focus();
      } else if (errors.carModel && carModelRef.current) {
        carModelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = carModelRef.current.querySelector('input');
        if (input) input.focus();
      } else if (errors.services && servicesRef.current) {
        servicesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.dateRange && dateRangeRef.current) {
        dateRangeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.time && timeRef.current) {
        timeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (formData: ReservationFormData) => {
      const {
        customerName,
        phone,
        carModel,
        carSize,
        selectedServices,
        serviceItems,
        servicesWithCategory,
        adminNotes,
        finalPrice,
        totalPrice,
        offerNumber,
        assignedEmployeeIds,
        isCustomCarModel,
        selectedCustomerId,
        slots,
        arrivalDate,
        pickupDate,
        deadlineTime,
        saveCarModelProposal,
      } = formData;

      // Derived values from first slot (for single-slot usage)
      const manualStartTime = slots[0]?.startTime || '';
      const manualEndTime = slots[0]?.endTime || '';
      const manualStationId = slots[0]?.stationId || null;
      const dateRange = slots[0]?.dateRange;

      // Clear slot preview immediately as first action
      onSlotPreviewChange?.(null);

      // Validate form
      const errors = validateReservationForm(
        { phone, carModel, selectedServices, slots },
        { isYardMode, isEditMode, initialStationId },
        t,
      );

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        scrollToFirstError(errors);
        return;
      }
      setValidationErrors({});

      setLoading(true);
      try {
        if (isYardMode) {
          // Yard mode submit
          const vehicleData = {
            instance_id: instanceId,
            customer_name: customerName.trim() || 'Klient',
            customer_phone: normalizePhone(phone.trim()) || '',
            vehicle_plate: carModel.trim(),
            car_size: carSize || null,
            service_ids: selectedServices,
            arrival_date: format(arrivalDate, 'yyyy-MM-dd'),
            pickup_date: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : null,
            deadline_time: deadlineTime || null,
            notes: adminNotes.trim() || null,
          };

          if (editingYardVehicle) {
            const { error } = await supabase
              .from('yard_vehicles')
              .update(vehicleData)
              .eq('id', editingYardVehicle.id);

            if (error) throw error;
            toast.success(t('addReservation.yardVehicleUpdated'));
          } else {
            const { error } = await supabase.from('yard_vehicles').insert({
              ...vehicleData,
              status: 'waiting',
            });

            if (error) throw error;
            toast.success(t('addReservation.yardVehicleAdded'));
          }

          onSuccess();
          onClose();
          return;
        }

        // Reservation mode submit
        // Create customer if needed
        let customerId = selectedCustomerId;

        if (customerName && !customerId && phone) {
          const normalizedPhone = normalizePhone(phone);
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id, name')
            .eq('instance_id', instanceId)
            .eq('phone', normalizedPhone)
            .limit(1)
            .maybeSingle();

          if (existingCustomer) {
            customerId = existingCustomer.id;
            // Update name if changed
            if (customerName.trim() !== existingCustomer.name) {
              const normalizedName = customerName.trim();
              await supabase
                .from('customers')
                .update({ name: normalizedName })
                .eq('id', existingCustomer.id);
              await supabase
                .from('reservations')
                .update({ customer_name: normalizedName })
                .eq('instance_id', instanceId)
                .eq('customer_phone', normalizedPhone);
            }
          } else {
            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert({
                instance_id: instanceId,
                phone: normalizePhone(phone),
                name: customerName,
              })
              .select('id')
              .single();

            if (!customerError && newCustomer) {
              customerId = newCustomer.id;
            }
          }
        }

        // Enrich service_items with names and netto prices before saving
        const enrichedServiceItems = serviceItems.map((si) => {
          const svc = servicesWithCategory.find((s) => s.id === si.service_id);
          const enriched = {
            ...si,
            name: si.name || svc?.name,
            short_name: si.short_name || svc?.short_name,
          };
          if (enriched.custom_price !== null && enriched.custom_price !== undefined) {
            return {
              ...enriched,
              custom_price_netto: calculatePricePair(enriched.custom_price, pricingMode).netto,
            };
          }
          return enriched;
        });

        // Calculate brutto and netto totals
        const userPrice = finalPrice ? parseFloat(finalPrice) : totalPrice;
        const { netto: priceNetto, brutto: priceBrutto } = calculatePricePair(userPrice, pricingMode);

        if (isEditMode && editingReservation) {
          // Update existing reservation
          const updateData = {
            station_id: manualStationId,
            reservation_date: format(dateRange!.from!, 'yyyy-MM-dd'),
            end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
            start_time: manualStartTime,
            end_time: manualEndTime,
            customer_name: customerName.trim() || phone || 'Klient',
            customer_phone: normalizePhone(phone) || '',
            vehicle_plate: carModel || '',
            car_size: carSize || null,
            admin_notes: adminNotes.trim() || null,
            price: priceBrutto,
            price_netto: priceNetto,
            service_id: editingReservation.has_unified_services ? null : selectedServices[0],
            service_ids: selectedServices,
            service_items:
              enrichedServiceItems.length > 0
                ? JSON.parse(JSON.stringify(enrichedServiceItems))
                : null,
            offer_number: offerNumber || null,
            assigned_employee_ids: assignedEmployeeIds.length > 0 ? assignedEmployeeIds : null,
          };

          const { error: updateError } = await supabase
            .from('reservations')
            .update(updateData)
            .eq('id', editingReservation.id);

          if (updateError) throw updateError;

          // Upsert customer vehicle
          await upsertCustomerVehicle({ carModel, phone, carSize, customerId: customerId || null });

          // Send push notification for edit
          sendPushNotification({
            instanceId,
            title: `✏️ Rezerwacja zmieniona`,
            body: `${customerName.trim() || phone || 'Klient'} - ${formatDateForPush(dateRange!.from!)} o ${manualStartTime}`,
            url: `/admin?reservationCode=${editingReservation.confirmation_code || ''}`,
            tag: `edited-reservation-${editingReservation.id}`,
          });

          toast.success(t('addReservation.reservationUpdated'));
        } else {
          // Create new reservation(s) - one per slot
          const {
            data: { user },
          } = await supabase.auth.getUser();

          const baseData = {
            instance_id: instanceId,
            customer_name: customerName.trim() || phone || 'Klient',
            customer_phone: normalizePhone(phone) || '',
            vehicle_plate: carModel || '',
            car_size: carSize || null,
            admin_notes: adminNotes.trim() || null,
            price: priceBrutto,
            price_netto: priceNetto,
            service_id: null,
            service_ids: selectedServices,
            service_items:
              enrichedServiceItems.length > 0
                ? JSON.parse(JSON.stringify(enrichedServiceItems))
                : null,
            offer_number: offerNumber || null,
            status: 'confirmed' as const,
            confirmed_at: new Date().toISOString(),
            created_by: user?.id || null,
            created_by_username: currentUsername || null,
            has_unified_services: true,
            assigned_employee_ids: assignedEmployeeIds.length > 0 ? assignedEmployeeIds : null,
          };

          const reservationsToInsert = slots.map((slot) => ({
            ...baseData,
            station_id: slot.stationId || initialStationId || null,
            reservation_date: format(slot.dateRange!.from!, 'yyyy-MM-dd'),
            end_date: slot.dateRange?.to ? format(slot.dateRange.to, 'yyyy-MM-dd') : null,
            start_time: slot.startTime,
            end_time: slot.endTime,
            confirmation_code: Array.from({ length: 7 }, () =>
              Math.floor(Math.random() * 10),
            ).join(''),
          }));

          const { error: reservationError } = await supabase
            .from('reservations')
            .insert(reservationsToInsert);

          if (reservationError) throw reservationError;

          // Send push notification for new reservation by admin
          const firstSlot = slots[0];
          sendPushNotification({
            instanceId,
            title: `📅 Nowa rezerwacja (admin)`,
            body: `${customerName.trim() || 'Klient'} - ${formatDateForPush(firstSlot.dateRange!.from!)} o ${firstSlot.startTime}${slots.length > 1 ? ` (${slots.length} slotów)` : ''}`,
            url: `/admin?reservationCode=${reservationsToInsert[0].confirmation_code}`,
            tag: `new-reservation-admin-${Date.now()}`,
          });

          toast.success(
            slots.length > 1
              ? t('addReservation.multipleCreated', { count: slots.length })
              : t('addReservation.reservationCreated'),
          );

          // Upsert customer vehicle (silently in background)
          upsertCustomerVehicle({ carModel, phone, carSize, customerId: customerId || null })
            .then(() => console.log('Customer vehicle upserted on create:', carModel))
            .catch((err: unknown) => console.error('Failed to upsert customer vehicle:', err));

          // Save custom car model as proposal (silently in background)
          if (isCustomCarModel && carModel.trim() && carModel.trim() !== 'BRAK') {
            saveCarModelProposal?.(carModel.trim(), carSize);
          }
        }

        // Pass reservation ID for debounce marking (only in edit mode)
        onSuccess(editingReservation?.id);
        onClose();
      } catch (error) {
        console.error('Error saving reservation:', error);
        if (isYardMode) {
          toast.error(t('addReservation.yardVehicleError'));
        } else {
          toast.error(t('addReservation.reservationError'));
        }
      } finally {
        setLoading(false);
      }
    },
    [
      instanceId,
      isYardMode,
      isEditMode,
      editingReservation,
      editingYardVehicle,
      initialStationId,
      currentUsername,
      pricingMode,
      onSuccess,
      onClose,
      onSlotPreviewChange,
      scrollToFirstError,
      upsertCustomerVehicle,
      t,
    ],
  );

  return {
    loading,
    validationErrors,
    setValidationErrors,
    phoneInputRef,
    carModelRef,
    servicesRef,
    timeRef,
    dateRangeRef,
    handleSubmit,
  };
}
