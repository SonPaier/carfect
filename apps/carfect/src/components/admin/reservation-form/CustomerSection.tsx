import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, History } from 'lucide-react';
import { Label } from '@shared/ui';
import { PhoneMaskedInput } from '@shared/ui';
import ClientSearchAutocomplete from '@/components/ui/client-search-autocomplete';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneDisplay, normalizePhone } from '@shared/utils';
import { CustomerHistoryDrawer } from '@/components/admin/CustomerHistoryDrawer';
import { CustomerVehicle, CarSize } from './types';
import { RefObject } from 'react';

interface CustomerSectionProps {
  instanceId: string;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  phoneError?: string;
  searchingCustomer: boolean;
  foundVehicles: CustomerVehicle[];
  showPhoneDropdown: boolean;
  onSelectVehicle: (vehicle: CustomerVehicle) => void;
  onCustomerSelect: (customer: {
    id: string;
    name: string;
    phone: string;
    has_no_show?: boolean;
  }) => void;
  onClearCustomer: () => void;
  suppressAutoSearch?: boolean;
  phoneInputRef: RefObject<HTMLDivElement>;
  setCarModel: (model: string) => void;
  setCarSize: (size: CarSize) => void;
  noShowWarning?: { customerName: string; date: string; serviceName: string } | null;
  onOpenReservation?: (reservationId: string) => void;
  selectedCustomerId?: string | null;
}

export const CustomerSection = ({
  instanceId,
  customerName,
  onCustomerNameChange,
  phone,
  onPhoneChange,
  phoneError,
  searchingCustomer,
  foundVehicles,
  showPhoneDropdown,
  onSelectVehicle,
  onCustomerSelect,
  onClearCustomer,
  suppressAutoSearch,
  phoneInputRef,
  setCarModel,
  setCarSize,
  noShowWarning,
  onOpenReservation,
  selectedCustomerId,
}: CustomerSectionProps) => {
  const { t } = useTranslation();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [visitCount, setVisitCount] = useState<number | null>(null);

  const customerPhone = selectedCustomerId ? normalizePhone(phone) : null;

  // Fetch visit count when a customer is selected
  useEffect(() => {
    if (!customerPhone || !instanceId) {
      setVisitCount(null);
      setHistoryOpen(false);
      return;
    }

    let cancelled = false;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('instance_id', instanceId)
        .eq('customer_phone', customerPhone)
        .neq('status', 'cancelled');
      if (cancelled) return;
      if (error) {
        console.error('Error fetching visit count:', error);
        return;
      }
      setVisitCount(count ?? 0);
    };

    fetchCount();
    return () => { cancelled = true; };
  }, [customerPhone, instanceId]);

  const handleCustomerSelect = async (customer: {
    id: string;
    name: string;
    phone: string;
    has_no_show?: boolean;
  }) => {
    onCustomerSelect(customer);

    const custPhone = normalizePhone(customer.phone);
    const { data: vehicleData } = await supabase
      .from('customer_vehicles')
      .select('model, car_size')
      .eq('instance_id', instanceId)
      .eq('phone', custPhone)
      .order('last_used_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (vehicleData) {
      setCarModel(vehicleData.model);
      if (vehicleData.car_size === 'S') setCarSize('small');
      else if (vehicleData.car_size === 'L') setCarSize('large');
      else setCarSize('medium');
    }
  };

  return (
    <>
      {/* Phone */}
      <div className="space-y-2" ref={phoneInputRef}>
        <div className="flex items-center gap-2">
          <Label>
            {t('addReservation.customerPhone')} <span className="text-destructive">*</span>
          </Label>
          {searchingCustomer && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <PhoneMaskedInput
          value={phone}
          onChange={onPhoneChange}
          className={phoneError ? 'border-destructive' : ''}
          data-testid="phone-input"
          autoFocus
        />
        {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}

        {/* No-show warning banner */}
        {noShowWarning && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">
              Klient <strong>{noShowWarning.customerName}</strong> był nieobecny na wizycie{' '}
              {noShowWarning.date}, usługa: {noShowWarning.serviceName}
            </span>
          </div>
        )}

        {/* Phone search results dropdown */}
        {showPhoneDropdown && foundVehicles.length > 0 && (
          <div className="absolute z-50 w-[calc(100%-3rem)] mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {foundVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                className="w-full p-4 text-left hover:bg-hover transition-colors flex flex-col border-b border-border last:border-0"
                onClick={() => onSelectVehicle(vehicle)}
              >
                <div className="font-semibold text-base text-foreground">
                  {vehicle.customer_name || formatPhoneDisplay(vehicle.phone)}
                </div>
                <div className="text-sm">
                  <span className="text-primary font-medium">
                    {formatPhoneDisplay(vehicle.phone)}
                  </span>
                  {vehicle.model && <span className="text-foreground"> • {vehicle.model}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Name */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="name">{t('addReservation.customerNameAlias')}</Label>
          {visitCount != null && visitCount > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <History className="w-3.5 h-3.5" />
              Historia ({visitCount})
            </button>
          )}
        </div>
        <ClientSearchAutocomplete
          instanceId={instanceId}
          value={customerName}
          onChange={(val) => {
            onCustomerNameChange(val);
            onClearCustomer();
          }}
          onSelect={handleCustomerSelect}
          onClear={onClearCustomer}
          suppressAutoSearch={suppressAutoSearch}
        />
      </div>

      {/* History Drawer */}
      {customerPhone && (
        <CustomerHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          customerPhone={customerPhone}
          customerName={customerName || customerPhone}
          instanceId={instanceId}
          onOpenReservation={onOpenReservation}
        />
      )}
    </>
  );
};

export default CustomerSection;
