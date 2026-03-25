import { useState, useEffect } from 'react';
import {
  buildProtocolNotes,
  getVisitsFromChain,
  formatDuration,
  roundUpTo30,
  type VisitInfo,
} from '@/lib/protocolUtils';
import type { ChecklistItem } from '@shared/ui';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Loader2, CalendarIcon, Pen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import CustomerSearchInput, { type SelectedCustomer } from '@/components/admin/CustomerSearchInput';
import CustomerAddressSelect from '@/components/admin/CustomerAddressSelect';
import CustomerEditDrawer from '@/components/admin/CustomerEditDrawer';
import type { Customer } from '@/components/admin/CustomersView';
import { ProtocolPhotosUploader } from './ProtocolPhotosUploader';
import SignatureDialog from './SignatureDialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface CreateProtocolFormProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  onSuccess: () => void;
  editingProtocolId: string | null;
  prefillCustomerId?: string | null;
  prefillCustomerName?: string;
  prefillCustomerPhone?: string;
  prefillCustomerEmail?: string;
  prefillCustomerAddressId?: string | null;
  prefillCalendarItemId?: string | null;
}

const CreateProtocolForm = ({
  open,
  onClose,
  instanceId,
  onSuccess,
  editingProtocolId,
  prefillCustomerId,
  prefillCustomerName,
  prefillCustomerPhone,
  prefillCustomerEmail,
  prefillCustomerAddressId,
  prefillCalendarItemId,
}: CreateProtocolFormProps) => {
  const { user, hasRole, hasInstanceRole } = useAuth();
  const isAdmin = hasRole('super_admin') || hasInstanceRole('admin', instanceId);
  const isEditMode = !!editingProtocolId;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Form state
  const [protocolType, setProtocolType] = useState('completion');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNip, setCustomerNip] = useState('');
  const [customerAddressId, setCustomerAddressId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [visits, setVisits] = useState<VisitInfo[]>([]);
  const [showVisits, setShowVisits] = useState(true);
  const [protocolDate, setProtocolDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [preparedBy, setPreparedBy] = useState('');
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [customerDetailData, setCustomerDetailData] = useState<Customer | null>(null);
  const customerDetailOpen = !!customerDetailData;

  // Load existing protocol for editing or reset form
  useEffect(() => {
    if (!open) return;
    if (isEditMode && editingProtocolId) {
      setLoadingData(true);
      supabase
        .from('protocols')
        .select('*')
        .eq('id', editingProtocolId)
        .single()
        .then(async ({ data, error }) => {
          if (error || !data) {
            toast.error('Nie znaleziono protokołu');
            onClose();
            return;
          }
          setProtocolType(data.protocol_type);
          setCustomerId(data.customer_id);
          setCustomerName(data.customer_name);
          setCustomerPhone(data.customer_phone || '');
          setCustomerEmail(data.customer_email || '');
          setCustomerNip(data.customer_nip || '');
          setCustomerAddressId(data.customer_address_id);
          setPhotoUrls(Array.isArray(data.photo_urls) ? (data.photo_urls as string[]) : []);
          setNotes(data.notes || '');
          setShowVisits((data as Record<string, unknown>).show_visits !== false);
          setProtocolDate(new Date(data.protocol_date));
          setPreparedBy(data.prepared_by || '');
          setCustomerSignature(data.customer_signature || null);

          // Load visits from linked calendar item chain
          const calItemId = data.calendar_item_id;
          if (calItemId) {
            const { data: currentItem } = await supabase
              .from('calendar_items')
              .select('id, parent_item_id, item_date, work_started_at, work_ended_at')
              .eq('id', calItemId)
              .single();
            if (currentItem) {
              const rootId =
                (currentItem as Record<string, unknown>).parent_item_id || currentItem.id;
              const { data: chainData } = await supabase
                .from('calendar_items')
                .select('id, item_date, work_started_at, work_ended_at')
                .or(`id.eq.${rootId},parent_item_id.eq.${rootId}`);
              const chain = (chainData || []) as Array<{
                id?: string;
                item_date?: string | null;
                work_started_at?: string | null;
                work_ended_at?: string | null;
              }>;
              setVisits(getVisitsFromChain(chain));
            }
          }

          setLoadingData(false);
        });
    } else {
      // Reset form with optional prefill
      setProtocolType('completion');
      setCustomerId(prefillCustomerId || null);
      setCustomerName(prefillCustomerName || '');
      setCustomerPhone(prefillCustomerPhone || '');
      setCustomerEmail(prefillCustomerEmail || '');
      setCustomerNip('');
      setCustomerAddressId(prefillCustomerAddressId || null);
      setPhotoUrls([]);
      setNotes('');
      setVisits([]);
      setProtocolDate(new Date());
      setCustomerSignature(null);

      // Prefill notes from checklist chain + load visits
      if (prefillCalendarItemId) {
        (async () => {
          try {
            const { data: currentItem } = await supabase
              .from('calendar_items')
              .select(
                'id, parent_item_id, checklist_items, item_date, work_started_at, work_ended_at',
              )
              .eq('id', prefillCalendarItemId)
              .single();
            if (!currentItem || !currentItem.id) return;
            const rootId =
              (currentItem as Record<string, unknown>).parent_item_id || currentItem.id;
            const { data: chainData } = await supabase
              .from('calendar_items')
              .select('id, checklist_items, item_date, work_started_at, work_ended_at')
              .or(`id.eq.${rootId},parent_item_id.eq.${rootId}`);
            const chain = (chainData || []) as Array<{
              id?: string;
              checklist_items?: ChecklistItem[] | null;
              item_date?: string | null;
              work_started_at?: string | null;
              work_ended_at?: string | null;
            }>;
            const generatedNotes = buildProtocolNotes(chain);
            if (generatedNotes) setNotes(generatedNotes);
            setVisits(getVisitsFromChain(chain));
          } catch {
            // Chain fetch is best-effort — don't block protocol creation
          }
        })();
      }

      // Auto-fill prepared_by from linked employee name
      if (user?.id && instanceId) {
        supabase
          .from('employees')
          .select('name')
          .eq('instance_id', instanceId)
          .eq('linked_user_id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            setPreparedBy(data?.name || '');
          });
      } else {
        setPreparedBy('');
      }
    }
  }, [
    open,
    isEditMode,
    editingProtocolId,
    prefillCustomerId,
    prefillCustomerName,
    prefillCustomerPhone,
    prefillCustomerEmail,
    prefillCustomerAddressId,
    prefillCalendarItemId,
    instanceId,
    user?.id,
  ]);

  const handleSelectCustomer = (customer: SelectedCustomer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email || '');
    setCustomerNip(customer.nip || '');
  };

  const handleCustomerClick = async (clickedCustomerId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', clickedCustomerId)
      .single();
    if (data) {
      setCustomerDetailData(data as Customer);
    }
  };

  const handleClearCustomer = () => {
    setCustomerId(null);
    setCustomerAddressId(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerNip('');
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!customerName.trim()) {
      toast.error('Podaj nazwę klienta');
      return;
    }

    setLoading(true);
    const payload: any = {
      instance_id: instanceId,
      customer_id: customerId,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || null,
      customer_email: customerEmail.trim() || null,
      customer_nip: customerNip.trim() || null,
      customer_address_id: customerAddressId,
      protocol_date: format(protocolDate, 'yyyy-MM-dd'),
      protocol_type: protocolType,
      prepared_by: preparedBy.trim() || null,
      notes: notes.trim() || null,
      show_visits: showVisits,
      customer_signature: customerSignature,
      photo_urls: photoUrls,
    };
    try {
      if (!isEditMode && prefillCalendarItemId) {
        // Verify the calendar item still exists before linking
        const { data: itemExists } = await supabase
          .from('calendar_items')
          .select('id')
          .eq('id', prefillCalendarItemId)
          .maybeSingle();
        if (itemExists) {
          payload.calendar_item_id = prefillCalendarItemId;
        }
      }
      if (!isEditMode && user?.id) {
        payload.created_by_user_id = user.id;
      }

      if (isEditMode) {
        const { error } = await supabase
          .from('protocols')
          .update(payload)
          .eq('id', editingProtocolId!);
        if (error) throw error;
        toast.success('Protokół zaktualizowany');
      } else {
        const { error } = await supabase.from('protocols').insert(payload);
        if (error) throw error;
        toast.success('Protokół utworzony');
      }

      // Save modified visit durations to calendar_items (admin only)
      if (isAdmin) {
        for (const v of visits) {
          if (!v.calendarItemId || !v.workStartedAt) continue;
          const newEndedAt = new Date(
            new Date(v.workStartedAt).getTime() + v.durationMinutes * 60 * 1000,
          ).toISOString();
          if (newEndedAt !== v.workEndedAt) {
            await supabase
              .from('calendar_items')
              .update({ work_ended_at: newEndedAt })
              .eq('id', v.calendarItemId);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving protocol:', error);
      if (!isEditMode && error?.code === '23503') {
        toast.error('Zlecenie zostało usunięte. Protokół zostanie zapisany bez powiązania.');
        // Retry without calendar_item_id
        try {
          const { calendar_item_id: _, ...retryPayload } = payload;
          const { error: retryError } = await supabase.from('protocols').insert(retryPayload);
          if (retryError) throw retryError;
          toast.success('Protokół utworzony');
          onSuccess();
          onClose();
        } catch (retryErr) {
          console.error('Retry failed:', retryErr);
          toast.error('Błąd podczas zapisywania protokołu');
        }
      } else {
        toast.error('Błąd podczas zapisywania protokołu');
      }
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="flex flex-col h-full">
      {/* Fixed header - matching drawer style */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold truncate pr-2">
            {isEditMode ? 'Edytuj protokół' : 'Protokół'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/5 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      {loadingData ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Protocol Type */}
          <div className="space-y-2">
            <Label>Typ protokołu</Label>
            <Select value={protocolType} onValueChange={setProtocolType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completion">Protokół zakończenia prac</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Search - admin only */}
          {isAdmin && <div className="space-y-2">
            <Label>Klient *</Label>
            <CustomerSearchInput
              instanceId={instanceId}
              selectedCustomer={
                customerId
                  ? {
                      id: customerId,
                      name: customerName,
                      phone: customerPhone,
                      email: customerEmail || null,
                      company: null,
                    }
                  : null
              }
              onSelect={handleSelectCustomer}
              onClear={handleClearCustomer}
              onCustomerClick={handleCustomerClick}
            />
          </div>}

          {/* Customer details - admin only */}
          {isAdmin && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Imię i nazwisko *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (customerId) setCustomerId(null);
                    }}
                    placeholder="Jan Kowalski"
                  />
                </div>
                {!isEditMode && (
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+48 ..."
                      type="tel"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="jan@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>NIP</Label>
                  <Input
                    value={customerNip}
                    onChange={(e) => setCustomerNip(e.target.value)}
                    placeholder="123-456-78-90"
                  />
                </div>
              </div>

              {/* Customer Address */}
              <CustomerAddressSelect
                instanceId={instanceId}
                customerId={customerId}
                value={customerAddressId}
                onChange={setCustomerAddressId}
                label="Adres klienta"
              />
            </>
          )}

          {/* Photos */}
          <div className="space-y-2">
            <Label>Zdjęcia</Label>
            <ProtocolPhotosUploader
              photos={photoUrls}
              onPhotosChange={setPhotoUrls}
              protocolId={editingProtocolId}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Uwagi</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dodatkowe uwagi..."
              rows={Math.max(3, (notes.match(/\n/g) || []).length + 2)}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Data protokołu</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(protocolDate, 'EEEE, d MMM yyyy', { locale: pl })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={protocolDate}
                  onSelect={(date) => {
                    if (date) {
                      setProtocolDate(date);
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                  locale={pl}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Visits - admin only */}
          {isAdmin && visits.length > 0 && (
            <div className="space-y-2">
              <Label>Wizyty serwisowe</Label>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-xs text-muted-foreground pb-1">
                  <span>Data</span>
                  <div className="flex gap-6">
                    <span className="w-20 text-right">Rzeczywisty</span>
                    <span className="w-20 text-right">Dla klienta</span>
                  </div>
                </div>
                {visits.map((v, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>{format(new Date(v.itemDate + 'T00:00:00'), 'd.MM.yyyy')}</span>
                    <div className="flex gap-6 items-center">
                      {isAdmin ? (
                        <div className="w-auto flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={23}
                            value={Math.floor(v.durationMinutes / 60)}
                            onChange={(e) => {
                              const h = Math.max(0, parseInt(e.target.value) || 0);
                              const m = v.durationMinutes % 60;
                              const newVisits = [...visits];
                              newVisits[i] = { ...v, durationMinutes: h * 60 + m };
                              setVisits(newVisits);
                            }}
                            className="w-14 h-9 px-2 text-center text-sm"
                          />
                          <span className="text-xs text-muted-foreground">h</span>
                          <Input
                            type="number"
                            min={0}
                            max={59}
                            value={v.durationMinutes % 60}
                            onChange={(e) => {
                              const h = Math.floor(v.durationMinutes / 60);
                              const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                              const newVisits = [...visits];
                              newVisits[i] = { ...v, durationMinutes: h * 60 + m };
                              setVisits(newVisits);
                            }}
                            className="w-14 h-9 px-2 text-center text-sm"
                          />
                          <span className="text-xs text-muted-foreground">m</span>
                        </div>
                      ) : (
                        <span className="w-20 text-right">{formatDuration(v.durationMinutes)}</span>
                      )}
                      <span className="w-20 text-right font-medium">
                        {formatDuration(roundUpTo30(v.durationMinutes))}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Łącznie</span>
                  <div className="flex gap-6">
                    <span className="w-20 text-right">
                      {formatDuration(visits.reduce((sum, v) => sum + v.durationMinutes, 0))}
                    </span>
                    <span className="w-20 text-right">
                      {formatDuration(
                        visits.reduce((sum, v) => sum + roundUpTo30(v.durationMinutes), 0),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show visits on protocol toggle - admin only */}
          {isAdmin && visits.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-visits"
                checked={showVisits}
                onCheckedChange={(checked) => setShowVisits(checked === true)}
              />
              <label htmlFor="show-visits" className="text-sm cursor-pointer">
                Pokaż czasy wizyt na protokole
              </label>
            </div>
          )}

          {/* Prepared By */}
          <div className="space-y-2">
            <Label>Sporządził</Label>
            <Input
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="Imię i nazwisko osoby sporządzającej"
            />
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label>Podpis osoby upoważnionej do odbioru</Label>
            <div className="border border-border rounded-md bg-white overflow-hidden relative">
              {customerSignature ? (
                <div className="relative">
                  <img
                    src={customerSignature}
                    alt="Podpis"
                    className="w-full"
                    style={{ height: '160px', objectFit: 'contain' }}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCustomerSignature(null);
                        setSignatureOpen(true);
                      }}
                    >
                      Podpisz ponownie
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCustomerSignature(null)}>
                      Usuń
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors text-muted-foreground"
                  style={{ height: '160px' }}
                  onClick={() => setSignatureOpen(true)}
                >
                  <Pen className="w-8 h-8 mb-2" />
                  <span className="text-sm">Kliknij aby złożyć podpis</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom bar - matching drawer style */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3 flex items-center gap-1.5">
        <Button variant="outline" className="bg-white flex-1" onClick={onClose}>
          Anuluj
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditMode ? 'Zapisz zmiany' : 'Utwórz protokół'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {!customerDetailOpen && (
        <Sheet
          open={open}
          onOpenChange={(v) => {
            if (!v) onClose();
          }}
        >
          <SheetContent
            side="right"
            className="w-full sm:w-[550px] sm:max-w-[550px] p-0"
            hideOverlay
            hideCloseButton
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            {formContent}
          </SheetContent>
        </Sheet>
      )}

      {customerDetailOpen && (
        <CustomerEditDrawer
          customer={customerDetailData}
          instanceId={instanceId}
          open
          onClose={() => {
            setCustomerDetailData(null);
          }}
        />
      )}

      <SignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={(dataUrl) => {
          setCustomerSignature(dataUrl);
          setSignatureOpen(false);
        }}
      />
    </>
  );
};

export default CreateProtocolForm;
