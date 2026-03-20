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
    <div>
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
    <div>
      <Label htmlFor={`${prefix}-street`}>Ulica</Label>
      <Input
        id={`${prefix}-street`}
        placeholder="Linia 1"
        value={street}
        onChange={(e) => onStreetChange(e.target.value)}
      />
      {country !== 'PL' && (
        <Input
          id={`${prefix}-street-line2`}
          className="mt-1"
          placeholder="Linia 2"
          value={streetLine2}
          onChange={(e) => onStreetLine2Change(e.target.value)}
        />
      )}
    </div>
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <div>
        <Label htmlFor={`${prefix}-postal`}>Kod pocztowy</Label>
        <Input
          id={`${prefix}-postal`}
          placeholder="00-000"
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-city`}>Miasto</Label>
        <Input id={`${prefix}-city`} value={city} onChange={(e) => onCityChange(e.target.value)} />
      </div>
    </div>
  </>
);
