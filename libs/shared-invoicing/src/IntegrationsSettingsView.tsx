import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui';
import { Switch } from '@shared/ui';
import { Label } from '@shared/ui';
import { Input } from '@shared/ui';
import { Button } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInvoicingSettings } from './useInvoicingSettings';
import { FakturowniaConfigForm } from './FakturowniaConfigForm';
import { IfirmaConfigForm } from './IfirmaConfigForm';
import type {
  InvoicingProvider,
  FakturowniaConfig,
  IfirmaConfig,
  DocumentKind,
  PaymentType,
  ProviderConfig,
} from './invoicing.types';
import { VAT_RATES, DOCUMENT_KINDS, CURRENCIES, PAYMENT_TYPES } from './invoicing.types';

interface IntegrationsSettingsViewProps {
  instanceId: string | null;
  supabaseClient: any; // SupabaseClient
  supabaseProjectId?: string;
  /** Which providers to show. Defaults to both. */
  providers?: InvoicingProvider[];
}

export function IntegrationsSettingsView({
  instanceId,
  supabaseClient,
  supabaseProjectId,
  providers,
}: IntegrationsSettingsViewProps) {
  const showFakturownia = !providers || providers.includes('fakturownia');
  const showIfirma = !providers || providers.includes('ifirma');
  const { settings, isLoading, saveSettings, isSaving } = useInvoicingSettings(
    instanceId,
    supabaseClient,
  );

  const [activeProvider, setActiveProvider] = useState<InvoicingProvider | null>(null);
  const [fakturowniaConfig, setFakturowniaConfig] = useState<FakturowniaConfig>({
    domain: '',
    api_token: '',
  });
  const [ifirmaConfig, setIfirmaConfig] = useState<IfirmaConfig>({
    invoice_api_user: '',
    invoice_api_key: '',
  });
  const [vatRate, setVatRate] = useState(23);
  const [paymentDays, setPaymentDays] = useState(14);
  const [documentKind, setDocumentKind] = useState<DocumentKind>('vat');
  const [currency, setCurrency] = useState('PLN');
  const [defaultPaymentType, setDefaultPaymentType] = useState<PaymentType>('transfer');
  const [defaultPlace, setDefaultPlace] = useState('');
  const [defaultSellerPerson, setDefaultSellerPerson] = useState('');
  const [autoSendEmail, setAutoSendEmail] = useState(false);

  useEffect(() => {
    if (settings) {
      setActiveProvider(settings.active ? (settings.provider as InvoicingProvider) : null);
      setVatRate(settings.default_vat_rate);
      setPaymentDays(settings.default_payment_days);
      setDocumentKind(settings.default_document_kind as DocumentKind);
      setCurrency(settings.default_currency);
      setDefaultPaymentType((settings.default_payment_type as PaymentType) || 'transfer');
      setDefaultPlace(settings.default_place || '');
      setDefaultSellerPerson(settings.default_seller_person || '');
      setAutoSendEmail(settings.auto_send_email);

      if (settings.provider === 'fakturownia' && settings.provider_config) {
        setFakturowniaConfig(settings.provider_config as FakturowniaConfig);
      }
      if (settings.provider === 'ifirma' && settings.provider_config) {
        setIfirmaConfig(settings.provider_config as IfirmaConfig);
      }
    }
  }, [settings]);

  const handleToggleProvider = (provider: InvoicingProvider, enabled: boolean) => {
    if (enabled) {
      setActiveProvider(provider);
    } else {
      setActiveProvider(null);
    }
  };

  const handleSave = async () => {
    const config: ProviderConfig | Record<string, never> =
      activeProvider === 'fakturownia'
        ? fakturowniaConfig
        : activeProvider === 'ifirma'
          ? ifirmaConfig
          : {};

    saveSettings({
      provider: activeProvider,
      provider_config: config as any,
      default_vat_rate: vatRate,
      default_payment_days: paymentDays,
      default_document_kind: documentKind,
      default_currency: currency,
      default_payment_type: defaultPaymentType,
      default_place: defaultPlace || null,
      default_seller_person: defaultSellerPerson || null,
      auto_send_email: autoSendEmail,
      active: !!activeProvider,
    });

    // Auto-register webhook for Fakturownia
    if (
      activeProvider === 'fakturownia' &&
      fakturowniaConfig.domain &&
      fakturowniaConfig.api_token
    ) {
      try {
        const projectId = supabaseProjectId || import.meta.env.VITE_HISERVICE_SUPABASE_PROJECT_ID;
        const webhookUrl = `https://${projectId}.supabase.co/functions/v1/fakturownia-webhook`;

        const res = await fetch(
          `https://${fakturowniaConfig.domain}.fakturownia.pl/webhooks.json`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_token: fakturowniaConfig.api_token,
              webhook: {
                url: webhookUrl,
                kind: 'invoice:update',
                enabled: true,
              },
            }),
          },
        );

        if (res.ok) {
          toast.success('Webhook Fakturowni zarejestrowany');
        } else {
          // Non-critical - webhook may already exist
          console.warn('Webhook registration response:', res.status);
        }
      } catch (e) {
        console.warn('Webhook registration failed (non-critical):', e);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderCommonSettings = () => (
    <div className="space-y-4 pt-4">
      <Separator />
      <h4 className="text-sm font-medium">Ustawienia fakturowania</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Domyslna stawka VAT</Label>
          <Select value={String(vatRate)} onValueChange={(v) => setVatRate(Number(v))}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VAT_RATES.map((r) => (
                <SelectItem key={r.value} value={String(r.value)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Termin platnosci (dni)</Label>
          <Input
            type="number"
            min={1}
            value={paymentDays}
            onChange={(e) => setPaymentDays(Number(e.target.value))}
            className="bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Typ dokumentu</Label>
          <Select value={documentKind} onValueChange={(v) => setDocumentKind(v as DocumentKind)}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_KINDS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Waluta</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Domyslna metoda platnosci</Label>
        <Select
          value={defaultPaymentType}
          onValueChange={(v) => setDefaultPaymentType(v as PaymentType)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_TYPES.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />
      <h4 className="text-sm font-medium">Ustawienia dokumentu</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Miejsce wystawienia</Label>
          <Input
            value={defaultPlace}
            onChange={(e) => setDefaultPlace(e.target.value)}
            placeholder="np. Warszawa"
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label>Podpis wystawcy</Label>
          <Input
            value={defaultSellerPerson}
            onChange={(e) => setDefaultSellerPerson(e.target.value)}
            placeholder="np. Jan Kowalski"
            className="bg-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="auto-send">Automatycznie wysylaj mailem</Label>
        <Switch id="auto-send" checked={autoSendEmail} onCheckedChange={setAutoSendEmail} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Fakturownia Card */}
      {showFakturownia && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Fakturownia</CardTitle>
                <CardDescription>Integracja z fakturownia.pl</CardDescription>
              </div>
              <Switch
                checked={activeProvider === 'fakturownia'}
                onCheckedChange={(v) => handleToggleProvider('fakturownia', v)}
              />
            </div>
          </CardHeader>
          {activeProvider === 'fakturownia' && (
            <CardContent className="pt-0">
              <FakturowniaConfigForm
                config={fakturowniaConfig}
                onChange={setFakturowniaConfig}
                instanceId={instanceId || ''}
                supabaseClient={supabaseClient}
              />
              {renderCommonSettings()}
            </CardContent>
          )}
        </Card>
      )}

      {/* iFirma Card */}
      {showIfirma && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">iFirma</CardTitle>
                <CardDescription>Integracja z ifirma.pl</CardDescription>
              </div>
              <Switch
                checked={activeProvider === 'ifirma'}
                onCheckedChange={(v) => handleToggleProvider('ifirma', v)}
              />
            </div>
          </CardHeader>
          {activeProvider === 'ifirma' && (
            <CardContent className="pt-0">
              <IfirmaConfigForm
                config={ifirmaConfig}
                onChange={setIfirmaConfig}
                instanceId={instanceId || ''}
                supabaseClient={supabaseClient}
              />
              {renderCommonSettings()}
            </CardContent>
          )}
        </Card>
      )}

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Zapisz
      </Button>
    </div>
  );
}
