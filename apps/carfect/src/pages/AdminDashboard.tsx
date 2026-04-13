import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIsMobile } from '@shared/ui';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Calendar,
  LogOut,
  Menu,
  Settings,
  UserCircle,
  PanelLeftClose,
  PanelLeft,
  FileText,
  CalendarClock,
  ChevronUp,
  Package,
  Bell,
  ClipboardCheck,
  ListChecks,
  Loader2,
  UsersRound,
  BadgeDollarSign,
  GraduationCap,
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { useStations } from '@/hooks/useStations';
import { useBreaks } from '@/hooks/useBreaks';
import { useClosedDays } from '@/hooks/useClosedDays';
import { useWorkingHours } from '@/hooks/useWorkingHours';
import { useUnifiedServices } from '@/hooks/useUnifiedServices';
import { useServiceDictionary } from '@/hooks/useServiceDictionary';
import { useInstanceData } from '@/hooks/useInstanceData';
import { useEmployees } from '@/hooks/useEmployees';
import { useInstanceSettings } from '@/hooks/useInstanceSettings';
import { useStationEmployees } from '@/hooks/useStationEmployees';
import { useReservations } from '@/hooks/useReservations';
import { useReservationsRealtime } from '@/hooks/useReservationsRealtime';
import { useReservationMutations } from '@/hooks/useReservationMutations';
import HallsListView from '@/components/admin/halls/HallsListView';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Separator } from '@shared/ui';
import { Button } from '@shared/ui';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, addDays, getDay } from 'date-fns';
import { useFreeTimeSlots } from '@/hooks/useFreeTimeSlots';
import { useAuth } from '@/hooks/useAuth';
import { useCombinedFeatures } from '@/hooks/useCombinedFeatures';
import { supabase } from '@/integrations/supabase/client';
import AdminCalendar from '@/components/admin/AdminCalendar';
import ReservationDetailsDrawer from '@/components/admin/ReservationDetailsDrawer';
import ReservationsView from '@/components/admin/ReservationsView';
import AddReservationDialogV2 from '@/components/admin/AddReservationDialogV2';
import AddBreakDialog from '@/components/admin/AddBreakDialog';
import MobileBottomNav from '@/components/admin/MobileBottomNav';
import CustomersView from '@/components/admin/CustomersView';
import InstanceSettingsDialog from '@/components/admin/InstanceSettingsDialog';
import OffersView from '@/components/admin/OffersView';
import ProductsView from '@/components/admin/ProductsView';
import FollowUpView from '@/components/admin/FollowUpView';
import NotificationsView from '@/components/admin/NotificationsView';
import SettingsView from '@/components/admin/SettingsView';
import PriceListSettings from '@/components/admin/PriceListSettings';
import { ProtocolsView } from '@/components/protocols/ProtocolsView';
import RemindersView from '@/components/admin/RemindersView';
import AiAnalystTab from '@/components/admin/AiAnalystTab';
import { EmployeesView } from '@/components/admin/employees';
import { AddTrainingDrawer } from '@/components/admin/AddTrainingDrawer';
import { TrainingDetailsDrawer } from '@/components/admin/TrainingDetailsDrawer';
import type { Training } from '@/components/admin/AddTrainingDrawer';
import { toast } from 'sonner';
import { normalizePhone as normalizePhoneForStorage } from '@shared/utils';
import type { Reservation, ServiceItem } from '@/types/reservation';
interface Station {
  id: string;
  name: string;
  type: string;
  color?: string | null;
}
interface Break {
  id: string;
  instance_id: string;
  station_id: string;
  break_date: string;
  start_time: string;
  end_time: string;
  note: string | null;
}
interface ClosedDay {
  id: string;
  instance_id: string;
  closed_date: string;
  reason: string | null;
}
type ViewType =
  | 'calendar'
  | 'reservations'
  | 'customers'
  | 'pricelist'
  | 'settings'
  | 'offers'
  | 'products'
  | 'followup'
  | 'notifications'
  | 'halls'
  | 'protocols'
  | 'reminders'
  | 'employees'
  | 'ai_analyst';
const validViews: ViewType[] = [
  'calendar',
  'reservations',
  'customers',
  'pricelist',
  'settings',
  'offers',
  'products',
  'followup',
  'notifications',
  'halls',
  'protocols',
  'reminders',
  'employees',
  'ai_analyst',
];

// Pure helper: find nearest working day starting from `date` (checks up to 7 days ahead)
const findNearestWorkingDay = (
  date: Date,
  hours: Record<string, { open: string; close: string } | null>,
): Date => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (let i = 0; i < 7; i++) {
    const checkDate = addDays(date, i);
    const dayName = dayNames[getDay(checkDate)];
    const dayConfig = hours[dayName];

    if (dayConfig && dayConfig.open && dayConfig.close) {
      return checkDate;
    }
  }

  return date;
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { view } = useParams<{ view?: string }>();
  const { user, roles, username: authUsername, signOut } = useAuth();
  const { currentVersion } = useAppUpdate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Hall users always have collapsed sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });

  // Deep linking: check for reservationCode in URL
  const reservationCodeFromUrl = searchParams.get('reservationCode');

  // Derive currentView from URL param
  const currentView: ViewType =
    view && validViews.includes(view as ViewType) ? (view as ViewType) : 'calendar';

  // Support both route bases:
  // - dev/staging: /admin/:view
  // - instance admin subdomain: /:view
  const location = useLocation();
  const adminBasePath = location.pathname.startsWith('/admin') ? '/admin' : '';

  const setCurrentView = (newView: ViewType) => {
    // For subdomain mode: empty adminBasePath means we're on *.admin.carfect.pl
    // Calendar should be at '/' and views at '/:view'
    if (!adminBasePath) {
      // Subdomain mode
      const target = newView === 'calendar' ? '/' : `/${newView}`;
      navigate(target, { replace: true });
    } else {
      // Dev mode with /admin prefix
      const target = newView === 'calendar' ? adminBasePath : `${adminBasePath}/${newView}`;
      navigate(target, { replace: true });
    }
  };

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Deep link handling ref to prevent infinite loops
  const deepLinkHandledRef = useRef(false);

  const [allServices, setAllServices] = useState<
    Array<{
      id: string;
      name: string;
      shortcut?: string | null;
      duration_minutes?: number | null;
      duration_small?: number | null;
      duration_medium?: number | null;
      duration_large?: number | null;
    }>
  >([]);
  // Using cached hooks for stations - manual state is fallback for local updates

  // Add/Edit reservation dialog state
  const [addReservationOpen, setAddReservationOpen] = useState(false);
  const [addReservationV2Open, setAddReservationV2Open] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [newReservationData, setNewReservationData] = useState({
    stationId: '',
    date: '',
    endDate: '' as string,
    time: '',
    stationType: '' as string,
  });

  // Offer prefill from reservation drawer — cleared when leaving offers view
  const [offerPrefill, setOfferPrefill] = useState<{
    name: string;
    phone: string;
    plate?: string;
  } | null>(null);
  useEffect(() => {
    if (currentView !== 'offers') setOfferPrefill(null);
  }, [currentView]);

  // Slot preview for live calendar highlight
  const [slotPreview, setSlotPreview] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    stationId: string;
  } | null>(null);

  // Memoized callback to prevent re-renders in AddReservationDialogV2
  const handleSlotPreviewChange = useCallback(
    (
      preview: {
        date: string;
        startTime: string;
        endTime: string;
        stationId: string;
      } | null,
    ) => {
      setSlotPreview(preview);
    },
    [],
  );

  // Breaks state - using cached hooks, state for local updates
  const [addBreakOpen, setAddBreakOpen] = useState(false);
  const [newBreakData, setNewBreakData] = useState({
    stationId: '',
    date: '',
    time: '',
  });

  // Yard vehicle count for badge
  const [yardVehicleCount, setYardVehicleCount] = useState(0);

  // Unread notifications count for badge
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Reservation list filter
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  // Get user's instance ID from user_roles
  const [instanceId, setInstanceId] = useState<string | null>(null);

  // User role (admin, employee, or hall)
  const [userRole, setUserRole] = useState<'admin' | 'employee' | 'hall' | null>(null);

  // Use username from auth context (combined with roles fetch)
  const username = authUsername;

  // Instance settings dialog
  const [instanceSettingsOpen, setInstanceSettingsOpen] = useState(false);

  // Protocol editing mode - used to hide sidebar/mobile nav
  const [protocolEditMode, setProtocolEditMode] = useState(false);
  // Offer editing mode - used to hide mobile nav
  const [offerEditMode, setOfferEditMode] = useState(false);

  // Trainings state
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [trainingDetailsOpen, setTrainingDetailsOpen] = useState(false);
  const [addTrainingOpen, setAddTrainingOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);

  // Combined feature check: checks both plan features and instance-level features
  const { hasFeature } = useCombinedFeatures(instanceId);

  // CACHED HOOKS - using React Query with staleTime for static data
  const { data: cachedStations = [] } = useStations(instanceId);
  const { data: cachedBreaks = [] } = useBreaks(instanceId);
  const { data: cachedClosedDays = [] } = useClosedDays(instanceId);
  const { data: cachedWorkingHours } = useWorkingHours(instanceId);
  const { data: cachedServices = [] } = useUnifiedServices(instanceId);
  const { map: serviceDictMap } = useServiceDictionary(instanceId);
  const { data: cachedInstanceData } = useInstanceData(instanceId);
  const { data: cachedEmployees = [] } = useEmployees(instanceId);
  const { data: instanceSettings } = useInstanceSettings(instanceId);
  const { data: stationEmployeesMap } = useStationEmployees(instanceId);

  // Use cached data (with local state fallback for realtime updates)
  const stations = cachedStations as Station[];
  const breaks = cachedBreaks as Break[];
  const closedDays = cachedClosedDays as ClosedDay[];
  const workingHours = cachedWorkingHours;
  const instanceData = cachedInstanceData;

  // Reservations data via shared hook (replaces inline fetch/loadMore/mapReservationData)
  const {
    reservations,
    isLoadingMore: isLoadingMoreReservations,
    refetch: refetchReservations,
    checkAndLoadMore,
    updateReservationsCache,
    invalidateReservations,
    expandDateRange,
    servicesMapRef,
    loadedDateRange,
  } = useReservations({ instanceId, serviceDictMap });

  // Current calendar date (synced from AdminCalendar) - initialize from same localStorage source
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    const saved = localStorage.getItem('admin-calendar-date');
    if (saved) {
      try {
        const parsed = new Date(saved);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch {
        /* invalid date in localStorage */
      }
    }
    return new Date();
  });
  // Derive instanceId and userRole from auth roles (avoid duplicate fetch)
  useEffect(() => {
    if (!user) return;

    // Check admin role first
    const adminRole = roles.find((r) => r.role === 'admin' && r.instance_id);
    if (adminRole?.instance_id) {
      setInstanceId(adminRole.instance_id);
      setUserRole('admin');
      return;
    }

    // Check employee role
    const employeeRole = roles.find((r) => r.role === 'employee' && r.instance_id);
    if (employeeRole?.instance_id) {
      setInstanceId(employeeRole.instance_id);
      setUserRole('employee');
      return;
    }

    // Check hall role
    const hallRole = roles.find((r) => r.role === 'hall' && r.instance_id);
    if (hallRole?.instance_id) {
      setInstanceId(hallRole.instance_id);
      setUserRole('hall');
      return;
    }

    // Check super_admin - need to fetch first instance
    const isSuperAdmin = roles.some((r) => r.role === 'super_admin');
    if (isSuperAdmin) {
      setUserRole('admin');
      const fetchFirstInstance = async () => {
        const { data: instances } = await supabase
          .from('instances')
          .select('id')
          .eq('active', true)
          .limit(1)
          .maybeSingle();
        if (instances?.id) {
          setInstanceId(instances.id);
        }
      };
      fetchFirstInstance();
    }
  }, [user, roles]);

  // Redirect hall role to HallView by default, but allow access to protocols view.
  useEffect(() => {
    if (userRole !== 'hall' || !instanceId) return;

    // Hall users are allowed to use the Protocols module.
    if (currentView === 'protocols') return;

    // Use hall_id from role if available, otherwise fallback to /1
    const hallRole = roles.find((r) => r.role === 'hall');
    const hallSegment = hallRole?.hall_id || '1';
    const hallPath = adminBasePath ? `/admin/halls/${hallSegment}` : `/halls/${hallSegment}`;
    navigate(hallPath, { replace: true });
  }, [userRole, instanceId, navigate, adminBasePath, currentView, roles]);

  // Fetch yard vehicle count for badge (lazy-loaded only when needed)
  const fetchYardVehicleCount = async () => {
    if (!instanceId) return;
    const { count, error } = await supabase
      .from('yard_vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('instance_id', instanceId)
      .eq('status', 'waiting');
    if (!error && count !== null) {
      setYardVehicleCount(count);
    }
  };

  // Fetch unread notifications count for badge
  const fetchUnreadNotificationsCount = async () => {
    if (!instanceId) return;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('instance_id', instanceId)
      .eq('read', false);
    if (!error && count !== null) {
      setUnreadNotificationsCount(count);
    }
  };

  // Removed fetchStations, fetchWorkingHours, fetchInstanceData - now using cached hooks
  // Only fetch notification count and yard vehicles on initial load
  useEffect(() => {
    fetchUnreadNotificationsCount();
    // Don't fetch yard vehicles eagerly - only when dialog opens
  }, [instanceId]);

  // Set calendar to nearest working day when working hours are loaded
  useEffect(() => {
    if (!workingHours) return;

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDayName = dayNames[getDay(today)];
    const todayConfig = workingHours[todayDayName];

    // Check if today is a working day
    const isTodayWorkingDay = todayConfig && todayConfig.open && todayConfig.close;

    if (!isTodayWorkingDay) {
      const nearestWorkingDay = findNearestWorkingDay(today, workingHours);
      setCalendarDate(nearestWorkingDay);
      localStorage.setItem('admin-calendar-date', nearestWorkingDay.toISOString());
    }
  }, [workingHours]);

  // Subscribe to yard_vehicles changes for real-time count updates
  useEffect(() => {
    if (!instanceId) return;

    const channel = supabase
      .channel('yard-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'yard_vehicles',
          filter: `instance_id=eq.${instanceId}`,
        },
        () => {
          fetchYardVehicleCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId]);

  // Subscribe to notifications changes for real-time count updates
  useEffect(() => {
    if (!instanceId) return;

    const channel = supabase
      .channel('notifications-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `instance_id=eq.${instanceId}`,
        },
        () => {
          fetchUnreadNotificationsCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId]);

  // Save sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Calendar view now uses cached hooks - reservations are fetched via the main useEffect below

  // Fetch all services for multi-service mapping
  const fetchAllServices = async () => {
    if (!instanceId) return;
    const { data } = await supabase
      .from('unified_services')
      .select(
        'id, name, short_name, duration_minutes, duration_small, duration_medium, duration_large',
      )
      .eq('instance_id', instanceId)
      .eq('active', true)
      .eq('service_type', 'reservation');
    if (data) {
      setAllServices(data.map((s) => ({ ...s, shortcut: s.short_name })));
    }
  };

  // Handle calendar date change - load more data if approaching edge
  const handleCalendarDateChange = useCallback(
    (date: Date) => {
      setCalendarDate(date);
      checkAndLoadMore(date);
    },
    [checkAndLoadMore],
  );

  // Breaks and closed days now use cached hooks - invalidate cache instead of local state
  const invalidateBreaksCache = () => {
    queryClient.invalidateQueries({ queryKey: ['breaks', instanceId] });
  };

  const invalidateClosedDaysCache = () => {
    queryClient.invalidateQueries({ queryKey: ['closed_days', instanceId] });
  };

  // Trainings enabled flag
  const trainingsEnabled = hasFeature('trainings');

  // Fetch trainings
  const fetchTrainings = useCallback(async () => {
    if (!instanceId || !trainingsEnabled) {
      setTrainings([]);
      return;
    }
    const { data, error } = (await supabase
      .from('trainings')
      .select(
        '*, stations:station_id (name, type), training_type_record:training_type_id (id, name, duration_days, sort_order, active, instance_id)',
      )
      .eq('instance_id', instanceId)) as any;

    if (!error && data) {
      setTrainings(
        data.map((t: any) => ({
          ...t,
          assigned_employee_ids: Array.isArray(t.assigned_employee_ids)
            ? t.assigned_employee_ids
            : [],
          station: t.stations ? { name: t.stations.name, type: t.stations.type } : null,
          training_type_record: t.training_type_record || null,
        })),
      );
    }
  }, [instanceId, trainingsEnabled]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  // Deep linking: auto-open reservation from URL param
  // If reservation is not in loaded range, fetch it directly
  // Reset handled flag when reservation code changes
  useEffect(() => {
    deepLinkHandledRef.current = false;
  }, [reservationCodeFromUrl]);

  useEffect(() => {
    const handleDeepLink = async () => {
      if (!reservationCodeFromUrl || !instanceId) return;
      if (deepLinkHandledRef.current) return; // Already handled this code

      // First check if reservation is already in state
      const existingReservation = reservations.find(
        (r) => r.confirmation_code === reservationCodeFromUrl,
      );
      if (existingReservation) {
        deepLinkHandledRef.current = true;
        setSelectedReservation(existingReservation);
        searchParams.delete('reservationCode');
        setSearchParams(searchParams, { replace: true });
        return;
      }

      // If not found in state (might be outside loaded date range), fetch directly
      // Only try once when reservations are loaded
      if (reservations.length > 0) {
        deepLinkHandledRef.current = true;
        const { data } = await supabase
          .from('reservations')
          .select(
            `
            id,
            instance_id,
            customer_name,
            customer_phone,
            vehicle_plate,
            reservation_date,
            end_date,
            start_time,
            end_time,
            station_id,
            status,
            confirmation_code,
            price,
            customer_notes,
            admin_notes,
            source,
            car_size,
            service_ids,
            service_items,
            assigned_employee_ids,
            original_reservation_id,
            offer_number,
            confirmation_sms_sent_at,
            pickup_sms_sent_at,
            photo_urls,
            stations:station_id (name, type)
          `,
          )
          .eq('instance_id', instanceId)
          .eq('confirmation_code', reservationCodeFromUrl)
          .maybeSingle();

        if (data) {
          const mappedReservation: Reservation = {
            ...data,
            status: data.status || 'pending',
            service_ids: Array.isArray(data.service_ids)
              ? (data.service_ids as string[])
              : undefined,
            service_items: Array.isArray(data.service_items)
              ? (data.service_items as unknown as ServiceItem[])
              : undefined,
            assigned_employee_ids: Array.isArray(data.assigned_employee_ids)
              ? (data.assigned_employee_ids as string[])
              : undefined,
            service: undefined, // Legacy relation removed - use service_ids/service_items instead
            station: data.stations
              ? {
                  name: (data.stations as any).name,
                  type: (data.stations as any).type,
                }
              : undefined,
          };
          // Add to state temporarily so drawer can open
          updateReservationsCache((prev) => [...prev, mappedReservation]);
          setSelectedReservation(mappedReservation);
          searchParams.delete('reservationCode');
          setSearchParams(searchParams, { replace: true });
        }
      }
    };

    handleDeepLink();
    // IMPORTANT: Removed 'reservations' from dependencies to prevent infinite loop
  }, [reservationCodeFromUrl, instanceId, searchParams, setSearchParams]);

  // Realtime subscription for reservations and trainings
  const handleRealtimeInsert = useCallback(
    (reservation: Reservation) => {
      updateReservationsCache((prev) => {
        if (prev.some((r) => r.id === reservation.id)) {
          return prev.map((r) => (r.id === reservation.id ? reservation : r));
        }
        return [...prev, reservation];
      });
    },
    [updateReservationsCache],
  );
  const handleRealtimeUpdate = useCallback(
    (reservation: Reservation) => {
      updateReservationsCache((prev) =>
        prev.map((r) => (r.id === reservation.id ? reservation : r)),
      );
    },
    [updateReservationsCache],
  );
  const handleRealtimeDelete = useCallback(
    (reservationId: string) => {
      updateReservationsCache((prev) => prev.filter((r) => r.id !== reservationId));
    },
    [updateReservationsCache],
  );
  const handleRealtimeRefetch = useCallback(async () => {
    await Promise.all([refetchReservations(), fetchTrainings()]);
  }, [refetchReservations, fetchTrainings]);
  const handleNewCustomerReservation = useCallback((reservation: Reservation) => {
    toast.success('🔔 Nowa rezerwacja od klienta!', {
      description: `${reservation.customer_name} - ${reservation.start_time}`,
    });
  }, []);
  const handleRealtimeUpdateSelected = useCallback((reservation: Reservation) => {
    setSelectedReservation((prev) => (prev?.id === reservation.id ? reservation : prev));
  }, []);
  const handleTrainingUpsert = useCallback((data: Record<string, unknown>) => {
    const mapped: Training = {
      ...(data as any),
      assigned_employee_ids: Array.isArray(data.assigned_employee_ids)
        ? data.assigned_employee_ids
        : [],
      station: (data as any).stations
        ? { name: (data as any).stations.name, type: (data as any).stations.type }
        : null,
      training_type_record: (data as any).training_type_record || null,
    };
    setTrainings((prev) => {
      const exists = prev.some((t) => t.id === mapped.id);
      if (exists) return prev.map((t) => (t.id === mapped.id ? mapped : t));
      return [...prev, mapped];
    });
    setSelectedTraining((prev) => (prev?.id === mapped.id ? mapped : prev));
  }, []);
  const handleTrainingDelete = useCallback((trainingId: string) => {
    setTrainings((prev) => prev.filter((t) => t.id !== trainingId));
    setSelectedTraining((prev) => (prev?.id === trainingId ? null : prev));
  }, []);

  const { isConnected: realtimeConnected, markAsLocallyUpdated } = useReservationsRealtime({
    instanceId,
    servicesMapRef,
    loadedDateRangeFrom: loadedDateRange.from,
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeDelete,
    onRefetch: handleRealtimeRefetch,
    onNewCustomerReservation: handleNewCustomerReservation,
    onUpdateSelectedReservation: handleRealtimeUpdateSelected,
    onTrainingInsert: handleTrainingUpsert,
    onTrainingUpdate: handleTrainingUpsert,
    onTrainingDelete: handleTrainingDelete,
  });

  const {
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
  } = useReservationMutations({
    instanceId,
    reservations,
    updateReservationsCache,
    invalidateReservations,
    setSelectedReservation,
    markAsLocallyUpdated,
    instanceData: instanceData
      ? {
          name: instanceData.name,
          short_name: instanceData.short_name,
          slug: instanceData.slug,
          google_maps_url: instanceData.google_maps_url,
        }
      : null,
    userId: user?.id || null,
  });

  // Calculate free time ranges (gaps) per station
  const getFreeRangesPerStation = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinutes;
    const today = format(now, 'yyyy-MM-dd');

    // Use actual working hours from instance settings
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDayName = dayNames[getDay(now)];
    const todayHours = workingHours?.[todayDayName];
    const workStart = todayHours?.open
      ? parseInt(todayHours.open.split(':')[0]) * 60 + parseInt(todayHours.open.split(':')[1])
      : 8 * 60;
    const workEnd = todayHours?.close
      ? parseInt(todayHours.close.split(':')[0]) * 60 + parseInt(todayHours.close.split(':')[1])
      : 18 * 60;

    return stations.map((station) => {
      const stationReservations = reservations
        .filter((r) => r.station_id === station.id && r.reservation_date === today)
        .map((r) => ({
          start: parseInt(r.start_time.split(':')[0]) * 60 + parseInt(r.start_time.split(':')[1]),
          end: parseInt(r.end_time.split(':')[0]) * 60 + parseInt(r.end_time.split(':')[1]),
        }))
        .sort((a, b) => a.start - b.start);

      // Find gaps
      const gaps: {
        start: number;
        end: number;
      }[] = [];
      let searchStart = Math.max(workStart, currentTimeMinutes);
      for (const res of stationReservations) {
        if (res.start > searchStart) {
          gaps.push({
            start: searchStart,
            end: res.start,
          });
        }
        searchStart = Math.max(searchStart, res.end);
      }

      // Add gap at the end if there's time left
      if (searchStart < workEnd) {
        gaps.push({
          start: searchStart,
          end: workEnd,
        });
      }

      // Format gaps as readable strings
      const freeRanges = gaps.map((gap) => {
        const startHour = Math.floor(gap.start / 60);
        const startMin = gap.start % 60;
        const endHour = Math.floor(gap.end / 60);
        const endMin = gap.end % 60;
        const durationHours = (gap.end - gap.start) / 60;
        const startStr = `${startHour}:${startMin.toString().padStart(2, '0')}`;
        const endStr = `${endHour}:${endMin.toString().padStart(2, '0')}`;
        const durationStr =
          durationHours >= 1
            ? `${Math.floor(durationHours)}h${durationHours % 1 > 0 ? ` ${Math.round((durationHours % 1) * 60)}min` : ''}`
            : `${Math.round(durationHours * 60)}min`;
        return {
          label: `${startStr} - ${endStr}`,
          duration: durationStr,
          durationMinutes: gap.end - gap.start,
        };
      });
      return {
        ...station,
        freeRanges,
      };
    });
  };
  const stationsWithRanges = getFreeRangesPerStation();
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  const handleReservationClick = (reservation: Reservation) => {
    // Close add/edit drawer when opening details drawer
    setAddReservationOpen(false);
    setAddReservationV2Open(false);
    setEditingReservation(null);
    setSlotPreview(null);
    setTrainingDetailsOpen(false);
    setSelectedTraining(null);
    setSelectedReservation(reservation);
  };

  const handleOpenReservationById = async (reservationId: string) => {
    // Check if already loaded in state
    const existing = reservations.find((r) => r.id === reservationId);
    if (existing) {
      handleReservationClick(existing);
      return;
    }
    // Fetch from DB
    const { data } = await supabase
      .from('reservations')
      .select(`*, stations:station_id(name, type)`)
      .eq('id', reservationId)
      .single();
    if (data) {
      const mapped: Reservation = {
        ...(data as unknown as Reservation),
        status: data.status || 'pending',
        service_ids: Array.isArray(data.service_ids) ? (data.service_ids as string[]) : undefined,
        service_items: Array.isArray(data.service_items)
          ? (data.service_items as unknown as ServiceItem[])
          : undefined,
        assigned_employee_ids: Array.isArray(data.assigned_employee_ids)
          ? (data.assigned_employee_ids as string[])
          : undefined,
        service: undefined,
        station: data.stations
          ? { name: (data.stations as any).name, type: (data.stations as any).type }
          : undefined,
      };
      handleReservationClick(mapped);
    }
  };

  const handleTrainingClick = (training: Training) => {
    setSelectedReservation(null);
    setAddReservationOpen(false);
    setAddTrainingOpen(false);
    setSelectedTraining(training);
    setTrainingDetailsOpen(true);
  };

  const handleSwitchToTraining = () => {
    setAddReservationOpen(false);
    setAddReservationV2Open(false);
    setEditingReservation(null);
    setSlotPreview(null);
    setEditingTraining(null);
    setAddTrainingOpen(true);
  };
  const handleAddReservation = (
    stationId: string,
    date: string,
    time: string,
    endDate?: string,
  ) => {
    const station = stations.find((s) => s.id === stationId);
    // Close details drawer when opening add drawer
    setSelectedReservation(null);
    setEditingReservation(null); // Clear editing mode
    setNewReservationData({
      stationId,
      date,
      endDate: endDate || '',
      time,
      stationType: station?.type || '',
    });
    setAddReservationOpen(true);
  };

  // Open edit reservation dialog — close details drawer first so it doesn't block
  const handleEditReservation = (reservation: Reservation) => {
    const station = stations.find((s) => s.id === reservation.station_id);
    setSelectedReservation(null);
    setEditingReservation(reservation);
    setNewReservationData({
      stationId: reservation.station_id || '',
      date: reservation.reservation_date,
      time: reservation.start_time?.substring(0, 5) || '',
      stationType: station?.type || '',
    });
    setAddReservationOpen(true);
  };

  // Quick add reservation (for mobile bottom nav / FAB) - opens with "Dostępne sloty" tab
  const handleQuickAddReservation = () => {
    // Close details drawer when opening add drawer
    setSelectedReservation(null);
    setEditingReservation(null); // Clear editing mode
    setNewReservationData({
      stationId: '',
      date: '',
      time: '',
      stationType: '',
    });
    setAddReservationOpen(true);
  };
  const handleReservationAdded = (reservationId?: string) => {
    // Always refresh reservations to ensure new/updated data shows in calendar
    // Realtime may have delays or miss events, so explicit refetch is more reliable
    invalidateReservations();
    setEditingReservation(null);
  };
  const handleAddBreak = (stationId: string, date: string, time: string) => {
    setNewBreakData({
      stationId,
      date,
      time,
    });
    setAddBreakOpen(true);
  };
  const handleBreakAdded = () => {
    invalidateBreaksCache();
  };
  const handleDeleteBreak = async (breakId: string) => {
    const { error } = await supabase.from('breaks').delete().eq('id', breakId);
    if (error) {
      toast.error(t('errors.generic'));
      console.error('Error deleting break:', error);
      return;
    }
    invalidateBreaksCache();
    toast.success(t('common.success'));
  };
  const handleToggleClosedDay = async (date: string) => {
    if (!instanceId) return;
    const existingClosedDay = closedDays.find((cd) => cd.closed_date === date);
    if (existingClosedDay) {
      // Day is closed - open it (delete from closed_days)
      const { error } = await supabase.from('closed_days').delete().eq('id', existingClosedDay.id);
      if (error) {
        toast.error(t('errors.generic'));
        console.error('Error opening day:', error);
        return;
      }
      invalidateClosedDaysCache();
      toast.success(t('common.success'));
    } else {
      // Day is open - close it (insert to closed_days)
      const newClosedDay = {
        instance_id: instanceId,
        closed_date: date,
        reason: null,
      };
      const { error } = await supabase.from('closed_days').insert(newClosedDay).select().single();
      if (error) {
        toast.error(t('errors.generic'));
        console.error('Error closing day:', error);
        return;
      }
      invalidateClosedDaysCache();
      toast.success(t('common.success'));
    }
  };
  // Handle yard vehicle drop onto calendar
  const handleYardVehicleDrop = async (
    vehicle: {
      id: string;
      customer_name: string;
      customer_phone: string;
      vehicle_plate: string;
      car_size: 'small' | 'medium' | 'large' | null;
      service_ids: string[];
      notes: string | null;
    },
    stationId: string,
    date: string,
    time: string,
  ) => {
    if (!instanceId) return;

    // Default car size to 'medium' if not set
    const effectiveCarSize = vehicle.car_size || 'medium';

    // Calculate total duration based on services
    let totalDuration = 60; // Default 1 hour if no services

    if (vehicle.service_ids && vehicle.service_ids.length > 0) {
      totalDuration = vehicle.service_ids.reduce((total, serviceId) => {
        const service = allServices.find((s) => s.id === serviceId);
        if (!service) {
          console.warn(`Service ${serviceId} not found in allServices`);
          return total;
        }

        // Get duration based on car size (with fallback chain)
        let duration = 0;
        if (effectiveCarSize === 'small') {
          duration =
            service.duration_small || service.duration_medium || service.duration_minutes || 60;
        } else if (effectiveCarSize === 'large') {
          duration =
            service.duration_large || service.duration_medium || service.duration_minutes || 60;
        } else {
          // medium or fallback
          duration = service.duration_medium || service.duration_minutes || 60;
        }

        return total + duration;
      }, 0);

      // Minimum 30 minutes
      if (totalDuration < 30) totalDuration = 30;
    }

    // Calculate end time based on duration
    const [hours, mins] = time.split(':').map(Number);
    const endMinutes = hours * 60 + mins + totalDuration;
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Generate confirmation code
    const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Get first service ID or fetch a default one
    let primaryServiceId = vehicle.service_ids?.[0];
    if (!primaryServiceId && allServices.length > 0) {
      primaryServiceId = allServices[0].id;
    }

    if (!primaryServiceId) {
      toast.error('Brak usług - dodaj usługę do pojazdu lub utwórz usługę w systemie');
      return;
    }

    try {
      // Create reservation from yard vehicle data
      const { error: reservationError } = await supabase.from('reservations').insert([
        {
          instance_id: instanceId,
          station_id: stationId,
          reservation_date: date,
          start_time: time,
          end_time: endTime,
          customer_name: vehicle.customer_name,
          customer_phone: normalizePhoneForStorage(vehicle.customer_phone) || '',
          vehicle_plate: vehicle.vehicle_plate,
          car_size: vehicle.car_size,
          service_id: primaryServiceId,
          service_ids: vehicle.service_ids || [],
          admin_notes: vehicle.notes,
          confirmation_code: confirmationCode,
          status: 'confirmed' as const,
          source: 'admin',
        },
      ]);

      if (reservationError) throw reservationError;

      // Delete from yard_vehicles
      const { error: deleteError } = await supabase
        .from('yard_vehicles')
        .delete()
        .eq('id', vehicle.id);
      if (deleteError) console.error('Error deleting yard vehicle:', deleteError);

      invalidateReservations();
      toast.success('Rezerwacja utworzona z placu');
    } catch (error) {
      console.error('Error creating reservation from yard:', error);
      toast.error('Błąd podczas tworzenia rezerwacji');
    }
  };

  const pendingCount = reservations.filter((r) => (r.status || 'pending') === 'pending').length;

  return (
    <>
      <Helmet>
        <title>Panel Admina - {instanceData?.name || 'Carfect'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div
        className="min-h-screen h-screen bg-background flex overflow-hidden"
        style={
          {
            '--sidebar-w': protocolEditMode
              ? '0px'
              : sidebarCollapsed || userRole === 'hall'
                ? '4rem'
                : '16rem',
          } as React.CSSProperties
        }
      >
        {/* Sidebar - Mobile Overlay */}
        {sidebarOpen && !protocolEditMode && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - fixed height, never scrolls */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 inset-y-0 left-0 z-50 h-screen bg-card border-r border-border/50 transition-all duration-300 flex-shrink-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            sidebarCollapsed || userRole === 'hall' ? 'lg:w-16' : 'w-52',
            protocolEditMode && 'hidden',
          )}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Logo */}
            <div
              className={cn(
                'border-b border-border/50 flex items-center justify-center',
                sidebarCollapsed || userRole === 'hall' ? 'p-3' : 'py-2 px-3',
              )}
            >
              <button
                onClick={() => {
                  if (userRole === 'hall') {
                    const hallRole = roles.find((r) => r.role === 'hall');
                    const hallSegment = hallRole?.hall_id || '1';
                    navigate(
                      adminBasePath ? `/admin/halls/${hallSegment}` : `/halls/${hallSegment}`,
                    );
                  } else {
                    setCurrentView('calendar');
                  }
                }}
                className={cn(
                  'flex items-center cursor-pointer hover:opacity-80 transition-opacity',
                  sidebarCollapsed || userRole === 'hall' ? 'justify-center' : 'gap-3',
                )}
              >
                {instanceData?.logo_url && (
                  <img
                    src={instanceData.logo_url}
                    alt={instanceData.name}
                    className={cn(
                      'object-contain shrink-0 bg-white',

                      sidebarCollapsed || userRole === 'hall' ? 'w-10 h-10' : 'max-h-8',
                    )}
                  />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav
              className={cn(
                'flex-1 space-y-2',
                sidebarCollapsed || userRole === 'hall' ? 'p-2' : 'p-4',
              )}
            >
              {/* Hall role: simplified menu - only Halls and Protocols */}
              {userRole === 'hall' ? (
                <>
                  {/* Halls - always visible for hall role */}
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-center px-2',
                      currentView === 'halls' && 'bg-sidebar-accent text-sidebar-accent-foreground',
                    )}
                    onClick={() => {
                      setSidebarOpen(false);
                      navigate(adminBasePath ? '/admin/halls/1' : '/halls/1');
                    }}
                    title={t('navigation.halls')}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                  </Button>
                  {/* Protocols */}
                  {hasFeature('vehicle_reception_protocol') && (
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-center px-2',
                        currentView === 'protocols' &&
                          'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                      onClick={() => {
                        setSidebarOpen(false);
                        setCurrentView('protocols');
                      }}
                      title="Protokoły"
                    >
                      <ClipboardCheck className="w-4 h-4 shrink-0" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Full navigation for admin/employee */}
                  {/* 1. Kalendarz */}
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full gap-3',
                      sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                      currentView === 'calendar' &&
                        'bg-sidebar-accent text-sidebar-accent-foreground',
                    )}
                    onClick={() => {
                      setSidebarOpen(false);
                      setCurrentView('calendar');
                    }}
                    title="Kalendarz"
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && 'Kalendarz'}
                  </Button>
                  {/* 2. Rezerwacje */}
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full gap-3',
                      sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                      currentView === 'reservations' &&
                        'bg-sidebar-accent text-sidebar-accent-foreground',
                    )}
                    onClick={() => {
                      setSidebarOpen(false);
                      setCurrentView('reservations');
                    }}
                    title="Realizacje"
                  >
                    <div className="relative">
                      <ListChecks className="w-4 h-4 shrink-0" />
                      {sidebarCollapsed && pendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">Realizacje</span>
                        {pendingCount > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 text-xs font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">
                            {pendingCount}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                  {/* 3. Oferty */}
                  {hasFeature('offers') && (
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full gap-3',
                        sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                        currentView === 'offers' &&
                          'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                      onClick={() => {
                        setSidebarOpen(false);
                        setCurrentView('offers');
                      }}
                      title="Oferty"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && 'Oferty'}
                    </Button>
                  )}
                  {/* 4. Protokoły */}
                  {hasFeature('vehicle_reception_protocol') && (
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full gap-3',
                        sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                        currentView === 'protocols' &&
                          'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                      onClick={() => {
                        setSidebarOpen(false);
                        setCurrentView('protocols');
                      }}
                      title="Protokoły"
                    >
                      <ClipboardCheck className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && 'Protokoły'}
                    </Button>
                  )}
                  {/* 5. Klienci */}
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full gap-3',
                      sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                      currentView === 'customers' &&
                        'bg-sidebar-accent text-sidebar-accent-foreground',
                    )}
                    onClick={() => {
                      setSidebarOpen(false);
                      setCurrentView('customers');
                    }}
                    title="Klienci"
                  >
                    <UserCircle className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && 'Klienci'}
                  </Button>
                  {/* 6. Pracownicy - admin only */}
                  {userRole !== 'employee' && (
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full gap-3',
                        sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                        currentView === 'employees' &&
                          'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                      onClick={() => {
                        setSidebarOpen(false);
                        setCurrentView('employees');
                      }}
                      title="Pracownicy"
                    >
                      <UsersRound className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && 'Pracownicy'}
                    </Button>
                  )}
                  {/* 7. Usługi - admin only */}
                  {userRole !== 'employee' && (
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full gap-3',
                        sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                        currentView === 'pricelist' &&
                          'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                      onClick={() => {
                        setSidebarOpen(false);
                        setCurrentView('pricelist');
                      }}
                      title="Usługi"
                    >
                      <BadgeDollarSign className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && 'Usługi'}
                    </Button>
                  )}
                  {/* 8. Powiadomienia - ukryte */}
                  {/* AI Analyst - hidden until env vars deployed */}
                  {/* {hasFeature('ai_analyst') && (
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full gap-3',
                        sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                        currentView === 'ai_analyst' &&
                          'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                      onClick={() => {
                        setSidebarOpen(false);
                        setCurrentView('ai_analyst');
                      }}
                      title="Asystent AI"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && 'Asystent AI'}
                    </Button>
                  )} */}
                  {/* 9. Ustawienia - admin only, always last */}
                  {userRole !== 'employee' && (
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full gap-3',
                        sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                        currentView === 'settings' &&
                          'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                      onClick={() => {
                        setSidebarOpen(false);
                        setCurrentView('settings');
                      }}
                      title="Ustawienia"
                    >
                      <Settings className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && 'Ustawienia'}
                    </Button>
                  )}
                </>
              )}
            </nav>

            {/* Sales CRM switch button — restricted to Kaja for now */}
            {hasFeature('sales_crm') &&
              roles.some((r) => r.role === 'sales') &&
              username === 'Kaja' && (
                <div className={cn(sidebarCollapsed ? 'px-1 pb-1' : 'px-3 pb-1')}>
                  <Separator className="mb-2" />
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full gap-3',
                      sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                    )}
                    onClick={() => navigate(adminBasePath + '/sales-crm')}
                    title="Przejdź do Panelu Sprzedaży"
                  >
                    <ArrowLeftRight className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && 'Panel Sprzedaży'}
                  </Button>
                </div>
              )}

            {/* Collapse toggle & User menu */}
            <div
              className={cn(
                sidebarCollapsed || userRole === 'hall' ? 'p-2 space-y-2' : 'p-4 space-y-3',
              )}
            >
              {/* Collapse button - desktop only, hidden for hall role */}
              {userRole !== 'hall' && (
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full text-muted-foreground hidden lg:flex gap-3',
                    sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
                  )}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="w-4 h-4 shrink-0" />
                  ) : (
                    <>
                      <PanelLeftClose className="w-4 h-4 shrink-0" />
                      Zwiń menu
                    </>
                  )}
                </Button>
              )}

              {/* Divider between collapse button and user menu */}
              {!(sidebarCollapsed || userRole === 'hall') && (
                <Separator className="my-3 -mx-4 w-[calc(100%+2rem)] bg-border/30" />
              )}

              {/* Email -> dropdown (logout) - For hall role always show icon only */}
              {sidebarCollapsed || userRole === 'hall' ? (
                <Button
                  variant="ghost"
                  className="w-full justify-center px-2 text-muted-foreground"
                  onClick={handleLogout}
                  title="Wyloguj się"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                </Button>
              ) : (
                user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-muted-foreground px-3 h-auto py-2"
                      >
                        <span className="text-sm truncate">{username || user.email}</span>
                        <ChevronUp className="w-4 h-4 shrink-0 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56">
                      <DropdownMenuItem onClick={handleLogout} className="gap-2">
                        <LogOut className="w-4 h-4" />
                        Wyloguj się
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              )}
            </div>
          </div>
        </aside>

        {/* Main Content - scrollable */}
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Content */}
          <div
            className={cn(
              'flex-1 overflow-auto',
              currentView === 'ai_analyst'
                ? 'flex flex-col p-0'
                : cn(
                    'space-y-6 pb-28 lg:pb-8',
                    currentView === 'calendar' ? 'p-0 lg:p-4 lg:pt-0' : 'p-4',
                  ),
            )}
          >
            {/* Free Time Ranges Per Station - Hidden on desktop, shown via bottom sheet on mobile */}

            {/* View Content */}
            {currentView === 'calendar' && (
              <div className="flex-1 min-h-[600px] h-full relative flex">
                <div className="flex-1 min-w-0 transition-[min-width] duration-300 ease-in-out">
                  <AdminCalendar
                    stations={stations}
                    reservations={reservations}
                    breaks={breaks}
                    closedDays={closedDays}
                    workingHours={workingHours}
                    onReservationClick={handleReservationClick}
                    onAddReservation={handleAddReservation}
                    onAddBreak={handleAddBreak}
                    onDeleteBreak={handleDeleteBreak}
                    onToggleClosedDay={handleToggleClosedDay}
                    onReservationMove={handleReservationMove}
                    onConfirmReservation={handleConfirmReservation}
                    onYardVehicleDrop={handleYardVehicleDrop}
                    onDateChange={handleCalendarDateChange}
                    instanceId={instanceId || undefined}
                    yardVehicleCount={yardVehicleCount}
                    selectedReservationId={selectedReservation?.id || editingReservation?.id}
                    slotPreview={slotPreview}
                    activeDateRange={
                      (addReservationOpen || addReservationV2Open) && newReservationData.date
                        ? {
                            from: newReservationData.date,
                            to: newReservationData.endDate || newReservationData.date,
                          }
                        : null
                    }
                    isLoadingMore={isLoadingMoreReservations}
                    employees={cachedEmployees}
                    stationEmployeesMap={stationEmployeesMap}
                    showEmployeesOnStations={
                      instanceSettings?.assign_employees_to_stations ?? false
                    }
                    showEmployeesOnReservations={
                      instanceSettings?.assign_employees_to_reservations ?? false
                    }
                    trainings={trainings}
                    onTrainingClick={handleTrainingClick}
                    trainingsEnabled={trainingsEnabled}
                    forceCompact={!isMobile && (addReservationOpen || addReservationV2Open)}
                    onLoadMore={(direction) => {
                      if (direction === 'past') {
                        const pastDate = new Date(loadedDateRange.from);
                        pastDate.setMonth(pastDate.getMonth() - 3);
                        checkAndLoadMore(format(pastDate, 'yyyy-MM-dd'));
                      } else {
                        const futureDate = new Date(loadedDateRange.to || new Date());
                        futureDate.setMonth(futureDate.getMonth() + 3);
                        checkAndLoadMore(format(futureDate, 'yyyy-MM-dd'));
                      }
                    }}
                  />
                </div>
                {/* Inline reservation drawer on desktop — animated slide */}
                {!isMobile && instanceId && (
                  <div
                    className={cn(
                      'shrink-0 border-l border-border h-full overflow-hidden transition-[width,opacity] duration-300 ease-in-out will-change-[width,opacity]',
                      addReservationOpen || addReservationV2Open
                        ? 'w-[27rem] opacity-100'
                        : 'w-0 opacity-0 border-l-0',
                    )}
                  >
                    <div className="w-[27rem] h-full">
                      <AddReservationDialogV2
                        inline
                        open={addReservationOpen || addReservationV2Open}
                        onClose={() => {
                          setAddReservationOpen(false);
                          setAddReservationV2Open(false);
                          setEditingReservation(null);
                          setSlotPreview(null);
                          setSelectedReservation(null);
                        }}
                        onSlotPreviewChange={handleSlotPreviewChange}
                        instanceId={instanceId}
                        onSuccess={handleReservationAdded}
                        workingHours={workingHours}
                        mode="reservation"
                        stationId={newReservationData.stationId}
                        initialDate={newReservationData.date}
                        initialEndDate={newReservationData.endDate}
                        initialTime={newReservationData.time}
                        initialStationId={newReservationData.stationId}
                        editingReservation={
                          editingReservation
                            ? {
                                id: editingReservation.id,
                                customer_name: editingReservation.customer_name,
                                customer_phone: editingReservation.customer_phone,
                                vehicle_plate: editingReservation.vehicle_plate,
                                car_size: (editingReservation as any).car_size || null,
                                reservation_date: editingReservation.reservation_date,
                                end_date: editingReservation.end_date,
                                start_time: editingReservation.start_time,
                                end_time: editingReservation.end_time,
                                station_id: editingReservation.station_id,
                                service_ids: editingReservation.service_ids,
                                service_id: (editingReservation as any).service_id,
                                service_items: editingReservation.service_items,
                                admin_notes: (editingReservation as any).admin_notes,
                                price: editingReservation.price,
                                offer_number: editingReservation.offer_number,
                                has_unified_services: editingReservation.has_unified_services,
                                assigned_employee_ids: editingReservation.assigned_employee_ids,
                              }
                            : null
                        }
                        currentUsername={username}
                        trainingsEnabled={trainingsEnabled}
                        onSwitchToTraining={handleSwitchToTraining}
                      />
                    </div>
                  </div>
                )}

                {/* FAB removed - plus button is now in MobileBottomNav */}
              </div>
            )}

            {currentView === 'reservations' && (
              <ReservationsView
                reservations={reservations}
                allServices={allServices}
                onReservationClick={handleReservationClick}
                onConfirmReservation={handleConfirmReservation}
                onRejectReservation={handleRejectReservation}
                trainings={trainings}
                trainingsEnabled={trainingsEnabled}
                onTrainingClick={handleTrainingClick}
                onDeleteTraining={async (id) => {
                  const { error } = await supabase.from('trainings').delete().eq('id', id);
                  if (!error) {
                    fetchTrainings();
                  }
                }}
                employees={cachedEmployees}
                onOpenReservation={handleOpenReservationById}
                onRequestAllHistory={() => expandDateRange(new Date('2020-01-01'))}
              />
            )}

            {currentView === 'customers' && (
              <CustomersView
                instanceId={instanceId}
                onOpenReservation={handleOpenReservationById}
              />
            )}

            {currentView === 'pricelist' && instanceId && (
              <div className="max-w-3xl mx-auto">
                <PriceListSettings instanceId={instanceId} />
              </div>
            )}

            {currentView === 'settings' && (
              <SettingsView
                instanceId={instanceId}
                instanceData={instanceData}
                onInstanceUpdate={() =>
                  queryClient.invalidateQueries({ queryKey: ['instance_data', instanceId] })
                }
                onWorkingHoursUpdate={() =>
                  queryClient.invalidateQueries({ queryKey: ['working_hours', instanceId] })
                }
              />
            )}

            {currentView === 'offers' && (
              <OffersView
                instanceId={instanceId}
                instanceData={instanceData}
                onEditModeChange={setOfferEditMode}
                initialCustomerData={offerPrefill}
                onReserveFromOffer={(offerData) => {
                  setCurrentView('calendar');
                  setNewReservationData({ stationId: '', date: '', time: '', stationType: '' });
                  setEditingReservation(offerData);
                  setAddReservationV2Open(true);
                }}
              />
            )}

            {currentView === 'products' && <ProductsView instanceId={instanceId} />}

            {currentView === 'followup' && <FollowUpView instanceId={instanceId} />}

            {currentView === 'notifications' && (
              <NotificationsView
                instanceId={instanceId}
                onNavigateBack={() => setCurrentView('calendar')}
                onNavigateToOffers={() => setCurrentView('offers')}
                onNavigateToReservations={() => setCurrentView('reservations')}
                onReservationClick={handleReservationClick}
                onNotificationsChange={fetchUnreadNotificationsCount}
              />
            )}

            {/* Halls view removed - now in Settings */}

            {currentView === 'protocols' && instanceId && (
              <ProtocolsView instanceId={instanceId} onEditModeChange={setProtocolEditMode} />
            )}

            {currentView === 'reminders' && instanceId && (
              <RemindersView
                instanceId={instanceId}
                onNavigateBack={() => setCurrentView('pricelist')}
              />
            )}

            {currentView === 'ai_analyst' && instanceId && <AiAnalystTab instanceId={instanceId} />}

            {currentView === 'employees' && instanceId && <EmployeesView instanceId={instanceId} />}
          </div>
        </main>
      </div>

      {/* Reservation Details Drawer */}
      <ReservationDetailsDrawer
        reservation={selectedReservation}
        open={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onDelete={handleDeleteReservation}
        onEdit={handleEditReservation}
        onNoShow={handleNoShow}
        onConfirm={async (id) => {
          await handleConfirmReservation(id);
          setSelectedReservation(null);
        }}
        onStartWork={async (id) => {
          await handleStartWork(id);
          setSelectedReservation(null);
        }}
        onEndWork={async (id) => {
          await handleEndWork(id);
          setSelectedReservation(null);
        }}
        onRelease={async (id) => {
          await handleReleaseVehicle(id);
          setSelectedReservation(null);
        }}
        onRevertToConfirmed={async (id) => {
          await handleRevertToConfirmed(id);
          setSelectedReservation(null);
        }}
        onRevertToInProgress={async (id) => {
          await handleRevertToInProgress(id);
          setSelectedReservation(null);
        }}
        onApproveChangeRequest={async (id) => {
          await handleApproveChangeRequest(id);
          setSelectedReservation(null);
        }}
        onRejectChangeRequest={async (id) => {
          await handleRejectChangeRequest(id);
          setSelectedReservation(null);
        }}
        onStatusChange={async (id, status) => {
          await handleStatusChange(id, status);
          setSelectedReservation(null);
        }}
        onSendPickupSms={handleSendPickupSms}
        onSendConfirmationSms={handleSendConfirmationSms}
        onCreateOffer={(data) => {
          setSelectedReservation(null);
          setOfferPrefill(data);
          setCurrentView('offers');
        }}
      />

      {/* Add/Edit Reservation Dialog V2 — Sheet mode for mobile or non-calendar views */}
      {instanceId && (isMobile || currentView !== 'calendar') && (
        <AddReservationDialogV2
          open={addReservationOpen || addReservationV2Open}
          onClose={() => {
            setAddReservationOpen(false);
            setAddReservationV2Open(false);
            setEditingReservation(null);
            setSlotPreview(null);
            setSelectedReservation(null);
          }}
          onSlotPreviewChange={handleSlotPreviewChange}
          instanceId={instanceId}
          onSuccess={handleReservationAdded}
          workingHours={workingHours}
          mode="reservation"
          stationId={newReservationData.stationId}
          initialDate={newReservationData.date}
          initialTime={newReservationData.time}
          initialStationId={newReservationData.stationId}
          editingReservation={
            editingReservation
              ? {
                  id: editingReservation.id,
                  customer_name: editingReservation.customer_name,
                  customer_phone: editingReservation.customer_phone,
                  vehicle_plate: editingReservation.vehicle_plate,
                  car_size: (editingReservation as any).car_size || null,
                  reservation_date: editingReservation.reservation_date,
                  end_date: editingReservation.end_date,
                  start_time: editingReservation.start_time,
                  end_time: editingReservation.end_time,
                  station_id: editingReservation.station_id,
                  service_ids: editingReservation.service_ids,
                  service_id: (editingReservation as any).service_id,
                  service_items: editingReservation.service_items,
                  admin_notes: (editingReservation as any).admin_notes,
                  price: editingReservation.price,
                  offer_number: editingReservation.offer_number,
                  has_unified_services: editingReservation.has_unified_services,
                  assigned_employee_ids: editingReservation.assigned_employee_ids,
                }
              : null
          }
          currentUsername={username}
          trainingsEnabled={trainingsEnabled}
          onSwitchToTraining={handleSwitchToTraining}
        />
      )}

      {/* Add Training Drawer */}
      {instanceId && trainingsEnabled && (
        <AddTrainingDrawer
          open={addTrainingOpen}
          onClose={() => {
            setAddTrainingOpen(false);
            setEditingTraining(null);
          }}
          instanceId={instanceId}
          onSuccess={() => {
            fetchTrainings();
            setEditingTraining(null);
          }}
          editingTraining={editingTraining}
          currentUsername={username}
          initialDate={newReservationData.date}
          initialTime={newReservationData.time}
          initialStationId={newReservationData.stationId}
        />
      )}

      {/* Training Details Drawer */}
      {instanceId && trainingsEnabled && selectedTraining && (
        <TrainingDetailsDrawer
          open={trainingDetailsOpen}
          onClose={() => {
            setTrainingDetailsOpen(false);
            setSelectedTraining(null);
          }}
          training={selectedTraining}
          instanceId={instanceId}
          onEdit={(training) => {
            setTrainingDetailsOpen(false);
            setEditingTraining(training);
            setAddTrainingOpen(true);
          }}
          onDeleted={() => {
            setTrainingDetailsOpen(false);
            setSelectedTraining(null);
            setTrainings((prev) => prev.filter((t) => t.id !== selectedTraining.id));
          }}
          onStatusChanged={(trainingId, newStatus) => {
            setTrainings((prev) =>
              prev.map((t) => (t.id === trainingId ? { ...t, status: newStatus } : t)),
            );
          }}
        />
      )}

      {/* Add Break Dialog */}
      {instanceId && (
        <AddBreakDialog
          open={addBreakOpen}
          onOpenChange={setAddBreakOpen}
          instanceId={instanceId}
          stations={stations}
          initialData={newBreakData}
          onBreakAdded={handleBreakAdded}
        />
      )}

      <InstanceSettingsDialog
        open={instanceSettingsOpen}
        onOpenChange={setInstanceSettingsOpen}
        instance={instanceData}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['instance_data', instanceId] });
        }}
      />

      {/* Mobile Bottom Navigation - hidden when editing protocols or offers */}
      {!protocolEditMode && !offerEditMode && (
        <MobileBottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
          onAddReservation={handleQuickAddReservation}
          onLogout={handleLogout}
          unreadNotificationsCount={unreadNotificationsCount}
          offersEnabled={hasFeature('offers')}
          followupEnabled={hasFeature('followup')}
          hallViewEnabled={hasFeature('hall_view')}
          protocolsEnabled={hasFeature('vehicle_reception_protocol')}
          userRole={userRole}
          currentVersion={currentVersion}
          salesCrmEnabled={
            hasFeature('sales_crm') && roles.some((r) => r.role === 'sales') && username === 'Kaja'
          }
          onSwitchToSalesCrm={() => navigate(adminBasePath + '/sales-crm')}
        />
      )}
    </>
  );
};
export default AdminDashboard;
