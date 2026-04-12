import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@shared/ui';
import type { BillingData } from './billing.types';

const invoiceSchema = z.object({
  billing_nip: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        return val.replace(/[^0-9]/g, '').length === 10;
      },
      { message: 'NIP musi mieć 10 cyfr' },
    ),
  billing_name: z.string().optional(),
  billing_street: z.string().optional(),
  billing_postal_code: z.string().optional(),
  billing_city: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface GusLookup {
  lookupNip: (nip: string) => Promise<{ name: string; street: string; postalCode: string; city: string } | null>;
  loading: boolean;
}

interface InvoiceDataFormProps {
  initialData: BillingData;
  onSave: (data: BillingData) => Promise<void>;
  gusLookup: GusLookup;
}

export function InvoiceDataForm({ initialData, onSave, gusLookup }: InvoiceDataFormProps) {
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
      setValue('billing_name', result.name);
      setValue('billing_street', result.street);
      setValue('billing_postal_code', result.postalCode);
      setValue('billing_city', result.city);
    }
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    setSaving(true);
    try {
      await onSave({
        billing_nip: values.billing_nip || null,
        billing_name: values.billing_name || null,
        billing_street: values.billing_street || null,
        billing_postal_code: values.billing_postal_code || null,
        billing_city: values.billing_city || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dane do faktury</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="billing_nip">NIP</Label>
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
                Pobierz z GUS
              </Button>
            </div>
            {errors.billing_nip && (
              <p className="text-sm text-destructive">{errors.billing_nip.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="billing_name">Nazwa firmy</Label>
            <Input
              id="billing_name"
              {...register('billing_name')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="billing_street">Ulica</Label>
            <Input
              id="billing_street"
              {...register('billing_street')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="billing_postal_code">Kod pocztowy</Label>
            <Input
              id="billing_postal_code"
              {...register('billing_postal_code')}
              placeholder="00-000"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="billing_city">Miasto</Label>
            <Input
              id="billing_city"
              {...register('billing_city')}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Zapisz dane do faktury
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
