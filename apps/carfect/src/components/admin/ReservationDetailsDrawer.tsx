import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  User,
  Phone,
  Car,
  Clock,
  Loader2,
  Trash2,
  Pencil,
  MessageSquare,
  PhoneCall,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  Receipt,
  History,
  FileText,
  ExternalLink,
  MoreVertical,
  Camera,
  Plus,
  Users,
  UserX,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneDisplay, normalizePhone } from '@shared/utils';
import { useIsMobile } from '@shared/ui';
import { useInstanceSettings } from '@/hooks/useInstanceSettings';
import { useEmployees } from '@/hooks/useEmployees';
import { usePricingMode } from '@/hooks/usePricingMode';
import { useAdminNotes } from '@/hooks/useAdminNotes';
import { useEmployeeAssignment } from '@/hooks/useEmployeeAssignment';
import { useServiceManagement } from '@/hooks/useServiceManagement';
import { bruttoToNetto } from '@/utils/pricing';
import SendSmsDialog from '@/components/admin/SendSmsDialog';
import { ReservationHistoryDrawer } from './history/ReservationHistoryDrawer';
import CustomerEditDrawer from './CustomerEditDrawer';
import ReservationPhotosDialog from './ReservationPhotosDialog';
import ReservationPhotosSection from './ReservationPhotosSection';
import ServiceSelectionDrawer from './ServiceSelectionDrawer';
import { EmployeeSelectionDrawer } from './EmployeeSelectionDrawer';
import { AssignedEmployeesChips } from './AssignedEmployeesChips';
import { Button } from '@shared/ui';
import { Badge } from '@shared/ui';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@shared/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/ui';
import type { Reservation, CarSize } from '@/types/reservation';
import { formatTime, getStatusBadge, getSourceLabel } from '@/lib/reservationDisplay';
import { triggerReservationPhotoUpload } from '@/lib/reservationPhotoUpload';

export interface HallVisibleFields {
  customer_name: boolean;
  customer_phone: boolean;
  vehicle_plate: boolean;
  services: boolean;
  admin_notes: boolean;
}

export interface HallAllowedActions {
  add_services: boolean;
  change_time: boolean;
  change_station: boolean;
  edit_reservation: boolean;
  delete_reservation: boolean;
}

export interface HallConfig {
  visible_fields: HallVisibleFields;
  allowed_actions: HallAllowedActions;
}

interface ReservationDetailsDrawerProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (
    reservationId: string,
    customerData: { name: string; phone: string; email?: string; instance_id: string },
  ) => void;
  onEdit?: (reservation: Reservation) => void;
  onNoShow?: (reservationId: string) => void;
  onConfirm?: (reservationId: string) => void;
  onStartWork?: (reservationId: string) => void;
  onEndWork?: (reservationId: string) => void;
  onRelease?: (reservationId: string) => void;
  onRevertToConfirmed?: (reservationId: string) => void;
  onRevertToInProgress?: (reservationId: string) => void;
  onApproveChangeRequest?: (reservationId: string) => void;
  onRejectChangeRequest?: (reservationId: string) => void;
  onSendPickupSms?: (reservationId: string) => Promise<void>;
  onSendConfirmationSms?: (reservationId: string) => Promise<void>;
  onStatusChange?: (reservationId: string, newStatus: string) => Promise<void>;
  onCreateOffer?: (data: { name: string; phone: string; plate: string }) => void;
  // Hall mode props
  mode?: 'admin' | 'hall';
  hallConfig?: HallConfig;
}

const ReservationDetailsDrawer = ({
  reservation,
  open,
  onClose,
  onDelete,
  onEdit,
  onNoShow,
  onConfirm,
  onStartWork,
  onEndWork,
  onRelease,
  onRevertToConfirmed,
  onRevertToInProgress,
  onApproveChangeRequest,
  onRejectChangeRequest,
  onSendPickupSms,
  onSendConfirmationSms,
  onStatusChange,
  onCreateOffer,
  mode = 'admin',
  hallConfig,
}: ReservationDetailsDrawerProps) => {
  const isHallMode = mode === 'hall';
  const pricingMode = usePricingMode(reservation?.instance_id ?? null);
  const visibleFields = hallConfig?.visible_fields;
  const allowedActions = hallConfig?.allowed_actions;

  // In hall mode, check allowed_actions for edit/delete visibility
  const canEditInHallMode = isHallMode && allowedActions?.edit_reservation;
  const canDeleteInHallMode = isHallMode && allowedActions?.delete_reservation;
  const showEdit = !isHallMode || canEditInHallMode;
  const showDelete = !isHallMode || canDeleteInHallMode;

  const { t } = useTranslation();
  const {
    adminNotes,
    setAdminNotes,
    customerNotes,
    editingNotes,
    savingNotes,
    notesTextareaRef,
    startEditingNotes,
    handleNotesBlur,
    handleSaveAdminNotes,
  } = useAdminNotes({
    reservationId: reservation?.id ?? null,
    initialAdminNotes: reservation?.admin_notes || '',
    initialCustomerNotes: reservation?.customer_notes || '',
  });
  const [deleting, setDeleting] = useState(false);
  const [markingNoShow, setMarkingNoShow] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [startingWork, setStartingWork] = useState(false);
  const [endingWork, setEndingWork] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [approvingChange, setApprovingChange] = useState(false);
  const [rejectingChange, setRejectingChange] = useState(false);
  const [inProgressDropdownOpen, setInProgressDropdownOpen] = useState(false);
  const [completedDropdownOpen, setCompletedDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [releasedDropdownOpen, setReleasedDropdownOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [sendingPickupSms, setSendingPickupSms] = useState(false);
  const [sendingConfirmationSms, setSendingConfirmationSms] = useState(false);
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [reservationPhotos, setReservationPhotos] = useState<string[]>([]);
  // Service management (add/remove services)
  const {
    savingService,
    serviceDrawerOpen,
    setServiceDrawerOpen,
    handleRemoveService,
    handleConfirmServices,
  } = useServiceManagement({
    reservationId: reservation?.id || null,
    currentServiceIds: reservation?.service_ids || [],
    currentServiceItems: reservation?.service_items || null,
  });
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    notes: string | null;
    company?: string | null;
    nip?: string | null;
    source?: string;
  } | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const adminBasePath = location.pathname.startsWith('/admin') ? '/admin' : '';

  // Employee assignment feature
  const { data: instanceSettings } = useInstanceSettings(reservation?.instance_id ?? null);
  const showEmployeeAssignment = instanceSettings?.assign_employees_to_reservations ?? false;
  const showStatus = instanceSettings?.show_reservation_status ?? false;
  const { data: employees = [] } = useEmployees(reservation?.instance_id ?? null);
  const {
    localAssignedEmployeeIds,
    setLocalAssignedEmployeeIds,
    savingEmployees,
    employeeDrawerOpen,
    setEmployeeDrawerOpen,
    handleEmployeeSelect,
    handleRemoveEmployee,
  } = useEmployeeAssignment({
    reservationId: reservation?.id ?? null,
    initialEmployeeIds: reservation?.assigned_employee_ids || [],
  });

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carSize, setCarSize] = useState<CarSize | ''>('');
  const [price, setPrice] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [offerPublicToken, setOfferPublicToken] = useState<string | null>(null);

  useEffect(() => {
    if (reservation) {
      setCustomerName(reservation.customer_name || '');
      setCustomerPhone(reservation.customer_phone || '');
      setCarModel(reservation.vehicle_plate || '');
      setCarSize(reservation.car_size || '');
      setPrice(reservation.price?.toString() || '');
      setStartTime(reservation.start_time || '');
      setEndTime(reservation.end_time || '');
      setReservationPhotos(reservation.photo_urls || []);

      // Fetch offer public_token if offer_number exists
      if (reservation.offer_number) {
        supabase
          .from('offers')
          .select('public_token')
          .eq('offer_number', reservation.offer_number)
          .eq('instance_id', reservation.instance_id)
          .maybeSingle()
          .then(({ data }) => {
            setOfferPublicToken(data?.public_token || null);
          });
      } else {
        setOfferPublicToken(null);
      }
    }
  }, [reservation]);

  // Find customer email for protocol navigation
  const findCustomerEmail = async (phone: string, instanceId: string): Promise<string | null> => {
    const normalizedPhone = normalizePhone(phone);

    // 1. Check customers table
    const { data: customer } = await supabase
      .from('customers')
      .select('email')
      .eq('instance_id', instanceId)
      .or(`phone.eq.${normalizedPhone},phone.eq.+48${normalizedPhone}`)
      .maybeSingle();

    if (customer?.email) return customer.email;

    // 2. Check offers table
    const { data: offers } = await supabase
      .from('offers')
      .select('customer_data')
      .eq('instance_id', instanceId)
      .not('customer_data', 'is', null)
      .limit(10);

    for (const offer of offers || []) {
      const customerData = offer.customer_data as { phone?: string; email?: string } | null;
      if (normalizePhone(customerData?.phone) === normalizedPhone && customerData?.email) {
        return customerData.email;
      }
    }

    return null;
  };

  // Check if protocol exists for this reservation
  const [existingProtocolId, setExistingProtocolId] = useState<string | null>(null);
  useEffect(() => {
    if (!reservation?.id) {
      setExistingProtocolId(null);
      return;
    }
    const checkProtocol = async () => {
      const { data } = await supabase
        .from('vehicle_protocols')
        .select('id')
        .eq('reservation_id', reservation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setExistingProtocolId(data?.id ?? null);
    };
    checkProtocol();
  }, [reservation?.id]);

  // Navigate to protocol form with reservation data
  const handleAddProtocol = async () => {
    if (!reservation) return;

    const email = await findCustomerEmail(reservation.customer_phone, reservation.instance_id);

    const params = new URLSearchParams({
      action: 'new',
      reservationId: reservation.id,
      customerName: reservation.customer_name || '',
      customerPhone: reservation.customer_phone || '',
      vehiclePlate: reservation.vehicle_plate || '',
    });

    if (email) {
      params.set('email', email);
    }

    navigate(`${adminBasePath}/protocols?${params.toString()}`);
    onClose();
  };

  // Navigate to edit existing protocol
  const handleEditProtocol = () => {
    if (!existingProtocolId) return;
    const params = new URLSearchParams({
      action: 'edit',
      protocolId: existingProtocolId,
    });
    navigate(`${adminBasePath}/protocols?${params.toString()}`);
    onClose();
  };

  const handleEdit = () => {
    if (!reservation || !onEdit) return;

    // Ensure the edit drawer receives the exact same employee state the user sees here
    onEdit({
      ...reservation,
      assigned_employee_ids: localAssignedEmployeeIds,
    });

    // Don't close here - let AdminDashboard handle closing both drawers after save
  };

  const handleDelete = async () => {
    if (!reservation || !onDelete) return;

    setDeleting(true);
    try {
      await onDelete(reservation.id, {
        name: customerName,
        phone: customerPhone,
        email: reservation.customer_email,
        instance_id: reservation.instance_id,
      });
      setDeleteDialogOpen(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleNoShow = async () => {
    if (!reservation || !onNoShow) return;

    setMarkingNoShow(true);
    try {
      await onNoShow(reservation.id);
      setNoShowDialogOpen(false);
      setDeleteDialogOpen(false);
      onClose();
    } finally {
      setMarkingNoShow(false);
    }
  };

  const handleCall = () => {
    if (customerPhone) {
      window.location.href = `tel:${customerPhone}`;
    }
  };

  const handleSMS = () => {
    if (customerPhone) {
      if (isMobile) {
        window.location.href = `sms:${customerPhone}`;
      } else {
        setSmsDialogOpen(true);
      }
    }
  };

  const handleOpenCustomerDrawer = async () => {
    if (!reservation?.instance_id || !customerPhone) return;

    const normalizedPhone = normalizePhone(customerPhone);

    // Search for customer by phone
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, phone, email, notes, company, nip, source, discount_percent')
      .eq('instance_id', reservation.instance_id)
      .or(`phone.eq.${normalizedPhone},phone.eq.+48${normalizedPhone}`)
      .maybeSingle();

    if (customer) {
      setSelectedCustomer(customer);
    } else {
      // Create minimal customer object from reservation data
      setSelectedCustomer({
        id: '',
        name: customerName || '',
        phone: normalizedPhone,
        email: reservation.customer_email || null,
        notes: null,
        company: null,
        nip: null,
        source: 'reservation',
      });
    }
    setCustomerDrawerOpen(true);
  };

  if (!reservation) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose} modal={false}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[27rem] flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.2)] bg-white"
          hideCloseButton
          hideOverlay
          // Keep drawer open; allow clicking calendar behind
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={onClose}
        >
          {/* Header with time/date and X button */}
          <SheetHeader className="flex-shrink-0 border-b pb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                  <span className="font-semibold whitespace-nowrap">
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </span>
                  <span className="text-muted-foreground font-normal hidden sm:inline">•</span>
                  <span className="font-normal text-muted-foreground sm:text-foreground">
                    {reservation.end_date && reservation.end_date !== reservation.reservation_date
                      ? `${format(new Date(reservation.reservation_date), 'd MMM', { locale: pl })} - ${format(new Date(reservation.end_date), 'd MMM yyyy', { locale: pl })}`
                      : format(new Date(reservation.reservation_date), 'd MMMM yyyy', {
                          locale: pl,
                        })}
                  </span>
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-2 flex-wrap">
                  {showStatus && getStatusBadge(reservation.status, t)}
                  {getSourceLabel(reservation.source, reservation.created_by_username, t)}
                  {!isHallMode && reservation.confirmation_code && (
                    <Badge variant="outline" className="text-xs font-normal font-mono">
                      #{reservation.confirmation_code}
                    </Badge>
                  )}
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-hover transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </SheetHeader>

          {/* Content area - scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4">
            {/* Customer info row - hide in hall mode if not configured */}
            {(!isHallMode || visibleFields?.customer_name) && (
              <div className="flex items-center justify-between">
                <div>
                  <div>
                    <div className="text-xs text-foreground">{t('reservations.customer')}</div>
                    <button
                      type="button"
                      onClick={handleOpenCustomerDrawer}
                      className="font-medium text-left hover:text-primary hover:underline transition-colors cursor-pointer"
                    >
                      {customerName}
                    </button>
                  </div>
                </div>
                {/* Contact buttons - hide in hall mode if phone not visible */}
                {(!isHallMode || visibleFields?.customer_phone) && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={handleCall}
                      title={t('common.call')}
                    >
                      <PhoneCall className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={handleSMS}
                      title={t('common.sendSms')}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Phone - hide in hall mode if not configured */}
            {(!isHallMode || visibleFields?.customer_phone) && (
              <div>
                <div>
                  <div className="text-xs text-foreground">{t('common.phone')}</div>
                  <div className="font-medium">{formatPhoneDisplay(customerPhone)}</div>
                </div>
              </div>
            )}

            {/* Car model - vehicle_plate is always visible */}
            {carModel && (
              <div>
                <div>
                  <div className="text-xs text-foreground">{t('reservations.car')}</div>
                  <div className="font-medium">{carModel}</div>
                </div>
              </div>
            )}

            {/* Protocol link — visible when protocol exists */}
            {existingProtocolId && !isHallMode && (
              <button
                type="button"
                onClick={handleEditProtocol}
                className="flex items-center gap-2 p-2.5 bg-primary/10 rounded-lg text-sm font-medium text-primary hover:bg-primary/20 transition-colors w-full"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Protokół przyjęcia pojazdu</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            )}

            {/* Car size warning if missing */}
            {!carSize && reservation.status === 'pending' && (
              <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/30 rounded-lg text-warning text-sm">
                <Car className="w-4 h-4 shrink-0" />
                <span>{t('reservations.carSizeRequiredWarning')}</span>
              </div>
            )}

            {/* Services - quick edit with pills */}
            {!isHallMode || visibleFields?.services ? (
              <div className="flex-1">
                <div>
                  <div className="text-xs text-foreground">{t('reservations.services')}</div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {/* Existing services with X button */}
                    {reservation.services_data && reservation.services_data.length > 0 ? (
                      reservation.services_data.map((svc, idx) => (
                        <span
                          key={svc.id || idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground/80 text-background rounded-full text-sm font-medium"
                        >
                          {svc.name}
                          {svc.id && (
                            <button
                              type="button"
                              onClick={() => handleRemoveService(svc.id!)}
                              disabled={savingService}
                              className="hover:bg-foreground/10 rounded-full p-0.5 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                      ))
                    ) : reservation.service ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground/80 text-background rounded-full text-sm font-medium">
                        {reservation.service.name}
                      </span>
                    ) : null}

                    {/* Add button - same style as employee Add */}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setServiceDrawerOpen(true)}
                      disabled={savingService}
                    >
                      {savingService ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {t('common.add')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Assigned Employees section - shown when feature is enabled */}
            {showEmployeeAssignment && !isHallMode && (
              <div className="flex-1">
                <div>
                  <div className="text-xs text-foreground">Przypisani pracownicy</div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {/* Employee chips - same style as services */}
                    {localAssignedEmployeeIds.map((empId) => {
                      const emp = employees.find((e) => e.id === empId);
                      const name = emp?.name || 'Usunięty';
                      return (
                        <span
                          key={empId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground/80 text-background rounded-full text-sm font-medium"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(empId)}
                            disabled={savingEmployees}
                            className="hover:bg-foreground/10 rounded-full p-0.5 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}

                    {/* Add button - same style as services Add */}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEmployeeDrawerOpen(true)}
                      disabled={savingEmployees}
                    >
                      {savingEmployees ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Dodaj
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Kwota (Price) section with expandable receipt */}
            {(() => {
              // Get custom price from service_items if available
              const getCustomPrice = (serviceId: string | undefined): number | null => {
                if (!serviceId || !reservation.service_items) return null;
                const item = reservation.service_items.find((si) => si.service_id === serviceId);
                return item?.custom_price ?? null;
              };

              // Calculate base price for a service based on car size
              const getServicePrice = (svc: {
                id?: string;
                price_small?: number | null;
                price_medium?: number | null;
                price_large?: number | null;
                price_from?: number | null;
              }) => {
                // First check if there's a custom price
                const customPrice = getCustomPrice(svc.id);
                if (customPrice !== null) return customPrice;

                // Otherwise use base price by car size
                if (carSize === 'small' && svc.price_small) return svc.price_small;
                if (carSize === 'medium' && svc.price_medium) return svc.price_medium;
                if (carSize === 'large' && svc.price_large) return svc.price_large;
                return svc.price_from || 0;
              };

              const servicesWithPrices =
                reservation.services_data?.map((svc) => ({
                  name: svc.name,
                  price: getServicePrice(svc),
                })) || [];

              const calculatedTotal = servicesWithPrices.reduce((sum, svc) => sum + svc.price, 0);
              const bruttoTotal = price ? parseFloat(price) : calculatedTotal;
              const nettoTotal = reservation.price_netto ?? bruttoToNetto(bruttoTotal);
              const displayTotal = pricingMode === 'netto' ? nettoTotal : bruttoTotal;

              if (displayTotal <= 0 && servicesWithPrices.length === 0) return null;

              const hasMultipleServices = servicesWithPrices.length > 1;

              return (
                <div className="flex-1">
                  <div>
                    <div className="text-xs text-foreground">
                      {pricingMode === 'netto' ? 'Kwota netto' : 'Kwota brutto'}
                    </div>
                    <div className="font-semibold text-lg">{displayTotal} zł</div>
                    <div className="text-xs text-muted-foreground">
                      {pricingMode === 'netto'
                        ? `${bruttoTotal} zł brutto`
                        : `${Number(nettoTotal).toFixed(2)} zł netto`}
                    </div>

                    {hasMultipleServices && (
                      <button
                        onClick={() => setPriceDetailsOpen(!priceDetailsOpen)}
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        {priceDetailsOpen ? t('common.hide') : t('addReservation.seeDetails')}
                        {priceDetailsOpen ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    {priceDetailsOpen && hasMultipleServices && (
                      <ul className="mt-3 space-y-1">
                        {servicesWithPrices.map((svc, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{svc.name}</span>
                            <span className="font-medium">{svc.price} zł</span>
                          </li>
                        ))}
                        <li className="border-t border-border pt-2 mt-2 flex justify-between text-sm font-semibold">
                          <span>{t('common.total')}</span>
                          <span>{calculatedTotal} zł</span>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Offer link - show only if offer_number and public_token exist */}
            {!isHallMode && reservation.offer_number && offerPublicToken && (
              <div className="flex-1">
                <div>
                  <div className="text-xs text-foreground">Oferta</div>
                  <a
                    href={`/offers/${offerPublicToken}?admin=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    #{reservation.offer_number}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Customer Notes - hide in hall mode if notes not configured */}
            {(!isHallMode || visibleFields?.admin_notes) && customerNotes && (
              <div className="border-t border-border/30 pt-3">
                <div className="text-xs text-foreground mb-1">
                  {t('reservations.customerNotes')}
                </div>
                <div className="text-sm whitespace-pre-wrap bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                  {customerNotes}
                </div>
              </div>
            )}

            {/* Admin Notes - inline editable */}
            {(!isHallMode || visibleFields?.admin_notes) && (
              <div className="border-t border-border/30 pt-3">
                <div className="text-xs text-foreground mb-1">{t('reservations.adminNotes')}</div>
                {editingNotes ? (
                  <div className="relative -mx-0.5 px-0.5">
                    <textarea
                      ref={notesTextareaRef}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      onBlur={handleNotesBlur}
                      disabled={savingNotes}
                      rows={3}
                      className="w-full text-sm p-2 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      placeholder="Wpisz notatki wewnętrzne..."
                    />
                    {savingNotes && (
                      <div className="absolute right-2 top-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={startEditingNotes}
                    className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-hover-strong p-2 -mx-2 rounded transition-colors min-h-[2.5rem]"
                  >
                    {adminNotes || (
                      <span className="text-muted-foreground italic">
                        Brak notatek wewnętrznych
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Change request info - show original reservation reference */}
            {reservation.status === 'change_requested' && reservation.original_reservation && (
              <div className="border-t border-border/30 pt-3 mt-3">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                    <RotateCcw className="w-4 h-4" />
                    {t('myReservation.changeRequestFrom')}
                  </div>
                  <div className="text-sm text-orange-600 space-y-1">
                    <div className="flex justify-between">
                      <span>{t('common.date')}</span>
                      <span className="font-medium">
                        {format(
                          new Date(reservation.original_reservation.reservation_date),
                          'd MMMM yyyy',
                          { locale: pl },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('common.time')}</span>
                      <span className="font-medium">
                        {reservation.original_reservation.start_time?.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('reservations.reservationCode')}</span>
                      <span className="font-mono font-bold text-orange-700">
                        {reservation.original_reservation.confirmation_code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with actions - pinned at bottom */}
          <div className="flex-shrink-0 border-t pt-4 space-y-2">
            {/* Change requested: Approve and Reject actions */}
            {reservation.status === 'change_requested' && (
              <div className="flex gap-2">
                {onRejectChangeRequest && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={async () => {
                      setRejectingChange(true);
                      try {
                        await onRejectChangeRequest(reservation.id);
                        onClose();
                      } finally {
                        setRejectingChange(false);
                      }
                    }}
                    disabled={rejectingChange || approvingChange}
                  >
                    {rejectingChange ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {t('myReservation.rejectChange')}
                  </Button>
                )}

                {onApproveChangeRequest && (
                  <Button
                    className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground"
                    onClick={async () => {
                      setApprovingChange(true);
                      try {
                        await onApproveChangeRequest(reservation.id);
                        onClose();
                      } finally {
                        setApprovingChange(false);
                      }
                    }}
                    disabled={approvingChange || rejectingChange}
                  >
                    {approvingChange ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {t('myReservation.approveChange')}
                  </Button>
                )}
              </div>
            )}
            {/* Link: Wyślij SMS o potwierdzeniu - dla confirmed i pending */}
            {['confirmed', 'pending'].includes(reservation.status) && onSendConfirmationSms && (
              <div className="mb-2">
                {reservation.confirmation_sms_sent_at && (
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600" />
                    {t('reservations.smsSentAt', {
                      datetime: format(
                        new Date(reservation.confirmation_sms_sent_at),
                        'dd.MM.yyyy HH:mm',
                        { locale: pl },
                      ),
                    })}
                  </div>
                )}
                <button
                  onClick={async () => {
                    setSendingConfirmationSms(true);
                    try {
                      await onSendConfirmationSms(reservation.id);
                    } finally {
                      setSendingConfirmationSms(false);
                    }
                  }}
                  disabled={sendingConfirmationSms}
                  className="flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline text-sm disabled:opacity-50"
                >
                  {sendingConfirmationSms ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  {reservation.confirmation_sms_sent_at
                    ? t('reservations.sendConfirmationSmsAgain', {
                        time: reservation.start_time.slice(0, 5),
                      })
                    : t('reservations.sendConfirmationSms')}
                </button>
              </div>
            )}

            {/* Link: Wyślij SMS o odbiorze - nad Edit dla in_progress, completed */}
            {['in_progress', 'completed'].includes(reservation.status) && onSendPickupSms && (
              <div className="mb-2">
                {reservation.pickup_sms_sent_at && (
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600" />
                    {t('reservations.smsSentAt', {
                      datetime: format(
                        new Date(reservation.pickup_sms_sent_at),
                        'dd.MM.yyyy HH:mm',
                        { locale: pl },
                      ),
                    })}
                  </div>
                )}
                <button
                  onClick={async () => {
                    setSendingPickupSms(true);
                    try {
                      await onSendPickupSms(reservation.id);
                    } finally {
                      setSendingPickupSms(false);
                    }
                  }}
                  disabled={sendingPickupSms}
                  className="flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline text-sm disabled:opacity-50"
                >
                  {sendingPickupSms ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  {reservation.pickup_sms_sent_at
                    ? t('reservations.sendPickupSmsAgain')
                    : t('reservations.sendPickupSms')}
                </button>
              </div>
            )}

            {/* Photos section - only in admin mode */}
            {!isHallMode && reservationPhotos.length > 0 && (
              <ReservationPhotosSection
                photos={reservationPhotos}
                reservationId={reservation.id}
                onPhotosUpdated={setReservationPhotos}
              />
            )}

            {/* Row 1: Edit and Actions Menu for confirmed, in_progress, completed */}
            {(reservation.status === 'confirmed' ||
              reservation.status === 'in_progress' ||
              reservation.status === 'completed') &&
              (showEdit || showDelete) && (
                <div className="flex gap-2">
                  {showEdit && onEdit && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 bg-white dark:bg-card"
                      onClick={handleEdit}
                    >
                      <Pencil className="w-4 h-4" />
                      {t('common.edit')}
                    </Button>
                  )}

                  {/* Actions dropdown menu - only in admin mode */}
                  {!isHallMode && (
                    <DropdownMenu open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-white dark:bg-card"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48"
                        sideOffset={5}
                        collisionPadding={16}
                        avoidCollisions
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setActionsMenuOpen(false);
                            triggerReservationPhotoUpload({
                              reservationId: reservation.id,
                              currentPhotos: reservationPhotos,
                              onPhotosUpdated: setReservationPhotos,
                            });
                          }}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Dodaj zdjęcia
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setActionsMenuOpen(false);
                            if (existingProtocolId) {
                              handleEditProtocol();
                            } else {
                              handleAddProtocol();
                            }
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {existingProtocolId ? 'Edytuj protokół' : 'Dodaj protokół'}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setActionsMenuOpen(false);
                            setHistoryDrawerOpen(true);
                          }}
                        >
                          <History className="w-4 h-4 mr-2" />
                          Zobacz historię
                        </DropdownMenuItem>

                        {onCreateOffer && reservation && (
                          <DropdownMenuItem
                            onClick={() => {
                              setActionsMenuOpen(false);
                              onCreateOffer({
                                name: reservation.customer_name,
                                phone: reservation.customer_phone,
                                plate: reservation.vehicle_plate,
                              });
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Przygotuj ofertę
                          </DropdownMenuItem>
                        )}

                        {onNoShow && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-warning-foreground focus:text-warning-foreground"
                              onClick={() => {
                                setActionsMenuOpen(false);
                                setNoShowDialogOpen(true);
                              }}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Oznacz jako nieobecny
                            </DropdownMenuItem>
                          </>
                        )}
                        {showDelete && onDelete && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setActionsMenuOpen(false);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('reservations.confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('reservations.confirmDeleteDescription', {
                      name: customerName,
                      phone: customerPhone,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {t('reservations.yesDelete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* No-show confirmation dialog */}
            <AlertDialog open={noShowDialogOpen} onOpenChange={setNoShowDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Oznacz jako nieobecny</AlertDialogTitle>
                  <AlertDialogDescription>
                    Czy na pewno chcesz oznaczyć klienta {customerName} ({customerPhone}) jako
                    nieobecnego?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleNoShow}
                    className="bg-warning text-warning-foreground hover:bg-warning/90"
                    disabled={markingNoShow}
                  >
                    {markingNoShow ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {t('reservations.markAsNoShow')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Pending: Edit and Actions Menu */}
            {reservation.status === 'pending' && showEdit && (
              <div className="flex gap-2">
                {showEdit && onEdit && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-white dark:bg-card"
                    onClick={handleEdit}
                  >
                    <Pencil className="w-4 h-4" />
                    {t('common.edit')}
                  </Button>
                )}
                {/* Actions dropdown menu for pending - only in admin mode */}
                {!isHallMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 bg-white dark:bg-card"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48"
                      sideOffset={5}
                      collisionPadding={16}
                      avoidCollisions
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          triggerReservationPhotoUpload({
                            reservationId: reservation.id,
                            currentPhotos: reservationPhotos,
                            onPhotosUpdated: setReservationPhotos,
                          });
                        }}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Dodaj zdjęcia
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setHistoryDrawerOpen(true)}>
                        <History className="w-4 h-4 mr-2" />
                        Zobacz historię
                      </DropdownMenuItem>
                      {onCreateOffer && reservation && (
                        <DropdownMenuItem
                          onClick={() => {
                            onCreateOffer({
                              name: reservation.customer_name,
                              phone: reservation.customer_phone,
                              plate: reservation.vehicle_plate,
                            });
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Przygotuj ofertę
                        </DropdownMenuItem>
                      )}
                      {onNoShow && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-warning-foreground focus:text-warning-foreground"
                            onClick={() => setNoShowDialogOpen(true)}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Oznacz jako nieobecny
                          </DropdownMenuItem>
                        </>
                      )}
                      {showDelete && onDelete && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Usuń
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}

            {/* Pending: Reject and Confirm */}
            {reservation.status === 'pending' && (
              <div className="flex gap-2">
                {showDelete && onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={deleting}
                      >
                        {deleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {t('reservations.reject')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('reservations.confirmRejectTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('reservations.confirmRejectDescription', {
                            name: customerName,
                            phone: customerPhone,
                          })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.no')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('reservations.yesReject')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {onConfirm && (
                  <Button
                    className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground"
                    onClick={async () => {
                      if (!carSize) {
                        handleEdit();
                        return;
                      }
                      setConfirming(true);
                      try {
                        await onConfirm(reservation.id);
                      } finally {
                        setConfirming(false);
                      }
                    }}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {t('common.confirm')}
                  </Button>
                )}
              </div>
            )}

            {/* Confirmed: Start Work with dropdown for all statuses */}
            {showStatus && reservation.status === 'confirmed' && onStartWork && (
              <div className="flex gap-0">
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-r-none"
                  onClick={async () => {
                    setStartingWork(true);
                    try {
                      await onStartWork(reservation.id);
                    } finally {
                      setStartingWork(false);
                    }
                  }}
                  disabled={startingWork || changingStatus}
                >
                  {startingWork ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {t('reservations.startWork')}
                </Button>

                {onStatusChange && (
                  <Popover open={statusDropdownOpen} onOpenChange={setStatusDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        className="px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-l-none border-l border-emerald-500"
                        disabled={startingWork || changingStatus}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-1 bg-background border shadow-lg z-50"
                      align="end"
                    >
                      {['in_progress', 'completed'].map((status) => (
                        <Button
                          key={status}
                          variant="ghost"
                          className="w-full justify-start gap-2 text-sm"
                          onClick={async () => {
                            setStatusDropdownOpen(false);
                            setChangingStatus(true);
                            try {
                              await onStatusChange(reservation.id, status);
                            } finally {
                              setChangingStatus(false);
                            }
                          }}
                          disabled={changingStatus}
                        >
                          {changingStatus ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          {t(
                            `reservations.statuses.${status === 'in_progress' ? 'inProgress' : status}`,
                          )}
                        </Button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {/* In Progress: End Work with dropdown for all statuses */}
            {showStatus && reservation.status === 'in_progress' && onEndWork && (
              <div className="flex gap-0">
                <Button
                  className="flex-1 gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-r-none"
                  onClick={async () => {
                    setEndingWork(true);
                    try {
                      await onEndWork(reservation.id);
                    } finally {
                      setEndingWork(false);
                    }
                  }}
                  disabled={endingWork || changingStatus}
                >
                  {endingWork ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {t('reservations.endWork')}
                </Button>

                {onStatusChange && (
                  <Popover open={inProgressDropdownOpen} onOpenChange={setInProgressDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        className="px-2 bg-sky-500 hover:bg-sky-600 text-white rounded-l-none border-l border-sky-400"
                        disabled={endingWork || changingStatus}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-1 bg-background border shadow-lg z-50"
                      align="end"
                    >
                      {['confirmed', 'completed'].map((status) => (
                        <Button
                          key={status}
                          variant="ghost"
                          className="w-full justify-start gap-2 text-sm"
                          onClick={async () => {
                            setInProgressDropdownOpen(false);
                            setChangingStatus(true);
                            try {
                              await onStatusChange(reservation.id, status);
                            } finally {
                              setChangingStatus(false);
                            }
                          }}
                          disabled={changingStatus}
                        >
                          {changingStatus ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          {t(`reservations.statuses.${status}`)}
                        </Button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {/* Completed: Status change dropdown only (completed is now final status) */}
            {showStatus && reservation.status === 'completed' && onStatusChange && (
              <div className="flex gap-0">
                <Button variant="outline" className="flex-1 gap-2 rounded-r-none" disabled>
                  <Check className="w-4 h-4" />
                  {t('reservations.statuses.completed')}
                </Button>

                <Popover open={completedDropdownOpen} onOpenChange={setCompletedDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="px-2 rounded-l-none border-l-0"
                      disabled={changingStatus}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-56 p-1 bg-background border shadow-lg z-50"
                    align="end"
                  >
                    {['confirmed', 'in_progress'].map((status) => (
                      <Button
                        key={status}
                        variant="ghost"
                        className="w-full justify-start gap-2 text-sm"
                        onClick={async () => {
                          setCompletedDropdownOpen(false);
                          setChangingStatus(true);
                          try {
                            await onStatusChange(reservation.id, status);
                          } finally {
                            setChangingStatus(false);
                          }
                        }}
                        disabled={changingStatus}
                      >
                        {changingStatus ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        {t(
                          `reservations.statuses.${status === 'in_progress' ? 'inProgress' : status}`,
                        )}
                      </Button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SendSmsDialog
        phone={customerPhone}
        customerName={customerName}
        instanceId={reservation?.instance_id || null}
        open={smsDialogOpen}
        onClose={() => setSmsDialogOpen(false)}
      />

      {/* Reservation History Drawer */}
      <ReservationHistoryDrawer
        reservationId={reservation?.id || null}
        instanceId={reservation?.instance_id || ''}
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        hasUnifiedServices={reservation?.has_unified_services ?? true}
      />

      {/* Customer Details Drawer */}
      <CustomerEditDrawer
        customer={selectedCustomer}
        instanceId={reservation?.instance_id || null}
        open={customerDrawerOpen}
        onClose={() => setCustomerDrawerOpen(false)}
      />

      {/* Reservation Photos Dialog */}
      {reservation && (
        <ReservationPhotosDialog
          open={photosDialogOpen}
          onClose={() => setPhotosDialogOpen(false)}
          reservationId={reservation.id}
          currentPhotos={reservationPhotos}
          onPhotosUpdated={setReservationPhotos}
        />
      )}

      {/* Quick Service Selection Drawer */}
      <ServiceSelectionDrawer
        open={serviceDrawerOpen}
        onClose={() => setServiceDrawerOpen(false)}
        instanceId={reservation?.instance_id || ''}
        carSize={carSize || 'medium'}
        selectedServiceIds={reservation?.service_ids || []}
        hasUnifiedServices={reservation?.has_unified_services ?? true}
        hideSelectedSection={true}
        onConfirm={handleConfirmServices}
      />

      {/* Employee Selection Drawer */}
      <EmployeeSelectionDrawer
        open={employeeDrawerOpen}
        onOpenChange={setEmployeeDrawerOpen}
        instanceId={reservation?.instance_id || ''}
        selectedEmployeeIds={localAssignedEmployeeIds}
        onSelect={handleEmployeeSelect}
      />
    </>
  );
};

export default ReservationDetailsDrawer;
