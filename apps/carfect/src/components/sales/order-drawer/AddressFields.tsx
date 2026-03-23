import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { COUNTRIES } from '../constants';

export interface AddressData {
  country: string;
  street: string;
  streetLine2: string;
  postalCode: string;
  city: string;
}

interface AddressFieldsProps {
  prefix: string;
  country: string;
  street: string;
  streetLine2: string;
  postalCode: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStreetChange: (value: string) => void;
  onStreetLine2Change: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
}

export const AddressFields = ({
  prefix,
  country,
  street,
  streetLine2,
  postalCode,
  city,
  onCountryChange,
  onStreetChange,
  onStreetLine2Change,
  onPostalCodeChange,
  onCityChange,
}: AddressFieldsProps) => (
  <>
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Label htmlFor={`${prefix}-street`}>Ulica</Label>
        <Input
          id={`${prefix}-street`}
          placeholder="Ulica i numer"
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
        />
      </div>
      <div className="w-24 shrink-0">
        <Label htmlFor={`${prefix}-postal`}>Kod</Label>
        <Input
          id={`${prefix}-postal`}
          placeholder="00-000"
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
        />
      </div>
      <div className="flex-1">
        <Label htmlFor={`${prefix}-city`}>Miasto</Label>
        <Input id={`${prefix}-city`} value={city} onChange={(e) => onCityChange(e.target.value)} />
      </div>
      <div className="flex-1">
        <Label htmlFor={`${prefix}-country`}>Kraj</Label>
        <Select value={country} onValueChange={onCountryChange}>
          <SelectTrigger id={`${prefix}-country`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    {country !== 'PL' && (
      <div>
        <Label htmlFor={`${prefix}-street-line2`}>Linia 2</Label>
        <Input
          id={`${prefix}-street-line2`}
          placeholder="Linia 2"
          value={streetLine2}
          onChange={(e) => onStreetLine2Change(e.target.value)}
        />
      </div>
    )}
  </>
);
