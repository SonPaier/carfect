import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shared/ui';
import { AddressFields, type AddressData } from './AddressFields';

interface ShippingAddressSectionProps {
  address: AddressData;
  onChange: (address: AddressData) => void;
}

export const ShippingAddressSection = ({ address, onChange }: ShippingAddressSectionProps) => {
  const [open, setOpen] = useState(false);

  const update = (patch: Partial<AddressData>) => onChange({ ...address, ...patch });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Adres dostawy
            {!open && address.city && (
              <span className="text-muted-foreground font-normal">
                — {address.street ? `${address.street}, ` : ''}
                {address.postalCode} {address.city}
              </span>
            )}
          </span>
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-md border border-border bg-background px-3 py-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Zmiany dotyczą wyłącznie tego zamówienia i nie nadpisują adresu klienta.
          </p>
          <AddressFields
            prefix="order-ship"
            country={address.country}
            street={address.street}
            streetLine2={address.streetLine2}
            postalCode={address.postalCode}
            city={address.city}
            onCountryChange={(v) => update({ country: v })}
            onStreetChange={(v) => update({ street: v })}
            onStreetLine2Change={(v) => update({ streetLine2: v })}
            onPostalCodeChange={(v) => update({ postalCode: v })}
            onCityChange={(v) => update({ city: v })}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
