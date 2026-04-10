import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Phone, MessageSquare, Trash2, Users } from 'lucide-react';
import { normalizeSearchQuery, normalizePhone, formatPhoneDisplay } from '@shared/utils';
import { cn } from '@shared/ui';
import { Input } from '@shared/ui';
import { Button } from '@shared/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  PaginationFooter,
} from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile, EmptyState } from '@shared/ui';
// useCombinedFeatures no longer needed — unified customer list
import CustomerEditDrawer from './CustomerEditDrawer';
import SendSmsDialog from './SendSmsDialog';
import { toast } from 'sonner';
import { useInstanceFeatures } from '@/hooks/useInstanceFeatures';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string | null;
  phone_verified: boolean | null;
  company: string | null;
  nip: string | null;
  address: string | null;
}

interface CustomerVehicle {
  phone: string;
  model: string;
  plate: string | null;
  vin: string | null;
}

interface CustomersViewProps {
  instanceId: string | null;
  onOpenReservation?: (reservationId: string) => void;
}

type SortField = 'name' | 'phone' | 'created_at';
type SortDirection = 'asc' | 'desc';

const DEFAULT_PAGE_SIZE = 25;

const CustomersView = ({ instanceId, onOpenReservation }: CustomersViewProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { hasFeature } = useInstanceFeatures(instanceId);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField] = useState<SortField>('name');
  const [sortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [smsCustomer, setSmsCustomer] = useState<Customer | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    if (!instanceId) return;
    setLoading(true);

    // Fetch customers and vehicles in parallel
    const [customersResult, vehiclesResult] = await Promise.all([
      supabase.from('customers').select('*').eq('instance_id', instanceId).order('name'),
      supabase
        .from('customer_vehicles')
        .select('phone, model, plate, vin')
        .eq('instance_id', instanceId),
    ]);

    if (!customersResult.error && customersResult.data) {
      setCustomers(customersResult.data as Customer[]);
    }
    if (!vehiclesResult.error && vehiclesResult.data) {
      setVehicles(vehiclesResult.data as CustomerVehicle[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, [instanceId]);

  // Pre-compute vehicle lookup map (phone → vehicles[])
  const vehiclesByPhone = useMemo(() => {
    const map = new Map<string, CustomerVehicle[]>();
    for (const v of vehicles) {
      const existing = map.get(v.phone) || [];
      existing.push(v);
      map.set(v.phone, existing);
    }
    return map;
  }, [vehicles]);

  const getVehiclesForCustomer = (phone: string) => {
    const normalized = normalizePhone(phone);
    return vehiclesByPhone.get(normalized) || [];
  };

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Filter by search query (including vehicle search)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const normalizedQuery = normalizeSearchQuery(query);
      result = result.filter((c) => {
        // Search in customer fields
        const matchesCustomer =
          c.name.toLowerCase().includes(query) ||
          normalizeSearchQuery(c.phone).includes(normalizedQuery) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.company && c.company.toLowerCase().includes(query)) ||
          (c.nip && normalizeSearchQuery(c.nip).includes(normalizedQuery));

        // Search in vehicles
        const customerVehicles = getVehiclesForCustomer(c.phone);
        const matchesVehicle = customerVehicles.some(
          (v) =>
            v.model.toLowerCase().includes(query) ||
            (v.plate && v.plate.toLowerCase().includes(query)) ||
            (v.vin && v.vin.toLowerCase().includes(query)),
        );

        return matchesCustomer || matchesVehicle;
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === null) aVal = '';
      if (bVal === null) bVal = '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, 'pl');
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
    return result;
  }, [customers, searchQuery, sortField, sortDirection, vehicles]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleSms = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      window.location.href = `sms:${customer.phone}`;
    } else {
      setSmsCustomer(customer);
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsAddMode(true);
  };

  const handleCloseDrawer = () => {
    setSelectedCustomer(null);
    setIsAddMode(false);
  };

  const handleDeleteClick = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase.from('customers').delete().eq('id', customerToDelete.id);

      if (error) throw error;

      toast.success(t('customers.deleted'));
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error(t('errors.generic'));
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const scrollToTop = useCallback(() => {
    tableContainerRef.current?.scrollTo({ top: 0 });
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

  if (loading) {
    return (
      <div className="bg-white border border-border/50 p-8 text-center text-muted-foreground rounded-lg">
        {t('common.loading')}
      </div>
    );
  }

  const handleCustomerClick = (customer: Customer) => {
    setIsAddMode(false);
    setSelectedCustomer(customer);
  };

  const renderMobileList = () => (
    <div className="grid gap-2">
      {paginatedCustomers.map((customer) => {
        const customerVehicles = getVehiclesForCustomer(customer.phone);
        return (
          <div
            key={customer.id}
            onClick={() => handleCustomerClick(customer)}
            className="p-4 flex items-center justify-between gap-4 transition-shadow cursor-pointer bg-white border border-border/50 rounded-lg hover:shadow-md"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="font-semibold text-sm text-foreground">{customer.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatPhoneDisplay(customer.phone)}
              </div>
              {customerVehicles.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {customerVehicles.slice(0, 3).map((v, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/90 text-white rounded-full text-xs"
                    >
                      {v.model}
                    </span>
                  ))}
                  {customerVehicles.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{customerVehicles.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-hover"
                onClick={(e) => handleSms(customer, e)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-hover"
                onClick={(e) => handleCall(customer.phone, e)}
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-hover"
                onClick={(e) => handleDeleteClick(customer, e)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDesktopTable = () => (
    <div ref={tableContainerRef} className="rounded-lg border border-border/50 bg-white overflow-auto flex-1 min-h-0">
      <Table wrapperClassName="overflow-visible">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Nazwa</TableHead>
            <TableHead className="w-[140px]">Telefon</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Pojazdy</TableHead>
            <TableHead className="w-[100px] text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCustomers.map((customer) => {
            const customerVehicles = getVehiclesForCustomer(customer.phone);
            return (
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                onClick={() => handleCustomerClick(customer)}
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{formatPhoneDisplay(customer.phone)}</TableCell>
                <TableCell>{customer.email || '—'}</TableCell>
                <TableCell>
                  {customerVehicles.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {customerVehicles.slice(0, 2).map((v, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 bg-slate-700/90 text-white rounded-full text-xs"
                        >
                          {v.model}
                        </span>
                      ))}
                      {customerVehicles.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{customerVehicles.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-hover"
                      onClick={(e) => handleSms(customer, e)}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-hover"
                      onClick={(e) => handleCall(customer.phone, e)}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-hover"
                      onClick={(e) => handleDeleteClick(customer, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderCustomerList = () => {
    if (paginatedCustomers.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title={searchQuery ? t('common.noResults') : t('customers.noCustomers')}
          description={searchQuery ? undefined : 'Dodaj pierwszego klienta, aby rozpocząć'}
        />
      );
    }

    if (isMobile) {
      return (
        <>
          {renderMobileList()}
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="klientów"
          />
        </>
      );
    }

    return (
      <>
        {renderDesktopTable()}
        <div className="shrink-0">
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="klientów"
          />
        </div>
      </>
    );
  };

  return (
    <div className={isMobile ? 'space-y-4 pb-28' : 'flex flex-col h-[calc(100vh-80px)]'}>
      {/* Header with title and add button */}
      <div className="flex items-center justify-between shrink-0 pb-4">
        <h1 className="text-2xl font-medium text-foreground">{t('customers.title')}</h1>
        <Button onClick={handleAddCustomer}>Dodaj klienta</Button>
      </div>
      <div id="hint-infobox-slot" className="flex flex-col gap-4 shrink-0" />

      {/* Search bar */}
      <div className={cn(
        'shrink-0 pb-4',
        isMobile && 'sticky top-0 z-20 bg-background -mx-4 px-4'
      )}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={
              hasFeature('vehicle_vin')
                ? t('customers.searchPlaceholder') + ', VIN...'
                : t('customers.searchPlaceholder')
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {renderCustomerList()}

      {/* Customer Edit Drawer */}
      <CustomerEditDrawer
        customer={selectedCustomer}
        instanceId={instanceId}
        open={!!selectedCustomer || isAddMode}
        onClose={handleCloseDrawer}
        onCustomerUpdated={fetchCustomers}
        onOpenReservation={onOpenReservation}
        isAddMode={isAddMode}
      />

      {/* Send SMS Dialog (web only) */}
      <SendSmsDialog
        phone={smsCustomer?.phone || ''}
        customerName={smsCustomer?.name || ''}
        instanceId={instanceId}
        open={!!smsCustomer}
        onClose={() => setSmsCustomer(null)}
      />
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('customers.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('customers.confirmDeleteDescription', { name: customerToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomersView;
