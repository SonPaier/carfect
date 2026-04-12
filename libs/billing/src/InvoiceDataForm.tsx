import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
} from '@shared/ui';
import type { BillingData } from './billing.types';

const invoiceSchema = z.object({
  billing_nip: z
    .string()
    .min(1, 'NIP jest wymagany')
    .refine(
      (val) => val.replace(/[^0-9]/g, '').length === 10,
      { message: 'NIP musi mieć 10 cyfr' },
    ),
  billing_name: z.string().min(1, 'Nazwa firmy jest wymagana'),
  billing_street: z.string().min(1, 'Ulica jest wymagana'),
  billing_postal_code: z.string().min(1, 'Kod pocztowy jest wymagany'),
  billing_city: z.string().min(1, 'Miasto jest wymagane'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface GusLookup {
  lookupNip: (nip: string) => Promise<{ name: string; street: string; postalCode: string; city: string } | null>;
  loading: boolean;
}

export interface InvoiceDataFormLabels {
  title: string;
  nip: string;
  companyName: string;
  street: string;
  postalCode: string;
  city: string;
  gusButton: string;
  saveButton: string;
}

const DEFAULT_LABELS: InvoiceDataFormLabels = {
  title: 'Dane do faktury',
  nip: 'NIP',
  companyName: 'Nazwa firmy',
  street: 'Ulica',
  postalCode: 'Kod pocztowy',
  city: 'Miasto',
  gusButton: 'Pobierz z GUS',
  saveButton: 'Zapisz dane do faktury',
};

interface InvoiceDataFormProps {
  initialData: BillingData;
  onSave: (data: BillingData) => Promise<void>;
  gusLookup: GusLookup;
  labels?: Partial<InvoiceDataFormLabels>;
}

export function InvoiceDataForm({ initialData, onSave, gusLookup, labels: labelsProp }: InvoiceDataFormProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      billing_nip: initialData.billing_nip ?? '',
      billing_name: initialData.billing_name ?? '',
      billing_street: initialData.billing_street ?? '',
      billing_postal_code: initialData.billing_postal_code ?? '',
      billing_city: initialData.billing_city ?? '',
    },
  });

  const handleGusLookup = async () => {
    const nip = getValues('billing_nip') ?? '';
    const result = await gusLookup.lookupNip(nip);
    if (result) {
      setValue('billing_name', result.name, { shouldValidate: true });
      setValue('billing_street', result.street, { shouldValidate: true });
      setValue('billing_postal_code', result.postalCode, { shouldValidate: true });
      setValue('billing_city', result.city, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h4 className="text-base font-semibold mb-4">{labels.title}</h4>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="billing_nip">{labels.nip} *</Label>
            <div className="flex gap-2">
              <Input
                id="billing_nip"
                {...register('billing_nip')}
                placeholder="0000000000"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGusLookup}
                disabled={gusLookup.loading}
              >
                {gusLookup.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {labels.gusButton}
              </Button>
            </div>
            {errors.billing_nip && (
              <p className="text-sm text-destructive">{errors.billing_nip.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="billing_name">{labels.companyName} *</Label>
            <Input
              id="billing_name"
              {...register('billing_name')}
            />
            {errors.billing_name && (
              <p className="text-sm text-destructive">{errors.billing_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="billing_street">{labels.street} *</Label>
            <Input
              id="billing_street"
              {...register('billing_street')}
            />
            {errors.billing_street && (
              <p className="text-sm text-destructive">{errors.billing_street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-4">
            <div className="space-y-1">
              <Label htmlFor="billing_postal_code">{labels.postalCode} *</Label>
              <Input
                id="billing_postal_code"
                {...register('billing_postal_code')}
                placeholder="00-000"
                className="w-32"
              />
              {errors.billing_postal_code && (
                <p className="text-sm text-destructive">{errors.billing_postal_code.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="billing_city">{labels.city} *</Label>
              <Input
                id="billing_city"
                {...register('billing_city')}
              />
              {errors.billing_city && (
                <p className="text-sm text-destructive">{errors.billing_city.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {labels.saveButton}
            </Button>
          </div>
        </form>
    </div>
  );
}
