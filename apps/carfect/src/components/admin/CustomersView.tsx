import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
} from 'lucide-react';
import { normalizeSearchQuery, normalizePhone, formatPhoneDisplay } from '@shared/utils';
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
} from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile, EmptyState } from '@shared/ui';
// useCombinedFeatures no longer needed — unified customer list
import CustomerEditDrawer from './CustomerEditDrawer';
import SendSmsDialog from './SendSmsDialog';
import { toast } from 'sonner';

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
}

interface CustomersViewProps {
  instanceId: string | null;
  onOpenReservation?: (reservationId: string) => void;
}

type SortField = 'name' | 'phone' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const CustomersView = ({ instanceId, onOpenReservation }: CustomersViewProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField] = useState<SortField>('name');
  const [sortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
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
        .select('phone, model, plate')
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

  // Get vehicles for a customer by phone (E.164 format in DB)
  const getVehiclesForCustomer = (phone: string) => {
    const normalized = normalizePhone(phone);
    return vehicles.filter((v) => v.phone === normalized);
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
            (v.plate && v.plate.toLowerCase().includes(query)),
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
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

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

  if (loading) {
    return (
      <div className="bg-white border border-border p-8 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  const renderCustomerList = () => (
    <>
      {/* Customers list */}
      <div className="bg-white border border-border overflow-hidden">
        {paginatedCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? t('common.noResults') : t('customers.noCustomers')}
            description={searchQuery ? undefined : 'Dodaj pierwszego klienta, aby rozpocząć'}
          />
        ) : (
          <div className="divide-y divide-border/50">
            {paginatedCustomers.map((customer) => {
              const customerVehicles = getVehiclesForCustomer(customer.phone);
              return (
                <div
                  key={customer.id}
                  onClick={() => {
                    setIsAddMode(false);
                    setSelectedCustomer(customer);
                  }}
                  className="p-4 flex items-center justify-between gap-4 transition-colors cursor-pointer bg-primary-foreground hover:bg-accent/30"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* Line 1: Name */}
                    <div className="font-medium text-foreground">{customer.name}</div>
                    {/* Line 2: Phone */}
                    <div className="text-sm text-muted-foreground">
                      {formatPhoneDisplay(customer.phone)}
                    </div>
                    {/* Line 3: Vehicles */}
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('common.showingPagination', {
              from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
              to: Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length),
              total: filteredCustomers.length,
            })}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-3 min-w-[60px] text-center">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-28">
      {/* Header with title and add button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('customers.title')}</h1>
        <Button onClick={handleAddCustomer}>{t('common.add')}</Button>
      </div>

      {/* Sticky header on mobile */}
      <div className="sm:static sticky top-0 z-20 bg-background pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Search bar - full width */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('customers.searchPlaceholder')}
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
