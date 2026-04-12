import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@shared/ui';
import { useInstanceSettings } from '@/hooks/useInstanceSettings';
import { useEmployees } from '@/hooks/useEmployees';
import {
  Loader2,
  X,
  CalendarIcon,
  ClipboardPaste,
  Users,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { Sheet, SheetContent } from '@shared/ui';
import { Button } from '@shared/ui';
import { Label } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { cn, generateTimeSlots, getWorkingHoursRange } from '@/lib/utils';
import { Separator } from '@shared/ui';
import ServiceSelectionDrawer, { ServiceWithCategory } from './ServiceSelectionDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import SelectedServicesList, { ServiceItem } from './SelectedServicesList';
import { usePricingMode } from '@/hooks/usePricingMode';
import { calculateTotalPrice, calculateTotalDuration, applyDiscount } from '@/lib/reservationPricing';
import { EmployeeSelectionDrawer } from './EmployeeSelectionDrawer';
import { AssignedEmployeesChips } from './AssignedEmployeesChips';
import {
  CustomerSection,
  VehicleSection,
  YardDateTimeSection,
  ReservationDateTimeSection,
  ReservationSlotsSection,
  NotesAndPriceSection,
} from './reservation-form';
import type {
  ReservationSlot,
  CarSize,
  DialogMode,
  Service,
  CustomerVehicle,
  Customer,
  Station,
  WorkingHours,
  EditingReservation,
  YardVehicle,
} from './reservation-form';
export type { YardVehicle };
import { useCustomerSearch } from '@/hooks/useCustomerSearch';
import { useReservationSlots } from '@/hooks/useReservationSlots';
import { useReservationSubmit } from '@/hooks/useReservationSubmit';

interface AddReservationDialogV2Props {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  onSuccess: (reservationId?: string) => void;
  workingHours?: Record<string, WorkingHours | null> | null;
  editingReservation?: EditingReservation | null;
  mode?: DialogMode;
  stationId?: string;
  editingYardVehicle?: YardVehicle | null;
  initialDate?: string;
  initialTime?: string;
  initialStationId?: string;
  onSlotPreviewChange?: (
    preview: {
      date: string;
      startTime: string;
      endTime: string;
      stationId: string;
    } | null,
  ) => void;
  currentUsername?: string | null;
  trainingsEnabled?: boolean;
  onSwitchToTraining?: () => void;
  /** When true, renders as inline div instead of Sheet (for desktop calendar sidebar) */
  inline?: boolean;
}

const AddReservationDialogV2 = ({
  open,
  onClose,
  instanceId,
  onSuccess,
  workingHours = null,
  editingReservation = null,
  mode = 'reservation',
  stationId: propStationId,
  editingYardVehicle = null,
  initialDate,
  initialTime,
  initialStationId,
  onSlotPreviewChange,
  currentUsername = null,
  trainingsEnabled = false,
  onSwitchToTraining,
  inline = false,
}: AddReservationDialogV2Props) => {
  const isYardMode = mode === 'yard';
  const isReservationMode = mode === 'reservation';
  const isEditMode = isYardMode ? !!editingYardVehicle : !!editingReservation?.id;

  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Employee assignment feature
  const { data: instanceSettings } = useInstanceSettings(instanceId);
  const pricingMode = usePricingMode(instanceId);
  const showEmployeeAssignment =
    isReservationMode && (instanceSettings?.assign_employees_to_reservations ?? false);
  const { data: employees = [] } = useEmployees(instanceId);
  const [employeeDrawerOpen, setEmployeeDrawerOpen] = useState(false);
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
  const employeesDirtyRef = useRef(false);
  const employeesSyncedFromBackendForReservationIdRef = useRef<string | null>(null);
  const [isDrawerHidden, setIsDrawerHidden] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [categoryNetMap, setCategoryNetMap] = useState<Map<string, boolean>>(new Map());
  const [stations, setStations] = useState<Station[]>([]);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carSize, setCarSize] = useState<CarSize>('medium');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [servicesWithCategory, setServicesWithCategory] = useState<ServiceWithCategory[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  // Track if user manually modified the finalPrice (dirty check)
  const [userModifiedFinalPrice, setUserModifiedFinalPrice] = useState(false);
  const [isCustomCarModel, setIsCustomCarModel] = useState(false);

  // Customer search hook — manages search state, customer/vehicle selection
  const {
    searchingCustomer,
    foundVehicles,
    foundCustomers,
    showPhoneDropdown,
    setShowPhoneDropdown,
    showCustomerDropdown,
    setShowCustomerDropdown,
    suppressPhoneSearchRef,
    selectedCustomerId,
    setSelectedCustomerId,
    customerDiscountPercent,
    setCustomerDiscountPercent,
    noShowWarning,
    setNoShowWarning,
    customerVehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    fetchNoShowWarning,
    loadCustomerVehicles,
    selectVehicle,
    saveCarModelProposal,
    resetCustomerSearch,
  } = useCustomerSearch({
    instanceId,
    phone,
    isEditMode,
    onVehicleAutoFill: ({ model, carSize: size }) => {
      setCarModel(model);
      setCarSize(size);
    },
  });

  // Services dropdown
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);

  // Protection against Realtime overwriting form during active editing
  const isUserEditingRef = useRef(false);
  const lastEditingReservationIdRef = useRef<string | null>(null);

  // Helper to mark form as being actively edited by user
  const markUserEditing = useCallback(() => {
    isUserEditingRef.current = true;
  }, []);

  // Yard mode state
  const [arrivalDate, setArrivalDate] = useState<Date>(new Date());
  const [arrivalDateOpen, setArrivalDateOpen] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [pickupDateOpen, setPickupDateOpen] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState('');

  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [offerNumber, setOfferNumber] = useState('');

  // Fetch services and stations on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!open || !instanceId) return;

      // Fetch services based on has_unified_services flag:
      // - unified (has_unified_services=true) → only 'both'
      // - legacy (has_unified_services=false) → only 'reservation'
      const serviceTypeFilter =
        editingReservation?.has_unified_services === false ? 'reservation' : 'both';

      const servicesQuery = supabase
        .from('unified_services')
        .select(
          'id, name, short_name, category_id, duration_minutes, duration_small, duration_medium, duration_large, price_from, price_small, price_medium, price_large, station_type, is_popular',
        )
        .eq('instance_id', instanceId)
        .eq('service_type', serviceTypeFilter)
        .eq('active', true);

      // Fetch categories for prices_are_net mapping
      const categoriesQuery = supabase
        .from('unified_categories')
        .select('id, prices_are_net')
        .eq('instance_id', instanceId)
        .eq('active', true);

      const [servicesRes, categoriesRes] = await Promise.all([
        servicesQuery.order('sort_order'),
        categoriesQuery,
      ]);

      if (categoriesRes.data) {
        const netMap = new Map<string, boolean>();
        categoriesRes.data.forEach((cat) => {
          netMap.set(cat.id, cat.prices_are_net || false);
        });
        setCategoryNetMap(netMap);
      }

      if (servicesRes.data) {
        setServices(servicesRes.data);
      }

      // Fetch all active stations (for reservation mode)
      if (isReservationMode) {
        const { data: stationsData } = await supabase
          .from('stations')
          .select('id, name, type')
          .eq('instance_id', instanceId)
          .eq('active', true)
          .order('sort_order');

        if (stationsData) {
          setStations(stationsData);
        }
      }
    };

    fetchData();
  }, [open, instanceId, mode, isReservationMode]);

  // Calculate the next working day based on working hours
  const getNextWorkingDay = useCallback((): Date => {
    if (!workingHours) return new Date();

    const now = new Date();
    let checkDate = startOfDay(now);

    // Check if today is still a valid working day
    const todayName = format(now, 'EEEE').toLowerCase();
    const todayHours = workingHours[todayName];

    if (todayHours?.close && todayHours.close.includes(':')) {
      const [closeH, closeM] = todayHours.close.split(':').map(Number);
      const closeTime = new Date(now);
      closeTime.setHours(closeH, closeM, 0, 0);

      // If current time is before closing, today is valid
      if (isBefore(now, closeTime)) {
        return checkDate;
      }
    }

    // Find next working day
    for (let i = 1; i <= 7; i++) {
      checkDate = addDays(startOfDay(now), i);
      const dayName = format(checkDate, 'EEEE').toLowerCase();
      if (workingHours[dayName]) {
        return checkDate;
      }
    }

    return addDays(startOfDay(now), 1);
  }, [workingHours]);

  // Ref to track if dialog was already open (to distinguish first open vs slot change)
  const wasOpenRef = useRef(false);

  // Reset form when dialog opens or populate from editing data
  useEffect(() => {
    if (open) {
      // PROTECTION: Skip re-initialization if user is actively editing the same reservation
      const currentEditId = editingReservation?.id || null;
      if (isUserEditingRef.current && currentEditId === lastEditingReservationIdRef.current) {
        console.log('[ReservationDialog] Skipping re-init - user is actively editing');
        return;
      }

      // Track which reservation we're editing
      lastEditingReservationIdRef.current = currentEditId;

      // Reset user editing flags for new dialog session
      setUserModifiedEndTime(false);
      setUserModifiedFinalPrice(false);
      setValidationErrors({});

      if (isYardMode && editingYardVehicle) {
        // Yard edit mode
        suppressPhoneSearchRef.current = true;
        setCustomerName(editingYardVehicle.customer_name || '');
        setPhone(editingYardVehicle.customer_phone || '');
        setCarModel(editingYardVehicle.vehicle_plate || '');
        setCarSize(editingYardVehicle.car_size || 'medium');
        setSelectedServices(editingYardVehicle.service_ids || []);
        setArrivalDate(new Date(editingYardVehicle.arrival_date));
        setPickupDate(
          editingYardVehicle.pickup_date ? new Date(editingYardVehicle.pickup_date) : null,
        );
        setDeadlineTime(editingYardVehicle.deadline_time || '');
        setAdminNotes(editingYardVehicle.notes || '');
        resetCustomerSearch();
      } else if (isYardMode) {
        // Yard create mode
        setCustomerName('');
        setPhone('');
        setCarModel('');
        setCarSize('medium');
        setSelectedServices([]);
        setArrivalDate(new Date());
        setPickupDate(null);
        setDeadlineTime('');
        setAdminNotes('');
        resetCustomerSearch();
      } else if (editingReservation) {
        // Reservation edit mode
        suppressPhoneSearchRef.current = true;
        setCustomerName(editingReservation.customer_name || '');
        setPhone(editingReservation.customer_phone || '');
        setCarModel(editingReservation.vehicle_plate || '');
        setCarSize(editingReservation.car_size || 'medium');
        // Use service_ids if not empty, otherwise fallback to service_id
        const serviceIds =
          editingReservation.service_ids && editingReservation.service_ids.length > 0
            ? editingReservation.service_ids
            : editingReservation.service_id
              ? [editingReservation.service_id]
              : [];
        setSelectedServices(serviceIds);

        // Load servicesWithCategory from services list for backwards compatibility
        if (services.length > 0 && serviceIds.length > 0) {
          const loadedServicesWithCategory: ServiceWithCategory[] = [];
          serviceIds.forEach((id) => {
            const service = services.find((s) => s.id === id);
            if (service) {
              loadedServicesWithCategory.push({
                id: service.id,
                name: service.name,
                short_name: service.short_name,
                category_id: service.category_id,
                duration_minutes: service.duration_minutes,
                duration_small: service.duration_small,
                duration_medium: service.duration_medium,
                duration_large: service.duration_large,
                price_from: service.price_from,
                price_small: service.price_small,
                price_medium: service.price_medium,
                price_large: service.price_large,
                category_prices_are_net: service.category_id
                  ? categoryNetMap.get(service.category_id) || false
                  : false,
              });
            }
          });
          setServicesWithCategory(loadedServicesWithCategory);
        }

        // Load serviceItems from reservation's service_items column if available
        const reservationServiceItems = editingReservation.service_items as ServiceItem[] | null;
        if (
          reservationServiceItems &&
          Array.isArray(reservationServiceItems) &&
          reservationServiceItems.length > 0
        ) {
          setServiceItems(reservationServiceItems);
        } else {
          // Initialize serviceItems for legacy reservations without service_items
          setServiceItems(serviceIds.map((id) => ({ service_id: id, custom_price: null })));
        }

        // Date range + time + station - load into single slot
        const startTimeStr = editingReservation.start_time?.substring(0, 5) || '';
        const endTimeStr = editingReservation.end_time?.substring(0, 5) || '';

        if (editingReservation.reservation_date) {
          const fromDate = new Date(editingReservation.reservation_date);
          const toDate = editingReservation.end_date
            ? new Date(editingReservation.end_date)
            : fromDate;
          setSlots([
            {
              id: `edit-${editingReservation.id}`,
              dateRange: { from: fromDate, to: toDate },
              startTime: startTimeStr,
              endTime: endTimeStr,
              stationId: editingReservation.station_id,
            },
          ]);

          // Auto-detect reservation type based on date range
          if (
            editingReservation.end_date &&
            editingReservation.reservation_date !== editingReservation.end_date
          ) {
            setReservationType('multi');
          } else {
            setReservationType('single');
          }
        } else {
          // No date provided (e.g. creating from offer) - leave empty so user must pick
          setSlots([
            {
              id: `edit-${editingReservation.id}`,
              dateRange: undefined,
              startTime: startTimeStr,
              endTime: endTimeStr,
              stationId: editingReservation.station_id,
            },
          ]);
          setReservationType('single');
        }

        setAdminNotes(editingReservation.admin_notes || '');
        // Load price matching the current pricing mode to avoid VAT double-application
        // price = brutto, price_netto = netto. When price_netto is NULL (legacy), derive from brutto.
        const editPrice = pricingMode === 'netto'
          ? editingReservation.price_netto ?? (editingReservation.price ? Math.round(editingReservation.price / 1.23 * 100) / 100 : null)
          : editingReservation.price;
        setFinalPrice(editPrice?.toString() || '');
        // Mark as user-modified if editing reservation with existing price
        setUserModifiedFinalPrice(!!editingReservation.price);
        setOfferNumber(editingReservation.offer_number || '');
        resetCustomerSearch();

        // Calculate and store original duration for automatic end time adjustment
        if (startTimeStr && endTimeStr && startTimeStr.includes(':') && endTimeStr.includes(':')) {
          const [startH, startM] = startTimeStr.split(':').map(Number);
          const [endH, endM] = endTimeStr.split(':').map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          originalDurationMinutesRef.current = endMinutes - startMinutes;
          prevManualStartTimeRef.current = startTimeStr;
        }

        // CRITICAL: Mark end time as user-modified to prevent useEffect from recalculating it
        setUserModifiedEndTime(true);

        // Initialize assigned employees from reservation (optimistic) + allow backend to re-hydrate
        employeesDirtyRef.current = false;
        employeesSyncedFromBackendForReservationIdRef.current = null;
        setAssignedEmployeeIds(editingReservation.assigned_employee_ids || []);
      } else if (initialDate && initialTime && initialStationId && !editingReservation) {
        // Slot click
        if (wasOpenRef.current) {
          // Dialog was already open - only update date/time/station of first slot, keep other data
          const slotDate = new Date(initialDate);
          // Recalculate end time based on current services duration
          const currentDuration = calculateTotalDuration(selectedServices, services, carSize);
          let endTime = '';
          if (currentDuration > 0) {
            const [h, m] = initialTime.split(':').map(Number);
            const endMinutes = h * 60 + m + currentDuration;
            endTime = `${Math.floor(endMinutes / 60)
              .toString()
              .padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
          }
          setSlots((prev) => {
            const newSlots = [...prev];
            newSlots[0] = {
              ...newSlots[0],
              dateRange: { from: slotDate, to: slotDate },
              startTime: initialTime,
              endTime: endTime || newSlots[0].endTime,
              stationId: initialStationId,
            };
            return newSlots;
          });
        } else {
          // First open - full reset with slot values
          setCustomerName('');
          setPhone('');
          setCarModel('');
          setCarSize('medium');
          setSelectedServices([]);
          const slotDate = new Date(initialDate);
          setSlots([
            {
              id: crypto.randomUUID(),
              dateRange: { from: slotDate, to: slotDate },
              startTime: initialTime,
              endTime: '',
              stationId: initialStationId,
            },
          ]);
          setReservationType('single');
          setAdminNotes('');
          setFinalPrice('');
          setOfferNumber('');
          setFoundCustomers([]);
          setSelectedCustomerId(null);
          setCustomerDiscountPercent(null);
          setShowPhoneDropdown(false);
          setShowCustomerDropdown(false);
          setCustomerVehicles([]);
          setSelectedVehicleId(null);
          employeesDirtyRef.current = false;
          employeesSyncedFromBackendForReservationIdRef.current = null;
          setAssignedEmployeeIds([]);
        }
      } else {
        // Reservation create mode (FAB click)
        setCustomerName('');
        setPhone('');
        setCarModel('');
        setCarSize('medium');
        setSelectedServices([]);
        // Default to today with 1-day range
        const today = getNextWorkingDay();
        setSlots([
          {
            id: crypto.randomUUID(),
            dateRange: { from: today, to: today },
            startTime: '',
            endTime: '',
            stationId: null,
          },
        ]);
        setReservationType('single');
        setAdminNotes('');
        setFinalPrice('');
        setOfferNumber('');
        setFoundVehicles([]);
        setFoundCustomers([]);
        setSelectedCustomerId(null);
        setCustomerDiscountPercent(null);
        setShowPhoneDropdown(false);
        setShowCustomerDropdown(false);
        setCustomerVehicles([]);
        setSelectedVehicleId(null);
        employeesDirtyRef.current = false;
        employeesSyncedFromBackendForReservationIdRef.current = null;
        setAssignedEmployeeIds([]);
      }
      // Track that dialog is now open
      wasOpenRef.current = true;
    } else {
      // Dialog closed - reset tracking refs
      wasOpenRef.current = false;
      isUserEditingRef.current = false;
      lastEditingReservationIdRef.current = null;
      originalDurationMinutesRef.current = null;
      prevManualStartTimeRef.current = '';
      setServicesWithCategory([]); // Reset services list for next open
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedServices and carSize intentionally excluded to prevent re-init loop when user edits form
  }, [
    open,
    getNextWorkingDay,
    editingReservation,
    isYardMode,
    editingYardVehicle,
    initialDate,
    initialTime,
    initialStationId,
    services,
  ]);

  // Keep employee assignments in sync with backend when opening edit mode
  useEffect(() => {
    const reservationId = editingReservation?.id;
    if (!open || !reservationId || !showEmployeeAssignment) return;

    // Only once per reservation open - prevents loops
    if (employeesSyncedFromBackendForReservationIdRef.current === reservationId) return;
    employeesSyncedFromBackendForReservationIdRef.current = reservationId;

    (async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('assigned_employee_ids')
        .eq('id', reservationId)
        .maybeSingle();

      if (error) return;
      if (employeesDirtyRef.current) return;

      const raw = (data as { assigned_employee_ids?: unknown })?.assigned_employee_ids;
      const ids = Array.isArray(raw) ? (raw as string[]) : [];
      setAssignedEmployeeIds(ids);
    })();
  }, [open, editingReservation?.id, showEmployeeAssignment]);

  // NEW: Re-map servicesWithCategory when services are loaded (for edit mode)
  useEffect(() => {
    if (!open || services.length === 0) return;

    // Skip if servicesWithCategory is already populated (user already editing)
    if (servicesWithCategory.length > 0) return;

    // Handle reservation edit mode
    if (editingReservation) {
      const serviceIds =
        editingReservation.service_ids && editingReservation.service_ids.length > 0
          ? editingReservation.service_ids
          : editingReservation.service_id
            ? [editingReservation.service_id]
            : [];

      if (serviceIds.length === 0) return;

      const loadedServicesWithCategory: ServiceWithCategory[] = [];
      serviceIds.forEach((id) => {
        const service = services.find((s) => s.id === id);
        if (service) {
          loadedServicesWithCategory.push({
            id: service.id,
            name: service.name,
            short_name: service.short_name,
            category_id: service.category_id,
            duration_minutes: service.duration_minutes,
            duration_small: service.duration_small,
            duration_medium: service.duration_medium,
            duration_large: service.duration_large,
            price_from: service.price_from,
            price_small: service.price_small,
            price_medium: service.price_medium,
            price_large: service.price_large,
            category_prices_are_net: service.category_id
              ? (categoryNetMap.get(service.category_id) ?? false)
              : false,
          });
        }
      });

      if (loadedServicesWithCategory.length > 0) {
        setServicesWithCategory(loadedServicesWithCategory);
        // Also initialize serviceItems from editingReservation if available
        if (editingReservation.service_items && editingReservation.service_items.length > 0) {
          setServiceItems(editingReservation.service_items);
        }
      }
    }
  }, [open, services, editingReservation, servicesWithCategory.length, categoryNetMap]);

  // Calculate total duration from selected services
  const totalDurationMinutes = calculateTotalDuration(selectedServices, services, carSize);

  // Slot management — state, derived values, setters, and time-related effects
  const {
    slots,
    setSlots,
    reservationType,
    setReservationType,
    manualStartTime,
    manualEndTime,
    manualStationId,
    dateRange,
    setManualStartTime,
    setManualEndTime,
    setManualStationId,
    setDateRange,
    userModifiedEndTime,
    setUserModifiedEndTime,
    originalDurationMinutesRef,
    prevManualStartTimeRef,
  } = useReservationSlots({
    open,
    isReservationMode,
    isEditMode,
    totalDurationMinutes,
    onSlotPreviewChange,
  });

  // Calculate total price from selected services
  const totalPrice = calculateTotalPrice(
    selectedServices, services, serviceItems, carSize, pricingMode, servicesWithCategory, categoryNetMap,
  );

  // Calculate discounted price
  const discountedPrice = applyDiscount(totalPrice, customerDiscountPercent);


  // Dynamic time range based on working hours for selected day
  const { min: timeMin, max: timeMax } = getWorkingHoursRange(workingHours, dateRange?.from);
  const startTimeOptions = generateTimeSlots(timeMin, timeMax, 15);
  const endTimeOptions = generateTimeSlots(timeMin, timeMax, 15);

  // Alias for yard deadline (keep 15 min intervals)
  const yardTimeOptions = startTimeOptions;

  // Submit hook — validation, scroll-to-error, DB writes
  const {
    loading,
    validationErrors,
    setValidationErrors,
    phoneInputRef,
    carModelRef,
    servicesRef,
    timeRef,
    dateRangeRef,
    handleSubmit: submitForm,
  } = useReservationSubmit({
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
  });

  const handleSubmit = () => {
    submitForm({
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
    });
  };

  // Get selected service names for display
  const selectedServiceNames = services
    .filter((s) => selectedServices.includes(s.id))
    .map((s) => s.short_name || s.name);

  // Get dialog title based on mode
  const getDialogTitle = () => {
    if (isYardMode) {
      return isEditMode ? t('addReservation.yardEditTitle') : t('addReservation.yardTitle');
    }
    return isEditMode ? t('reservations.editReservation') : t('addReservation.title');
  };

  // Show dropdown for switching to training when conditions met
  const showTrainingDropdown = trainingsEnabled && !editingReservation && mode === 'reservation';

  // Shared form content — used in both Sheet and inline modes
  const formContent = (
    <>
      {/* Fixed Header with Close button */}
      <div className="px-6 pt-6 pb-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          {showTrainingDropdown ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-lg font-semibold text-foreground hover:text-primary transition-colors">
                  {getDialogTitle()}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem className="font-medium">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {t('addReservation.title')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSwitchToTraining?.()}>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  {t('trainings.newTraining')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <h2 className="text-lg font-semibold text-foreground">{getDialogTitle()}</h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-hover transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {/* Customer Section */}
          <CustomerSection
            instanceId={instanceId}
            customerName={customerName}
            onCustomerNameChange={(val) => {
              markUserEditing();
              setCustomerName(val);
            }}
            phone={phone}
            onPhoneChange={(val) => {
              markUserEditing();
              setPhone(val);
              setSelectedCustomerId(null);
              setCustomerDiscountPercent(null);
              setNoShowWarning(null);
              if (validationErrors.phone) {
                setValidationErrors((prev) => ({ ...prev, phone: undefined }));
              }
            }}
            phoneError={validationErrors.phone}
            searchingCustomer={searchingCustomer}
            foundVehicles={foundVehicles}
            showPhoneDropdown={showPhoneDropdown}
            onSelectVehicle={(vehicle) => {
              markUserEditing();
              selectVehicle(vehicle);
            }}
            onCustomerSelect={async (customer) => {
              markUserEditing();
              suppressPhoneSearchRef.current = true;
              setCustomerName(customer.name);
              setPhone(customer.phone);
              setSelectedCustomerId(customer.id);
              const { data: customerData } = await supabase
                .from('customers')
                .select('discount_percent')
                .eq('id', customer.id)
                .maybeSingle();
              setCustomerDiscountPercent(customerData?.discount_percent || null);

              // Check no-show warning
              if (customer.has_no_show) {
                fetchNoShowWarning(customer.phone, customer.name);
              } else {
                setNoShowWarning(null);
              }

              // Load all vehicles for this customer (by phone + customer_id)
              loadCustomerVehicles(customer.phone, customer.id);
            }}
            onClearCustomer={() => {
              setSelectedCustomerId(null);
              setCustomerDiscountPercent(null);
              setNoShowWarning(null);
            }}
            suppressAutoSearch={isEditMode}
            phoneInputRef={phoneInputRef}
            setCarModel={setCarModel}
            setCarSize={setCarSize}
            noShowWarning={noShowWarning}
            selectedCustomerId={selectedCustomerId}
          />

          {/* Vehicle Section */}
          <VehicleSection
            carModel={carModel}
            onCarModelChange={(val) => {
              markUserEditing();
              if (val === null) {
                setCarModel('');
                setIsCustomCarModel(false);
                setSelectedVehicleId(null);
              } else if ('type' in val && val.type === 'custom') {
                setCarModel(val.label);
                setIsCustomCarModel(true);
                setSelectedVehicleId(null);
              } else {
                setCarModel(val.label);
                setIsCustomCarModel(false);
                setSelectedVehicleId(null);
                if ('size' in val) {
                  if (val.size === 'S') setCarSize('small');
                  else if (val.size === 'M') setCarSize('medium');
                  else if (val.size === 'L') setCarSize('large');
                }
              }
              if (validationErrors.carModel) {
                setValidationErrors((prev) => ({ ...prev, carModel: undefined }));
              }
            }}
            carSize={carSize}
            onCarSizeChange={(size) => {
              markUserEditing();
              setCarSize(size);
            }}
            carModelError={validationErrors.carModel}
            customerVehicles={customerVehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleSelect={(vehicle) => {
              markUserEditing();
              setSelectedVehicleId(vehicle.id);
              setCarModel(vehicle.model);
              if (vehicle.car_size === 'S') setCarSize('small');
              else if (vehicle.car_size === 'L') setCarSize('large');
              else setCarSize('medium');
            }}
            suppressAutoOpen={isEditMode}
            carModelRef={carModelRef}
          />

          {/* Services Section */}
          <div className="space-y-2" ref={servicesRef}>
            <Label className="flex items-center gap-2">
              {t('addReservation.services')} <span className="text-destructive">*</span>
            </Label>

            {validationErrors.services && (
              <p className="text-sm text-destructive">{validationErrors.services}</p>
            )}

            {/* Popular service shortcuts - quick add pills */}
            {services.filter((s) => s.is_popular && !selectedServices.includes(s.id)).length >
              0 && (
              <div className="flex flex-wrap gap-2">
                {services
                  .filter((s) => s.is_popular && !selectedServices.includes(s.id))
                  .map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        markUserEditing();
                        setSelectedServices((prev) => [...prev, service.id]);
                        // Add to servicesWithCategory if not already there
                        if (!servicesWithCategory.some((s) => s.id === service.id)) {
                          setServicesWithCategory((prev) => [
                            ...prev,
                            {
                              id: service.id,
                              name: service.name,
                              short_name: service.short_name,
                              category_id: service.category_id,
                              category_name: null,
                              duration_minutes: service.duration_minutes,
                              duration_small: service.duration_small,
                              duration_medium: service.duration_medium,
                              duration_large: service.duration_large,
                              price_from: service.price_from,
                              price_small: service.price_small,
                              price_medium: service.price_medium,
                              price_large: service.price_large,
                              station_type: service.station_type,
                            },
                          ]);
                        }
                        // Initialize service item with name metadata
                        if (!serviceItems.some((si) => si.service_id === service.id)) {
                          setServiceItems((prev) => [
                            ...prev,
                            {
                              service_id: service.id,
                              custom_price: null,
                              name: service.name,
                              short_name: service.short_name,
                            },
                          ]);
                        }
                      }}
                      className="px-3 py-1.5 text-sm rounded-full transition-colors font-medium text-primary-foreground bg-secondary"
                    >
                      {service.short_name || service.name}
                    </button>
                  ))}
              </div>
            )}

            {/* Services list with inline price edit */}
            <SelectedServicesList
              services={servicesWithCategory}
              selectedServiceIds={selectedServices}
              serviceItems={serviceItems}
              carSize={carSize}
              onRemoveService={(serviceId) => {
                markUserEditing();
                setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
                setServiceItems((prev) => prev.filter((si) => si.service_id !== serviceId));
                setServicesWithCategory((prev) => prev.filter((s) => s.id !== serviceId));
              }}
              onPriceChange={(serviceId, price) => {
                markUserEditing();
                setServiceItems((prev) => {
                  const existing = prev.find((si) => si.service_id === serviceId);
                  if (existing) {
                    return prev.map((si) =>
                      si.service_id === serviceId ? { ...si, custom_price: price } : si,
                    );
                  }
                  return [...prev, { service_id: serviceId, custom_price: price }];
                });
              }}
              onTotalPriceChange={(newTotal) => {
                // Only auto-update finalPrice if user hasn't manually modified it
                if (!userModifiedFinalPrice) {
                  setFinalPrice(newTotal.toString());
                }
              }}
              onAddMore={() => setServiceDrawerOpen(true)}
              pricingMode={pricingMode}
            />
          </div>

          {/* Service Selection Drawer */}
          <ServiceSelectionDrawer
            open={serviceDrawerOpen}
            onClose={() => setServiceDrawerOpen(false)}
            instanceId={instanceId}
            carSize={carSize}
            selectedServiceIds={selectedServices}
            stationType="universal"
            hasUnifiedServices={
              isEditMode ? (editingReservation?.has_unified_services ?? false) : true
            }
            hideSelectedSection={true}
            onConfirm={(serviceIds, duration, servicesData) => {
              markUserEditing();
              setSelectedServices(serviceIds);

              if (validationErrors.services) {
                setValidationErrors((prev) => ({ ...prev, services: undefined }));
              }

              const newServicesWithCategory = servicesData.filter(
                (s) => !servicesWithCategory.some((existing) => existing.id === s.id),
              );
              setServicesWithCategory((prev) => {
                const kept = prev.filter((s) => serviceIds.includes(s.id));
                return [...kept, ...newServicesWithCategory];
              });

              const existingItemIds = serviceItems.map((si) => si.service_id);
              const newItems = serviceIds
                .filter((id) => !existingItemIds.includes(id))
                .map((id) => {
                  const svc =
                    servicesData.find((s) => s.id === id) ||
                    servicesWithCategory.find((s) => s.id === id);
                  return {
                    service_id: id,
                    custom_price: null,
                    name: svc?.name || undefined,
                    short_name: svc?.short_name || undefined,
                  };
                });

              setServiceItems((prev) => {
                const kept = prev.filter((si) => serviceIds.includes(si.service_id));
                return [...kept, ...newItems];
              });
            }}
          />

          <Separator className="my-2" />

          {/* YARD MODE - Date/Time Section */}
          {isYardMode && (
            <YardDateTimeSection
              arrivalDate={arrivalDate}
              setArrivalDate={setArrivalDate}
              arrivalDateOpen={arrivalDateOpen}
              setArrivalDateOpen={setArrivalDateOpen}
              pickupDate={pickupDate}
              setPickupDate={setPickupDate}
              pickupDateOpen={pickupDateOpen}
              setPickupDateOpen={setPickupDateOpen}
              deadlineTime={deadlineTime}
              setDeadlineTime={setDeadlineTime}
              timeOptions={yardTimeOptions}
            />
          )}

          {/* RESERVATION MODE - Date/Time/Station Slots Section */}
          {isReservationMode && (
            <div ref={dateRangeRef}>
              <div ref={timeRef}>
                <ReservationSlotsSection
                  slots={slots}
                  onSlotsChange={(newSlots) => {
                    markUserEditing();
                    setValidationErrors((prev) => ({
                      ...prev,
                      dateRange: undefined,
                      time: undefined,
                      station: undefined,
                    }));
                    setSlots(newSlots);
                  }}
                  stations={stations}
                  workingHours={workingHours}
                  startTimeOptions={startTimeOptions}
                  endTimeOptions={endTimeOptions}
                  errors={{
                    dateRange: validationErrors.dateRange,
                    time: validationErrors.time,
                    station: validationErrors.station,
                  }}
                  isMobile={isMobile}
                  showStationSelector={isEditMode || !initialStationId}
                  isEditMode={isEditMode}
                  onUserModifiedEndTime={() => setUserModifiedEndTime(true)}
                />
              </div>
            </div>
          )}

          {/* Assigned Employees Section - visible when feature enabled */}
          {showEmployeeAssignment && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Przypisani pracownicy
              </Label>
              <AssignedEmployeesChips
                employeeIds={assignedEmployeeIds}
                employees={employees}
                onRemove={(id) => setAssignedEmployeeIds((prev) => prev.filter((e) => e !== id))}
                onAdd={() => setEmployeeDrawerOpen(true)}
                variant="blue"
              />
            </div>
          )}

          {/* Notes and Price Section */}
          <NotesAndPriceSection
            adminNotes={adminNotes}
            setAdminNotes={setAdminNotes}
            showPrice={isReservationMode}
            finalPrice={finalPrice}
            setFinalPrice={setFinalPrice}
            totalPrice={totalPrice}
            discountedPrice={discountedPrice}
            customerDiscountPercent={customerDiscountPercent}
            markUserEditing={markUserEditing}
            onFinalPriceUserEdit={() => setUserModifiedFinalPrice(true)}
            pricingMode={pricingMode}
          />
        </div>
      </div>

      {/* Fixed Footer */}
      {/* Fixed Footer */}
      <div className="px-6 py-4 border-t shrink-0">
        <Button type="button" onClick={handleSubmit} disabled={loading} className="w-full">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isYardMode
            ? isEditMode
              ? t('addReservation.saveYardChanges')
              : t('addReservation.addYardVehicle')
            : isEditMode
              ? t('addReservation.saveChanges')
              : slots.length > 1
                ? `${t('addReservation.addReservation')} (${slots.length})`
                : t('addReservation.addReservation')}
        </Button>
      </div>
    </>
  );

  // Inline mode: render as a plain div (no Sheet portal)
  // ESC to close inline mode
  useEffect(() => {
    if (!inline || !open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inline, open, onClose]);

  if (inline) {
    if (!open) return null;
    return (
      <>
        <div className="flex flex-col h-full bg-white">{formContent}</div>
        <EmployeeSelectionDrawer
          open={employeeDrawerOpen}
          onOpenChange={setEmployeeDrawerOpen}
          instanceId={instanceId}
          selectedEmployeeIds={assignedEmployeeIds}
          onSelect={(employeeIds) => {
            employeesDirtyRef.current = true;
            markUserEditing();
            setAssignedEmployeeIds(employeeIds);
          }}
        />
      </>
    );
  }

  // Sheet mode (default)
  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()} modal={false}>
        <SheetContent
          side="right"
          className={cn(
            'w-full sm:max-w-[27rem] flex flex-col h-full p-0 gap-0 shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] bg-white',
            isMobile && isDrawerHidden && '!hidden',
          )}
          hideOverlay
          hideCloseButton
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={onClose}
        >
          {formContent}
        </SheetContent>
      </Sheet>

      {/* Mobile FAB to toggle drawer visibility */}
      {isMobile && open && (
        <button
          type="button"
          onClick={() => setIsDrawerHidden(!isDrawerHidden)}
          className="fixed z-[60] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center bottom-20 right-4"
        >
          {isDrawerHidden ? (
            <ClipboardPaste className="w-6 h-6" />
          ) : (
            <CalendarIcon className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Employee Selection Drawer */}
      <EmployeeSelectionDrawer
        open={employeeDrawerOpen}
        onOpenChange={setEmployeeDrawerOpen}
        instanceId={instanceId}
        selectedEmployeeIds={assignedEmployeeIds}
        onSelect={(employeeIds) => {
          employeesDirtyRef.current = true;
          markUserEditing();
          setAssignedEmployeeIds(employeeIds);
        }}
      />
    </>
  );
};

export default AddReservationDialogV2;
