import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useGusLookup } from '@shared/utils';
import { supabase } from '@/integrations/supabase/client';

export interface NipLookupData {
  nip: string;
  company: string;
  billingStreet: string;
  billingPostalCode: string;
  billingCity: string;
}

interface NipLookupFormProps {
  value: NipLookupData;
  onChange: (data: NipLookupData) => void;
  readOnly?: boolean;
}

const NipLookupForm = ({ value, onChange, readOnly = false }: NipLookupFormProps) => {
  const { lookupNip: gusLookup, loading } = useGusLookup({
    supabase,
    onSuccess: (result) => {
      onChange({
        nip: value.nip,
        company: result.name,
        billingStreet: result.street,
        billingPostalCode: result.postalCode,
        billingCity: result.city,
      });
      toast.success('Pobrano dane firmy');
    },
    onError: (msg) => toast.error(msg),
  });

  const update = (field: keyof NipLookupData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const handleLookup = () => {
    gusLookup(value.nip);
  };

  if (readOnly) {
    return (
      <div className="space-y-2 text-sm">
        {value.nip && <div><span className="font-medium">NIP:</span> {value.nip}</div>}
        {value.company && <div><span className="font-medium">Firma:</span> {value.company}</div>}
        {value.billingStreet && <div><span className="font-medium">Adres:</span> {value.billingStreet}</div>}
        {(value.billingPostalCode || value.billingCity) && (
          <div>{value.billingPostalCode} {value.billingCity}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block text-xs">NIP</Label>
        <div className="flex items-center gap-2">
          <Input
            value={value.nip}
            onChange={e => update('nip', e.target.value)}
            placeholder="0000000000"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLookup}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
            {loading ? 'Szukam...' : 'Pobierz dane'}
          </Button>
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Nazwa firmy</Label>
        <Input value={value.company} onChange={e => update('company', e.target.value)} placeholder="Nazwa firmy" />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Ulica</Label>
        <Input value={value.billingStreet} onChange={e => update('billingStreet', e.target.value)} placeholder="Ulica i numer" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1.5 block text-xs">Kod pocztowy</Label>
          <Input value={value.billingPostalCode} onChange={e => update('billingPostalCode', e.target.value)} placeholder="00-000" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Miasto</Label>
          <Input value={value.billingCity} onChange={e => update('billingCity', e.target.value)} placeholder="Miasto" />
        </div>
      </div>
    </div>
  );
};

export default NipLookupForm;
