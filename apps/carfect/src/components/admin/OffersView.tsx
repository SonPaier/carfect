import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  FileText,
  Loader2,
  Filter,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { normalizeSearchQuery } from '@shared/utils';
import { getPublicOfferUrl } from '@/lib/offerUtils';
import { useTranslation } from 'react-i18next';
import { Button, Input, ConfirmDialog } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { OfferGenerator } from '@/components/offers/OfferGenerator';
import { OfferSettingsDialog } from '@/components/offers/settings/OfferSettingsDialog';
import { SendOfferEmailDialog } from './SendOfferEmailDialog';
import { MarkOfferCompletedDialog } from '@/components/offers/MarkOfferCompletedDialog';
import { OfferRemindersDialog } from '@/components/offers/OfferRemindersDialog';
import { OfferSelectionDialog } from '@/components/offers/OfferSelectionDialog';
import { OfferServicesListView } from '@/components/offers/services/OfferServicesListView';
import { OfferServiceEditView } from '@/components/offers/services/OfferServiceEditView';
import { AdminOfferApprovalDialog } from '@/components/offers/AdminOfferApprovalDialog';
import { OfferPreviewDialogByToken } from './OfferPreviewDialogByToken';
import { OfferViewsDialog } from '@/components/offers/OfferViewsDialog';
import { OfferListCard } from './OfferListCard';
import { useOfferScopes } from '@/hooks/useOfferScopes';
import { useWorkingHours } from '@/hooks/useWorkingHours';
import { toast } from 'sonner';
import AddReservationDialogV2 from './AddReservationDialogV2';

import type {
  OfferWithOptions,
  InstanceData,
  SelectedState,
  FollowUpPhoneStatus,
} from './offerTypes';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

interface OffersViewProps {
  instanceId: string | null;
  instanceData?: InstanceData | null;
  onReserveFromOffer?: (offerData: any) => void;
}

export default function OffersView({
  instanceId,
  instanceData,
  onReserveFromOffer,
}: OffersViewProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [duplicatingOfferId, setDuplicatingOfferId] = useState<string | null>(null);
  const [offers, setOffers] = useState<OfferWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Read initial pagination from URL
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialPageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const [currentPage, setCurrentPage] = useState(
    isNaN(initialPage) || initialPage < 1 ? 1 : initialPage,
  );
  const [pageSize, setPageSize] = useState(
    PAGE_SIZE_OPTIONS.includes(initialPageSize) ? initialPageSize : 20,
  );

  const [showScopesSettings, setShowScopesSettings] = useState(false);

  // Email dialog state
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [selectedOfferForEmail, setSelectedOfferForEmail] = useState<OfferWithOptions | null>(null);

  // Delete confirmation dialog state
  const [deleteOfferDialog, setDeleteOfferDialog] = useState<{
    open: boolean;
    offer: OfferWithOptions | null;
  }>({ open: false, offer: null });

  // Mark as completed dialog state
  const [completeOfferDialog, setCompleteOfferDialog] = useState<{
    open: boolean;
    offer: OfferWithOptions | null;
  }>({ open: false, offer: null });

  // Reminders dialog state
  const [remindersDialog, setRemindersDialog] = useState<{
    open: boolean;
    offer: OfferWithOptions | null;
  }>({ open: false, offer: null });

  // Selection dialog state
  const [selectionDialog, setSelectionDialog] = useState<{
    open: boolean;
    offer: OfferWithOptions | null;
  }>({ open: false, offer: null });

  // Admin approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    offer: OfferWithOptions | null;
    mode: 'approve' | 'edit';
  }>({ open: false, offer: null, mode: 'approve' });

  // Services view state
  const [showServicesView, setShowServicesView] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Preview dialog state
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; token: string | null }>({
    open: false,
    token: null,
  });

  // Internal note drawer state
  const [noteDrawer, setNoteDrawer] = useState<{ open: boolean; offerId: string; notes: string }>({
    open: false,
    offerId: '',
    notes: '',
  });

  // View history dialog state
  const [viewsDialog, setViewsDialog] = useState<{
    open: boolean;
    offerId: string;
    viewedAt: string | null;
  }>({ open: false, offerId: '', viewedAt: null });

  // Reservation from offer state (only used when no external handler)
  const [reservationFromOffer, setReservationFromOffer] = useState<{
    open: boolean;
    offer: OfferWithOptions | null;
  }>({ open: false, offer: null });

  // CACHED HOOK - offer scopes with 7-day staleTime
  const { data: cachedScopes = [] } = useOfferScopes(instanceId);
  const { data: workingHours } = useWorkingHours(instanceId);

  // Build scopes map from cached data
  const scopesMap = useMemo(() => {
    const map: Record<string, string> = {};
    cachedScopes.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [cachedScopes]);

  // Reactively map scope names onto offers — recalculates when scopesMap arrives from React Query
  // This fixes the race condition where fetchOffers runs before cachedScopes are loaded
  const offersWithMappedScopes = useMemo(() => {
    return offers.map((o) => {
      let selectedOptionName: string | undefined;
      const selectedState = o.selected_state as unknown as SelectedState | null;
      if (selectedState?.selectedVariants && o.offer_options) {
        const selectedOptionIds = Object.values(selectedState.selectedVariants).filter(Boolean);
        if (selectedOptionIds.length > 0) {
          const selectedOption = o.offer_options.find((opt) => selectedOptionIds.includes(opt.id));
          selectedOptionName = selectedOption?.name;
        }
      }
      return {
        ...o,
        offer_scopes: [
          ...new Set(o.offer_options?.map((opt) => opt.scope_id).filter(Boolean) || []),
        ]
          .map((id) => ({ id, name: scopesMap[id as string] || '' }))
          .filter((s) => s.name && s.name !== 'Dodatki'),
        selectedOptionName,
      };
    });
  }, [offers, scopesMap]);

  // Reset generator state when clicking sidebar link (same route navigation)
  useEffect(() => {
    if (showGenerator || showServicesView) {
      setShowGenerator(false);
      setShowServicesView(false);
      setEditingOfferId(null);
      setDuplicatingOfferId(null);
      setEditingServiceId(null);
      fetchOffers();
    }
  }, [location.key]);

  const fetchOffers = async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(
          `
          *,
          offer_options (
            id,
            name,
            scope_id,
            is_upsell,
            subtotal_net,
            offer_option_items (
              id,
              custom_name,
              unit_price,
              quantity,
              discount_percent,
              product_id
            )
          )
        `,
        )
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Store raw offers — scope name mapping is done reactively in useMemo below
      setOffers((data || []) as OfferWithOptions[]);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error(t('offers.errors.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [instanceId]);

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', offerId);
      if (error) throw error;
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      toast.success(t('offers.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error(t('offers.errors.deleteError'));
    }
  };

  const handleDuplicateOffer = async (offerId: string) => {
    setDuplicatingOfferId(offerId);
    setEditingOfferId(offerId);
    setShowGenerator(true);
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(getPublicOfferUrl(token));
    toast.success(t('offers.linkCopied'));
  };

  const handleCopyOfferNumber = (offerNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(offerNumber);
    toast.success(t('offers.offerNumberCopied'));
  };

  const handleChangeStatus = async (offerId: string, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'sent') updateData.sent_at = new Date().toISOString();

      const { error } = await supabase.from('offers').update(updateData).eq('id', offerId);

      if (error) throw error;

      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: newStatus } : o)));
      toast.success(t('offers.statusChanged'));
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error(t('offers.errors.statusChangeError'));
    }
  };

  const handleApproveOffer = async (
    offerId: string,
    netAmount: number,
    grossAmount: number,
    changeStatus: boolean,
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const updateData: Record<string, unknown> = {
        admin_approved_net: netAmount,
        admin_approved_gross: grossAmount,
      };

      if (changeStatus) {
        updateData.status = 'accepted';
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = userData?.user?.id;
      }

      const { error } = await supabase.from('offers').update(updateData).eq('id', offerId);

      if (error) throw error;

      await fetchOffers();
      toast.success(changeStatus ? t('offers.statusChanged') : t('offers.amountChanged'));
    } catch (error) {
      console.error('Error approving offer:', error);
      toast.error(t('offers.errors.statusChangeError'));
    }
  };

  const handleOpenSendEmailDialog = (offer: OfferWithOptions) => {
    if (!offer.customer_data?.email) {
      toast.error(t('offers.noCustomerEmail'));
      return;
    }
    setSelectedOfferForEmail(offer);
    setSendEmailDialogOpen(true);
  };

  const handleFollowUpStatusChange = async (offerId: string, newStatus: FollowUpPhoneStatus) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ follow_up_phone_status: newStatus })
        .eq('id', offerId);

      if (error) throw error;

      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, follow_up_phone_status: newStatus } : o)),
      );
    } catch (error) {
      console.error('Error updating follow-up status:', error);
      toast.error(t('offers.statusUpdateError'));
    }
  };

  const handleOpenNoteDrawer = (offer: OfferWithOptions) => {
    setNoteDrawer({ open: true, offerId: offer.id, notes: offer.internal_notes || '' });
  };

  const handleSaveNote = async () => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({
          internal_notes: noteDrawer.notes || null,
          follow_up_phone_status: 'called_discussed',
        })
        .eq('id', noteDrawer.offerId);

      if (error) throw error;

      setOffers((prev) =>
        prev.map((o) =>
          o.id === noteDrawer.offerId
            ? {
                ...o,
                internal_notes: noteDrawer.notes || null,
                follow_up_phone_status: 'called_discussed' as FollowUpPhoneStatus,
              }
            : o,
        ),
      );
      setNoteDrawer({ open: false, offerId: '', notes: '' });
      toast.success(t('offers.noteSaved'));
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(t('offers.noteError'));
    }
  };

  const handleReserveFromOffer = (offer: OfferWithOptions) => {
    if (onReserveFromOffer) {
      // Lift to parent (AdminDashboard) — navigates to calendar first
      onReserveFromOffer({
        id: '',
        ...getReservationDataFromOffer(offer),
        reservation_date: '',
        start_time: '',
        end_time: '',
        station_id: null,
      });
    } else {
      setReservationFromOffer({ open: true, offer });
    }
  };

  const getReservationDataFromOffer = (offer: OfferWithOptions) => {
    // Extract unique product_ids from offer_option_items
    const allItems = offer.offer_options?.flatMap((opt) => opt.offer_option_items || []) || [];

    const serviceIds = [
      ...new Set(allItems.map((item) => item.product_id).filter(Boolean)),
    ] as string[];

    // Build service_items with custom prices from offer
    const serviceItems = serviceIds.map((id) => {
      const item = allItems.find((i) => i.product_id === id);
      return {
        service_id: id,
        custom_price: item?.unit_price ?? null,
      };
    });

    return {
      customer_name: offer.customer_data?.name || '',
      customer_phone: offer.customer_data?.phone || '',
      vehicle_plate: offer.vehicle_data?.brandModel || offer.vehicle_data?.plate || '',
      admin_notes: offer.internal_notes || undefined,
      offer_number: offer.offer_number,
      price: offer.admin_approved_gross ?? offer.total_gross ?? undefined,
      has_unified_services: true,
      service_ids: serviceIds.length > 0 ? serviceIds : undefined,
      service_items: serviceItems.length > 0 ? serviceItems : undefined,
    };
  };

  // Search and filter — use offersWithMappedScopes so scope pills are always reactive
  const filteredOffers = useMemo(() => {
    let result = offersWithMappedScopes;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const normalizedQuery = normalizeSearchQuery(query);
      result = result.filter((offer) => {
        if (normalizeSearchQuery(offer.offer_number).toLowerCase().includes(normalizedQuery))
          return true;

        const customer = offer.customer_data;
        if (customer?.name?.toLowerCase().includes(query)) return true;
        if (customer?.email?.toLowerCase().includes(query)) return true;
        if (customer?.company?.toLowerCase().includes(query)) return true;
        if (customer?.phone && normalizeSearchQuery(customer.phone).includes(normalizedQuery))
          return true;

        const vehicle = offer.vehicle_data;
        if (vehicle?.brandModel?.toLowerCase().includes(query)) return true;
        if (vehicle?.brand?.toLowerCase().includes(query)) return true;
        if (vehicle?.model?.toLowerCase().includes(query)) return true;
        if (vehicle?.plate?.toLowerCase().includes(query)) return true;

        const products =
          offer.offer_options?.flatMap(
            (opt) => opt.offer_option_items?.map((item) => item.custom_name) || [],
          ) || [];
        if (products.some((name) => name?.toLowerCase().includes(query))) return true;

        return false;
      });
    }

    return result;
  }, [offersWithMappedScopes, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredOffers.length / pageSize);
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOffers.slice(startIndex, startIndex + pageSize);
  }, [filteredOffers, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  if (showGenerator && instanceId) {
    return (
      <>
        <Helmet>
          <title>
            {editingOfferId
              ? duplicatingOfferId
                ? t('offers.duplicateOffer')
                : t('offers.editOffer')
              : t('offers.newOffer')}{' '}
            - {t('offers.generator')}
          </title>
        </Helmet>
        <div className="max-w-4xl mx-auto">
          <div className="mb-2">
            <Button
              variant="ghost"
              onClick={async () => {
                await fetchOffers();
                setShowGenerator(false);
                setEditingOfferId(null);
                setDuplicatingOfferId(null);
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('offers.backToList')}
            </Button>
          </div>
          <h1 className="text-2xl font-bold mb-4">
            {duplicatingOfferId
              ? t('offers.duplicateOffer')
              : editingOfferId
                ? t('offers.editOffer')
                : t('offers.newOffer')}
          </h1>
          <OfferGenerator
            instanceId={instanceId}
            offerId={duplicatingOfferId ? undefined : editingOfferId || undefined}
            duplicateFromId={duplicatingOfferId || undefined}
            onClose={async () => {
              await fetchOffers();
              setShowGenerator(false);
              setEditingOfferId(null);
              setDuplicatingOfferId(null);
            }}
            onSaved={async () => {
              await fetchOffers();
              setShowGenerator(false);
              setEditingOfferId(null);
              setDuplicatingOfferId(null);
            }}
          />
        </div>
      </>
    );
  }

  // Show services list view
  if (showServicesView && instanceId && !editingServiceId) {
    return (
      <OfferServicesListView
        instanceId={instanceId}
        onBack={() => setShowServicesView(false)}
        onEdit={(scopeId) => setEditingServiceId(scopeId)}
        onCreate={() => setEditingServiceId('new')}
      />
    );
  }

  // Show service edit/create view
  if (showServicesView && instanceId && editingServiceId) {
    return (
      <OfferServiceEditView
        instanceId={instanceId}
        scopeId={editingServiceId === 'new' ? undefined : editingServiceId}
        onBack={() => setEditingServiceId(null)}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {t('offers.title')} - {t('common.adminPanel')}
        </title>
      </Helmet>
      <div className="max-w-3xl mx-auto pb-24">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-bold">{t('offers.title')}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowServicesView(true)}
              className="sm:w-auto sm:px-4 w-10 h-10 bg-white"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">{t('offers.templates')}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowScopesSettings(true)}
              className="sm:w-auto sm:px-4 w-10 h-10 bg-white"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">{t('offers.settings')}</span>
            </Button>
            <Button onClick={() => setShowGenerator(true)}>{t('offers.newOffer')}</Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('offers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('offers.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('offers.statusAll')}</SelectItem>
                <SelectItem value="draft">{t('offers.statusDraft')}</SelectItem>
                <SelectItem value="sent">{t('offers.statusSent')}</SelectItem>
                <SelectItem value="viewed">{t('offers.statusViewed')}</SelectItem>
                <SelectItem value="accepted">{t('offers.statusAccepted')}</SelectItem>
                <SelectItem value="completed">{t('offers.statusCompleted')}</SelectItem>
                <SelectItem value="rejected">{t('offers.statusRejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? t('offers.noResultsFor', { query: searchQuery })
                : statusFilter === 'all'
                  ? t('offers.noOffers')
                  : t('offers.noOffersForStatus')}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 pb-24 lg:pb-0">
              {paginatedOffers.map((offer) => (
                <OfferListCard
                  key={offer.id}
                  offer={offer}
                  onEdit={(id) => {
                    setEditingOfferId(id);
                    setShowGenerator(true);
                  }}
                  onPreview={(token) => setPreviewDialog({ open: true, token })}
                  onCopyLink={handleCopyLink}
                  onSendEmail={handleOpenSendEmailDialog}
                  onChangeStatus={handleChangeStatus}
                  onOpenApproval={(o, mode) => setApprovalDialog({ open: true, offer: o, mode })}
                  onComplete={(o) => setCompleteOfferDialog({ open: true, offer: o })}
                  onReminders={(o) => setRemindersDialog({ open: true, offer: o })}
                  onDelete={(o) => setDeleteOfferDialog({ open: true, offer: o })}
                  onReserve={handleReserveFromOffer}
                  onFollowUpChange={handleFollowUpStatusChange}
                  onNoteClick={handleOpenNoteDrawer}
                  onViewHistory={(id, viewedAt) =>
                    setViewsDialog({ open: true, offerId: id, viewedAt })
                  }
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t('offers.show')}</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>{t('offers.perPage')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scopes Settings Dialog */}
      {instanceId && (
        <OfferSettingsDialog
          open={showScopesSettings}
          onOpenChange={setShowScopesSettings}
          instanceId={instanceId}
        />
      )}

      {/* Send Email Dialog */}
      {selectedOfferForEmail && (
        <SendOfferEmailDialog
          open={sendEmailDialogOpen}
          onOpenChange={setSendEmailDialogOpen}
          offer={selectedOfferForEmail}
          instanceData={instanceData || null}
          onSent={fetchOffers}
        />
      )}

      {/* Delete Offer Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOfferDialog.open}
        onOpenChange={(open) => !open && setDeleteOfferDialog({ open: false, offer: null })}
        title={t('offers.confirmDeleteTitle')}
        description={t('offers.confirmDeleteDesc', {
          number: deleteOfferDialog.offer?.offer_number || '',
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
        onConfirm={() => {
          if (deleteOfferDialog.offer) {
            handleDeleteOffer(deleteOfferDialog.offer.id);
            setDeleteOfferDialog({ open: false, offer: null });
          }
        }}
      />

      {/* Mark as Completed Dialog */}
      {completeOfferDialog.offer && (
        <MarkOfferCompletedDialog
          open={completeOfferDialog.open}
          onOpenChange={(open) => !open && setCompleteOfferDialog({ open: false, offer: null })}
          offerId={completeOfferDialog.offer.id}
          offerNumber={completeOfferDialog.offer.offer_number}
          onCompleted={() => {
            fetchOffers();
            setCompleteOfferDialog({ open: false, offer: null });
          }}
        />
      )}

      {/* Reminders Dialog */}
      {remindersDialog.offer && (
        <OfferRemindersDialog
          open={remindersDialog.open}
          onOpenChange={(open) => !open && setRemindersDialog({ open: false, offer: null })}
          offerId={remindersDialog.offer.id}
          offerNumber={remindersDialog.offer.offer_number}
          customerName={remindersDialog.offer.customer_data?.name}
        />
      )}

      {/* Customer Selection Dialog */}
      {selectionDialog.offer && (
        <OfferSelectionDialog
          open={selectionDialog.open}
          onOpenChange={(open) => !open && setSelectionDialog({ open: false, offer: null })}
          offer={selectionDialog.offer}
        />
      )}

      {/* Admin Offer Approval Dialog */}
      {approvalDialog.offer && (
        <AdminOfferApprovalDialog
          open={approvalDialog.open}
          onOpenChange={(open) =>
            !open && setApprovalDialog({ open: false, offer: null, mode: 'approve' })
          }
          offer={approvalDialog.offer}
          mode={approvalDialog.mode}
          onConfirm={async (netAmount, grossAmount) => {
            await handleApproveOffer(
              approvalDialog.offer!.id,
              netAmount,
              grossAmount,
              approvalDialog.mode === 'approve',
            );
            setApprovalDialog({ open: false, offer: null, mode: 'approve' });
          }}
        />
      )}

      {/* Offer Preview Dialog */}
      {previewDialog.token && (
        <OfferPreviewDialogByToken
          open={previewDialog.open}
          onClose={() => setPreviewDialog({ open: false, token: null })}
          token={previewDialog.token}
        />
      )}

      {/* Internal Note Drawer */}
      <Sheet
        open={noteDrawer.open}
        onOpenChange={(open) => !open && setNoteDrawer({ open: false, offerId: '', notes: '' })}
      >
        <SheetContent side="right" className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('offers.internalNote')}</SheetTitle>
            <SheetDescription className="sr-only">{t('offers.internalNoteDesc')}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 py-4">
            <Textarea
              value={noteDrawer.notes}
              onChange={(e) => setNoteDrawer((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder={t('offers.notePlaceholder')}
              className="h-full min-h-[200px] resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setNoteDrawer({ open: false, offerId: '', notes: '' })}
            >
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSaveNote}>
              {t('common.save')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reservation from Offer — only when no external handler */}
      {!onReserveFromOffer && reservationFromOffer.offer && instanceId && (
        <AddReservationDialogV2
          open={reservationFromOffer.open}
          onClose={() => setReservationFromOffer({ open: false, offer: null })}
          instanceId={instanceId}
          onSuccess={() => {
            setReservationFromOffer({ open: false, offer: null });
            toast.success(t('offers.reservationCreated'));
          }}
          workingHours={workingHours}
          editingReservation={{
            id: '',
            ...getReservationDataFromOffer(reservationFromOffer.offer),
            reservation_date: '',
            start_time: '',
            end_time: '',
            station_id: null,
          }}
        />
      )}
      {/* Offer Views History Dialog */}
      <OfferViewsDialog
        offerId={viewsDialog.offerId}
        viewedAt={viewsDialog.viewedAt}
        open={viewsDialog.open}
        onOpenChange={(open) => setViewsDialog((prev) => ({ ...prev, open }))}
      />
    </>
  );
}
