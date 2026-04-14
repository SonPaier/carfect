import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import {
  Search,
  Phone,
  MessageSquare,
  Check,
  Trash2,
  Calendar,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
} from 'lucide-react';
import { normalizeSearchQuery, formatPhoneDisplay } from '@shared/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/ui';
import { Input } from '@shared/ui';
import { Button } from '@shared/ui';
import { Badge } from '@shared/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, PaginationFooter } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { EmptyState, useIsMobile } from '@shared/ui';
import { cn } from '@/lib/utils';
import ServiceTag from './ServiceTag';
import CustomerEditDrawer from './CustomerEditDrawer';
import { supabase } from '@/integrations/supabase/client';
import { CreateInvoiceDrawer, useInvoicingSettings } from '@shared/invoicing';
import { FileText } from 'lucide-react';
import type { Training } from './AddTrainingDrawer';
import { useInstanceFeatures } from '@/hooks/useInstanceFeatures';
import { useInstanceSettings } from '@/hooks/useInstanceSettings';
import type { Reservation } from '@/types/reservation';

interface Service {
  id: string;
  name: string;
  shortcut?: string | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  company?: string | null;
  nip?: string | null;
  address?: string | null;
  source?: string;
}

interface Employee {
  id: string;
  name: string;
  active: boolean;
}

// Unified item for sorting/grouping
interface ListItem {
  type: 'reservation' | 'training';
  date: string;
  start_time: string;
  data: Reservation | Training;
}

interface ReservationsViewProps {
  reservations: Reservation[];
  allServices: Service[];
  onReservationClick: (reservation: Reservation) => void;
  onConfirmReservation: (reservationId: string) => void;
  onRejectReservation: (reservationId: string) => void;
  trainings?: Training[];
  trainingsEnabled?: boolean;
  onTrainingClick?: (training: Training) => void;
  onDeleteTraining?: (trainingId: string) => void;
  employees?: Employee[];
  onOpenReservation?: (reservationId: string) => void;
  onRequestAllHistory?: () => void;
}

type TabValue = 'all' | 'reservations' | 'trainings';
type SortField = 'customer_name' | 'vehicle_plate' | 'reservation_date' | 'price' | 'status';
type SortDirection = 'asc' | 'desc';

const DEBOUNCE_MS = 300;

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Oczekuje', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: {
    label: 'Potwierdzona',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  in_progress: { label: 'W trakcie', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  completed: { label: 'Zakończona', className: 'bg-slate-100 text-slate-800 border-slate-200' },
  cancelled: { label: 'Anulowana', className: 'bg-red-100 text-red-800 border-red-200' },
  change_requested: { label: 'Zmiana', className: 'bg-red-100 text-red-800 border-red-200' },
  no_show: { label: 'Nieobecność', className: 'bg-slate-100 text-slate-800 border-slate-200' },
  released: { label: 'Zwolniona', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const ReservationsView = ({
  reservations,
  allServices,
  onReservationClick,
  onConfirmReservation,
  onRejectReservation,
  trainings = [],
  trainingsEnabled = false,
  onTrainingClick,
  onDeleteTraining,
  employees = [],
  onOpenReservation,
  onRequestAllHistory,
}: ReservationsViewProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Request full history once
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (!historyLoadedRef.current) {
      historyLoadedRef.current = true;
      onRequestAllHistory?.();
    }
  }, []);
  const instanceId = reservations[0]?.instance_id ?? null;
  const { settings: invoicingSettings } = useInvoicingSettings(instanceId, supabase);
  const invoicingActive = invoicingSettings?.active ?? false;
  const { hasFeature } = useInstanceFeatures(instanceId);
  const { data: instanceSettings } = useInstanceSettings(instanceId);
  const showStatus = instanceSettings?.show_reservation_status ?? false;

  const formatDisplayPrice = (r: Reservation) => {
    if (r.price == null) return '—';
    return (
      <div>
        <div className="font-medium">{Number(r.price).toFixed(2)} zł</div>
        {r.price_netto != null && (
          <div className="text-xs text-muted-foreground">
            {Number(r.price_netto).toFixed(2)} zł netto
          </div>
        )}
      </div>
    );
  };

  // Invoice drawer state
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState<Reservation | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const activeTab: TabValue = 'all';
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reservationToReject, setReservationToReject] = useState<Reservation | null>(null);
  const [deleteTrainingDialogOpen, setDeleteTrainingDialogOpen] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<Training | null>(null);

  // Customer drawer state
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('reservation_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const scrollToTop = useCallback(() => {
    tableRef.current?.scrollTo({ top: 0 });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    scrollToTop();
  }, [scrollToTop]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    scrollToTop();
  }, [scrollToTop]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const emp of employees) {
      map.set(emp.id, emp.name);
    }
    return map;
  }, [employees]);

  // VIN lookup maps for search (plate→vin + phone→vins)
  const { data: vinMaps } = useQuery({
    queryKey: ['vin_search_maps', instanceId],
    queryFn: async () => {
      if (!instanceId)
        return { byPlate: new Map<string, string>(), byPhone: new Map<string, string[]>() };
      const { data } = await supabase
        .from('customer_vehicles')
        .select('plate, phone, vin')
        .eq('instance_id', instanceId)
        .not('vin', 'is', null);
      const byPlate = new Map<string, string>();
      const byPhone = new Map<string, string[]>();
      for (const row of data || []) {
        if (!row.vin) continue;
        const vinLower = row.vin.toLowerCase();
        if (row.plate) byPlate.set(row.plate.toLowerCase(), vinLower);
        if (row.phone) {
          const existing = byPhone.get(row.phone) || [];
          existing.push(vinLower);
          byPhone.set(row.phone, existing);
        }
      }
      return { byPlate, byPhone };
    },
    enabled: !!instanceId,
    staleTime: 5 * 60 * 1000,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Reset page when sort or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection, statusFilter]);

  // Build unified list items (all reservations, not just future)
  const allItems = useMemo(() => {
    const reservationItems: ListItem[] = reservations.map((r) => ({
      type: 'reservation' as const,
      date: r.reservation_date,
      start_time: r.start_time,
      data: r,
    }));

    const trainingItems: ListItem[] = trainings.map((tr) => ({
      type: 'training' as const,
      date: tr.start_date,
      start_time: tr.start_time,
      data: tr,
    }));

    return [...reservationItems, ...trainingItems];
  }, [reservations, trainings]);

  // Filter by tab
  const tabFiltered = useMemo(() => {
    switch (activeTab) {
      case 'reservations':
        return allItems.filter((i) => i.type === 'reservation');
      case 'trainings':
        return allItems.filter((i) => i.type === 'training');
      default:
        return allItems;
    }
  }, [allItems, activeTab]);

  // Search filter
  const searchFiltered = useMemo(() => {
    if (!debouncedQuery.trim()) return tabFiltered;
    const query = debouncedQuery.toLowerCase().trim();
    const normalizedQuery = normalizeSearchQuery(query);

    return tabFiltered.filter((item) => {
      if (item.type === 'reservation') {
        const r = item.data as Reservation;
        const employeeNames =
          r.assigned_employee_ids && Array.isArray(r.assigned_employee_ids)
            ? (r.assigned_employee_ids as string[])
                .map((id) => employeeMap.get(id)?.toLowerCase() || '')
                .join(' ')
            : '';
        const serviceNames = (r.services_data || (r.service ? [r.service] : []))
          .map((s) => s.name.toLowerCase())
          .join(' ');
        const vinByPlate = r.vehicle_plate
          ? vinMaps?.byPlate.get(r.vehicle_plate.toLowerCase())
          : undefined;
        const vinsByPhone = r.customer_phone ? vinMaps?.byPhone.get(r.customer_phone) : undefined;
        const vinMatch = vinByPlate?.includes(query) || vinsByPhone?.some((v) => v.includes(query));
        return (
          (r.confirmation_code &&
            normalizeSearchQuery(r.confirmation_code).toLowerCase().includes(normalizedQuery)) ||
          r.customer_name?.toLowerCase().includes(query) ||
          (r.customer_phone && normalizeSearchQuery(r.customer_phone).includes(normalizedQuery)) ||
          r.vehicle_plate?.toLowerCase().includes(query) ||
          vinMatch ||
          employeeNames.includes(query) ||
          serviceNames.includes(query)
        );
      } else {
        const tr = item.data as Training;
        const trEmployeeNames =
          tr.assigned_employee_ids && Array.isArray(tr.assigned_employee_ids)
            ? (tr.assigned_employee_ids as string[])
                .map((id) => employeeMap.get(id)?.toLowerCase() || '')
                .join(' ')
            : '';
        return (
          tr.title?.toLowerCase().includes(query) ||
          tr.training_type?.toLowerCase().includes(query) ||
          trEmployeeNames.includes(query)
        );
      }
    });
  }, [tabFiltered, debouncedQuery, employeeMap, vinMaps]);

  // Status filter
  const statusFiltered = useMemo(() => {
    if (statusFilter === 'all') return searchFiltered;
    return searchFiltered.filter((item) => {
      if (item.type === 'reservation') {
        return (item.data as Reservation).status === statusFilter;
      }
      return false;
    });
  }, [searchFiltered, statusFilter]);

  // Sorted items
  const sortedItems = useMemo(() => {
    return [...statusFiltered].sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortField === 'reservation_date') {
        aVal = a.date + (a.start_time || '');
        bVal = b.date + (b.start_time || '');
      } else if (sortField === 'customer_name') {
        aVal =
          a.type === 'reservation'
            ? (a.data as Reservation).customer_name || ''
            : (a.data as Training).title || '';
        bVal =
          b.type === 'reservation'
            ? (b.data as Reservation).customer_name || ''
            : (b.data as Training).title || '';
      } else if (sortField === 'vehicle_plate') {
        aVal = a.type === 'reservation' ? (a.data as Reservation).vehicle_plate || '' : '';
        bVal = b.type === 'reservation' ? (b.data as Reservation).vehicle_plate || '' : '';
      } else if (sortField === 'price') {
        const aPrice = a.type === 'reservation' ? ((a.data as Reservation).price ?? -1) : -1;
        const bPrice = b.type === 'reservation' ? ((b.data as Reservation).price ?? -1) : -1;
        return sortDirection === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      } else if (sortField === 'status') {
        aVal = a.type === 'reservation' ? (a.data as Reservation).status || '' : '';
        bVal = b.type === 'reservation' ? (b.data as Reservation).status || '' : '';
      }

      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [statusFiltered, sortField, sortDirection]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));

  const handleRejectClick = (e: React.MouseEvent, reservation: Reservation) => {
    e.stopPropagation();
    setReservationToReject(reservation);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (reservationToReject) {
      onRejectReservation(reservationToReject.id);
      setRejectDialogOpen(false);
      setReservationToReject(null);
    }
  };

  const handleCancelReject = () => {
    setRejectDialogOpen(false);
    setReservationToReject(null);
  };

  const handleDeleteTrainingClick = (e: React.MouseEvent, training: Training) => {
    e.stopPropagation();
    setTrainingToDelete(training);
    setDeleteTrainingDialogOpen(true);
  };

  const handleConfirmDeleteTraining = () => {
    if (trainingToDelete && onDeleteTraining) {
      onDeleteTraining(trainingToDelete.id);
      setDeleteTrainingDialogOpen(false);
      setTrainingToDelete(null);
    }
  };

  const handleCustomerClick = async (e: React.MouseEvent, reservation: Reservation) => {
    e.stopPropagation();

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('instance_id', reservation.instance_id)
      .eq('phone', reservation.customer_phone)
      .maybeSingle();

    if (customer) {
      setSelectedCustomer(customer);
    } else {
      setSelectedCustomer({
        id: '',
        name: reservation.customer_name,
        phone: reservation.customer_phone,
        email: null,
        notes: null,
      });
    }
    setSelectedInstanceId(reservation.instance_id);
    setCustomerDrawerOpen(true);
  };

  const getEmployeeNames = (ids: string[]) => {
    return ids
      .map((id) => employeeMap.get(id))
      .filter(Boolean)
      .join(', ');
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => {
    const isActive = sortField === field;
    return (
      <TableHead
        className={cn('cursor-pointer select-none whitespace-nowrap', className)}
        onClick={() => handleSortClick(field)}
      >
        <span className="flex items-center gap-1">
          {children}
          {isActive &&
            (sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
            ))}
        </span>
      </TableHead>
    );
  };

  const renderStatusBadge = (status: string) => {
    const cfg = statusConfig[status];
    if (!cfg) return <Badge variant="outline">{status}</Badge>;
    return (
      <Badge variant="outline" className={cn('text-xs border', cfg.className)}>
        {cfg.label}
      </Badge>
    );
  };

  const renderServices = (reservation: Reservation) => {
    const services =
      reservation.services_data || (reservation.service ? [reservation.service] : []);
    if (services.length === 0) return <span className="text-muted-foreground">—</span>;

    const firstName = services[0].name;
    const rest = services.slice(1);

    if (rest.length === 0) {
      return <span className="text-sm">{firstName}</span>;
    }

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-sm text-left">
              {firstName}
              <span className="text-muted-foreground">, +{rest.length}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            {rest.map((s, i) => (
              <div key={i}>{s.name}</div>
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderDate = (item: ListItem) => {
    const dateStr = item.date;
    const parsedDate = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isUpcoming = parsedDate >= today;

    const timeStr = item.start_time ? `, ${item.start_time.slice(0, 5)}` : '';
    const formatted = format(parsedDate, 'dd.MM.yyyy') + (isUpcoming ? timeStr : '');

    if (item.type === 'reservation') {
      const r = item.data as Reservation;
      const endDate = r.end_date;
      if (endDate && endDate !== dateStr) {
        const parsedEnd = parseISO(endDate);
        const endTimeStr = isUpcoming && r.end_time ? `, ${r.end_time.slice(0, 5)}` : '';
        const endFormatted = format(parsedEnd, 'dd.MM.yyyy') + endTimeStr;
        return (
          <div className="whitespace-nowrap">
            <div>{formatted}</div>
            <div className="text-xs text-muted-foreground">{endFormatted}</div>
          </div>
        );
      }
    }
    return <div className="whitespace-nowrap">{formatted}</div>;
  };

  const renderReservationActions = (reservation: Reservation) => {
    const isPending = reservation.status === 'pending' || !reservation.status;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {isPending && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onConfirmReservation(reservation.id);
              }}
            >
              <Check className="w-4 h-4 mr-2 text-green-600" />
              {t('common.confirm')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a href={`sms:${reservation.customer_phone}`} onClick={(e) => e.stopPropagation()}>
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`tel:${reservation.customer_phone}`} onClick={(e) => e.stopPropagation()}>
              <Phone className="w-4 h-4 mr-2" />
              {t('common.call')}
            </a>
          </DropdownMenuItem>
          {invoicingActive && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setInvoiceTarget(reservation);
                setInvoiceDrawerOpen(true);
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Wystaw FV
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => handleRejectClick(e, reservation)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('reservations.rejectReservation')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderTrainingActions = (training: Training) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => handleDeleteTrainingClick(e, training)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('trainings.deleteTraining')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className={isMobile ? 'space-y-4 pb-28' : 'flex flex-col h-[calc(100vh-80px)]'}>
      {/* Title */}
      <div className="shrink-0 pb-4">
        <h1 className="text-2xl font-medium text-foreground">Realizacje</h1>
      </div>
      <div id="hint-infobox-slot" className="flex flex-col gap-4 shrink-0" />

      {/* Search + status filter */}
      <div className={cn(
        'shrink-0 pb-4',
        isMobile && 'sticky top-0 z-20 bg-background -mx-4 px-4'
      )}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={
                hasFeature('vehicle_vin')
                  ? t('reservations.searchPlaceholder') + ', VIN...'
                  : t('reservations.searchPlaceholder')
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {showStatus && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                {Object.entries(statusConfig)
                  .filter(
                    ([key]) =>
                      !['pending', 'change_requested', 'released', 'cancelled'].includes(key),
                  )
                  .map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content */}
      {sortedItems.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('reservations.noReservations')}
          description={
            debouncedQuery ? t('reservations.noSearchResults') : t('reservations.noUpcoming')
          }
        />
      ) : (
        <div ref={tableRef} className={isMobile ? undefined : 'overflow-auto flex-1 min-h-0 rounded-lg border border-border/50 bg-white'}>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table wrapperClassName="overflow-visible">
              <TableHeader>
                <TableRow>
                  <SortableHeader field="customer_name">Klient</SortableHeader>
                  <SortableHeader field="vehicle_plate">Pojazd</SortableHeader>
                  <TableHead>Usługi</TableHead>
                  <SortableHeader field="reservation_date">Data realizacji</SortableHeader>
                  <SortableHeader field="price" className="text-right">
                    Cena brutto / netto
                  </SortableHeader>
                  {showStatus && <SortableHeader field="status">Status</SortableHeader>}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => {
                  if (item.type === 'reservation') {
                    const r = item.data as Reservation;
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-hover"
                        onClick={() => onReservationClick(r)}
                      >
                        <TableCell>
                          <div>
                            <button
                              className="font-medium text-primary hover:underline text-sm text-left"
                              onClick={(e) => handleCustomerClick(e, r)}
                            >
                              {r.customer_name}
                            </button>
                            {r.customer_phone && (
                              <div className="text-xs text-muted-foreground">
                                {formatPhoneDisplay(r.customer_phone)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium">{r.vehicle_plate || '—'}</span>
                        </TableCell>
                        <TableCell>{renderServices(r)}</TableCell>
                        <TableCell>{renderDate(item)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatDisplayPrice(r)}
                        </TableCell>
                        {showStatus && <TableCell>{renderStatusBadge(r.status)}</TableCell>}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {renderReservationActions(r)}
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    const tr = item.data as Training;
                    const assignedNames = getEmployeeNames(tr.assigned_employee_ids || []);
                    return (
                      <TableRow
                        key={tr.id}
                        className="cursor-pointer hover:bg-hover"
                        onClick={() => onTrainingClick?.(tr)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-violet-600 shrink-0" />
                            <div className="font-medium">{tr.title}</div>
                          </div>
                          {assignedNames && (
                            <div className="text-xs text-muted-foreground">{assignedNames}</div>
                          )}
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>
                          <ServiceTag
                            name={
                              tr.status === 'sold_out'
                                ? t('trainings.statusSoldOut')
                                : t('trainings.statusOpen')
                            }
                            shortcut={null}
                          />
                        </TableCell>
                        <TableCell>{renderDate(item)}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {renderTrainingActions(tr)}
                        </TableCell>
                      </TableRow>
                    );
                  }
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {paginatedItems.map((item) => {
              if (item.type === 'reservation') {
                const r = item.data as Reservation;
                return (
                  <div
                    key={r.id}
                    className="border border-border/50 rounded-xl p-4 cursor-pointer hover:bg-hover bg-white space-y-2"
                    onClick={() => onReservationClick(r)}
                  >
                    {/* Top row: status + plate */}
                    <div className="flex items-center justify-between">
                      {showStatus && renderStatusBadge(r.status)}
                      <span className="font-medium text-sm shrink-0">{r.vehicle_plate}</span>
                    </div>
                    {/* Customer */}
                    <div>
                      <button
                        className="font-medium text-primary hover:underline text-sm text-left"
                        onClick={(e) => handleCustomerClick(e, r)}
                      >
                        {r.customer_name}
                      </button>
                      {r.customer_phone && (
                        <div className="text-xs text-muted-foreground">
                          {formatPhoneDisplay(r.customer_phone)}
                        </div>
                      )}
                    </div>
                    {/* Services + price */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">{renderServices(r)}</div>
                      <div className="text-right shrink-0">{formatDisplayPrice(r)}</div>
                    </div>
                    {/* Date + actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(r.reservation_date), 'dd.MM.yyyy')}
                        {r.end_date && r.end_date !== r.reservation_date && (
                          <span> – {format(parseISO(r.end_date), 'dd.MM.yyyy')}</span>
                        )}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>{renderReservationActions(r)}</div>
                    </div>
                  </div>
                );
              } else {
                const tr = item.data as Training;
                const assignedNames = getEmployeeNames(tr.assigned_employee_ids || []);
                return (
                  <div
                    key={tr.id}
                    className="border border-border/50 rounded-xl p-4 cursor-pointer hover:bg-hover bg-white space-y-2"
                    onClick={() => onTrainingClick?.(tr)}
                  >
                    {/* Top row: icon + status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-violet-600" />
                        <span className="font-medium text-sm">{tr.title}</span>
                      </div>
                      <ServiceTag
                        name={
                          tr.status === 'sold_out'
                            ? t('trainings.statusSoldOut')
                            : t('trainings.statusOpen')
                        }
                        shortcut={null}
                      />
                    </div>
                    {assignedNames && (
                      <div className="text-xs text-muted-foreground">{assignedNames}</div>
                    )}
                    {/* Date + actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(tr.start_date), 'dd.MM.yyyy')}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>{renderTrainingActions(tr)}</div>
                    </div>
                  </div>
                );
              }
            })}
          </div>

        </div>
      )}

      <div className="shrink-0">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedItems.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemLabel="realizacji"
        />
      </div>

      {/* Reject reservation dialog */}
      <AlertDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelReject();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reservations.confirmRejectTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('reservations.confirmRejectDescription', {
                name: reservationToReject?.customer_name || '',
                phone: reservationToReject?.customer_phone || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReject}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('reservations.yesReject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete training dialog */}
      <AlertDialog
        open={deleteTrainingDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTrainingDialogOpen(false);
            setTrainingToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('trainings.deleteTraining')}</AlertDialogTitle>
            <AlertDialogDescription>{t('trainings.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteTraining}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Customer edit drawer */}
      <CustomerEditDrawer
        customer={selectedCustomer}
        instanceId={selectedInstanceId}
        open={customerDrawerOpen}
        onClose={() => {
          setCustomerDrawerOpen(false);
          setSelectedCustomer(null);
        }}
        onOpenReservation={onOpenReservation}
      />

      {/* Invoice drawer */}
      {instanceId && (
        <CreateInvoiceDrawer
          open={invoiceDrawerOpen}
          onClose={() => {
            setInvoiceDrawerOpen(false);
            setInvoiceTarget(null);
          }}
          instanceId={instanceId}
          customerName={invoiceTarget?.customer_name}
          customerEmail={null}
          positions={
            invoiceTarget
              ? (
                  invoiceTarget.services_data ||
                  (invoiceTarget.service ? [invoiceTarget.service] : [])
                ).map((s) => ({
                  name: s.name,
                  quantity: 1,
                  unit_price_gross: invoiceTarget.price_netto
                    ? Math.round(
                        (invoiceTarget.price_netto /
                          Math.max(1, (invoiceTarget.services_data || []).length)) *
                          100,
                      ) / 100
                    : 0,
                  vat_rate: 23,
                  unit: 'szt.',
                  discount: 0,
                }))
              : []
          }
          supabaseClient={supabase}
        />
      )}
    </div>
  );
};

export default ReservationsView;
