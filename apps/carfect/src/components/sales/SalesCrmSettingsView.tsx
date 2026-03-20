import { useState, useEffect } from 'react';
import { IntegrationsSettingsView } from '@shared/invoicing';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui';
import { Separator } from '@shared/ui';
import {
  Building2,
  FileText,
  Truck,
  Loader2,
  Save,
  ChevronDown,
  Trash2,
  RefreshCw,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SalesSettingsView from './SalesSettingsView';

type SettingsTab = 'company' | 'invoicing' | 'apaczka';

interface SalesCrmSettingsViewProps {
  instanceId: string | null;
  instanceData: any;
}

const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'company', label: 'Dane firmy', icon: <Building2 className="w-4 h-4" /> },
  { key: 'invoicing', label: 'Fakturowanie', icon: <FileText className="w-4 h-4" /> },
  { key: 'apaczka', label: 'Apaczka', icon: <Truck className="w-4 h-4" /> },
];

const SalesCrmSettingsView = ({ instanceId, instanceData }: SalesCrmSettingsViewProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apaczka settings state
  const [apaczkaAppId, setApaczkaAppId] = useState('');
  const [apaczkaAppSecret, setApaczkaAppSecret] = useState('');
  const [apaczkaServices, setApaczkaServices] = useState<
    { name: string; serviceId: number | '' }[]
  >([]);
  const [senderAddress, setSenderAddress] = useState({
    name: '',
    contact_person: '',
    street: '',
    postal_code: '',
    city: '',
    country_code: 'PL',
    phone: '',
    email: '',
  });
  const [savingApaczka, setSavingApaczka] = useState(false);
  const [fetchingServices, setFetchingServices] = useState(false);
  const [availableServices, setAvailableServices] = useState<
    { id: number; name: string; supplier: string; domestic: boolean }[]
  >([]);

  // Populate from instanceData
  useEffect(() => {
    if (instanceData) {
      setApaczkaAppId(instanceData.apaczka_app_id || '');
      setApaczkaAppSecret(instanceData.apaczka_app_secret || '');
      setApaczkaServices(
        (instanceData.apaczka_services || []).map((s: any) => ({
          name: s.name || '',
          serviceId: s.serviceId ?? '',
        })),
      );
      if (instanceData.apaczka_sender_address) {
        setSenderAddress({
          name: instanceData.apaczka_sender_address.name || '',
          contact_person: instanceData.apaczka_sender_address.contact_person || '',
          street: instanceData.apaczka_sender_address.street || '',
          postal_code: instanceData.apaczka_sender_address.postal_code || '',
          city: instanceData.apaczka_sender_address.city || '',
          country_code: instanceData.apaczka_sender_address.country_code || 'PL',
          phone: instanceData.apaczka_sender_address.phone || '',
          email: instanceData.apaczka_sender_address.email || '',
        });
      }
    }
  }, [instanceData]);

  const handleSaveApaczka = async () => {
    if (!instanceId) return;
    setSavingApaczka(true);
    try {
      const { error } = await supabase
        .from('instances')
        .update({
          apaczka_app_id: apaczkaAppId || null,
          apaczka_app_secret: apaczkaAppSecret || null,
          apaczka_services: apaczkaServices.filter((s) => s.name && s.serviceId),
          apaczka_sender_address: senderAddress,
        })
        .eq('id', instanceId);
      if (error) throw error;
      toast.success('Ustawienia Apaczka zapisane');
    } catch (err: any) {
      toast.error('Błąd zapisu: ' + (err.message || ''));
    } finally {
      setSavingApaczka(false);
    }
  };

  const handleSenderAddressChange = (field: string, value: string) => {
    setSenderAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleFetchServices = async () => {
    if (!instanceId) return;
    if (!apaczkaAppId || !apaczkaAppSecret) {
      toast.error('Najpierw uzupełnij App ID i App Secret');
      return;
    }
    setFetchingServices(true);
    try {
      // Save credentials first so the edge function can use them
      await supabase
        .from('instances')
        .update({
          apaczka_app_id: apaczkaAppId,
          apaczka_app_secret: apaczkaAppSecret,
        })
        .eq('id', instanceId);

      const { data, error } = await supabase.functions.invoke('apaczka-services', {
        body: { instanceId },
      });
      if (error) {
        let errDetail = '';
        try {
          const errBody = await (error as any).context?.json?.();
          errDetail = errBody?.error || '';
        } catch {
          /* ignore */
        }
        throw new Error(errDetail || 'Nie udało się pobrać serwisów');
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      setAvailableServices(data.services || []);
      toast.success(`Pobrano ${data.services?.length || 0} serwisów z Apaczka`);
    } catch (err: any) {
      toast.error('Błąd pobierania serwisów: ' + (err.message || ''));
    } finally {
      setFetchingServices(false);
    }
  };

  const toggleService = (service: { id: number; name: string; supplier: string }) => {
    const exists = apaczkaServices.some((s) => s.serviceId === service.id);
    if (exists) {
      setApaczkaServices(apaczkaServices.filter((s) => s.serviceId !== service.id));
    } else {
      setApaczkaServices([
        ...apaczkaServices,
        { name: service.supplier || service.name, serviceId: service.id },
      ]);
    }
  };

  const activeTabData = tabs.find((t) => t.key === activeTab)!;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return <SalesSettingsView />;
      case 'invoicing':
        return (
          <div className="space-y-4">
            <IntegrationsSettingsView
              instanceId={instanceId}
              supabaseClient={supabase}
              supabaseProjectId={import.meta.env.VITE_SUPABASE_PROJECT_ID}
              providers={['fakturownia']}
            />
          </div>
        );
      case 'apaczka':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Apaczka</CardTitle>
                <CardDescription>
                  Integracja z apaczka.pl — klucze API i adres nadawcy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>App ID</Label>
                    <Input
                      value={apaczkaAppId}
                      onChange={(e) => setApaczkaAppId(e.target.value)}
                      placeholder="app_xxxxxxxx"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>App Secret</Label>
                    <Input
                      type="password"
                      value={apaczkaAppSecret}
                      onChange={(e) => setApaczkaAppSecret(e.target.value)}
                      placeholder="Wklej App Secret"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Serwisy kurierskie</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFetchServices}
                      disabled={fetchingServices}
                    >
                      {fetchingServices ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      Pobierz z Apaczka
                    </Button>
                  </div>

                  {availableServices.length > 0 && (
                    <div className="border border-border rounded-md divide-y divide-border max-h-60 overflow-y-auto">
                      {availableServices.map((service) => {
                        const isSelected = apaczkaServices.some((s) => s.serviceId === service.id);
                        return (
                          <button
                            type="button"
                            key={service.id}
                            onClick={() => toggleService(service)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors w-full text-left',
                              isSelected && 'bg-primary/5',
                            )}
                          >
                            <div
                              className={cn(
                                'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-input',
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{service.name}</span>
                              <span className="text-muted-foreground ml-2">
                                ({service.supplier})
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              ID: {service.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {availableServices.length === 0 && apaczkaServices.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Brak skonfigurowanych serwisów. Kliknij "Pobierz z Apaczka" aby załadować
                      dostępne serwisy.
                    </p>
                  )}

                  {apaczkaServices.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Wybrane serwisy:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {apaczkaServices.map((service) => (
                          <span
                            key={service.serviceId}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs"
                          >
                            <Check className="w-3 h-3" />
                            {service.name} (#{service.serviceId})
                            <button
                              type="button"
                              onClick={() =>
                                setApaczkaServices(
                                  apaczkaServices.filter((s) => s.serviceId !== service.serviceId),
                                )
                              }
                              className="ml-0.5 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />
                <h4 className="text-sm font-medium">Adres dostawy</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nazwa firmy</Label>
                    <Input
                      value={senderAddress.name}
                      onChange={(e) => handleSenderAddressChange('name', e.target.value)}
                      className="bg-white h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Osoba kontaktowa</Label>
                    <Input
                      value={senderAddress.contact_person}
                      onChange={(e) => handleSenderAddressChange('contact_person', e.target.value)}
                      className="bg-white h-9"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Ulica</Label>
                    <Input
                      value={senderAddress.street}
                      onChange={(e) => handleSenderAddressChange('street', e.target.value)}
                      className="bg-white h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kod pocztowy</Label>
                    <Input
                      value={senderAddress.postal_code}
                      onChange={(e) => handleSenderAddressChange('postal_code', e.target.value)}
                      placeholder="00-000"
                      className="bg-white h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Miasto</Label>
                    <Input
                      value={senderAddress.city}
                      onChange={(e) => handleSenderAddressChange('city', e.target.value)}
                      className="bg-white h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefon</Label>
                    <Input
                      value={senderAddress.phone}
                      onChange={(e) => handleSenderAddressChange('phone', e.target.value)}
                      className="bg-white h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={senderAddress.email}
                      onChange={(e) => handleSenderAddressChange('email', e.target.value)}
                      className="bg-white h-9"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveApaczka} disabled={savingApaczka}>
                  {savingApaczka ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Zapisz ustawienia Apaczka
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 lg:space-y-0">
      <h2 className="text-xl font-semibold text-foreground lg:hidden">Ustawienia</h2>

      {/* Mobile: collapsible menu */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-border/50 text-sm font-medium"
        >
          <div className="flex items-center gap-3">
            {activeTabData.icon}
            {activeTabData.label}
          </div>
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', mobileMenuOpen && 'rotate-180')}
          />
        </button>
        {mobileMenuOpen && (
          <div className="mt-1 bg-white rounded-lg border border-border/50 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border/30 last:border-0',
                  activeTab === tab.key
                    ? 'bg-hover text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-hover hover:text-foreground',
                )}
                onClick={() => {
                  setActiveTab(tab.key);
                  setMobileMenuOpen(false);
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: sidebar + content */}
      <div className="lg:flex lg:flex-row lg:gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-lg border border-border/50 overflow-hidden sticky top-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border/30 last:border-0',
                  activeTab === tab.key
                    ? 'bg-hover text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-hover hover:text-foreground',
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 mt-4 lg:mt-0">
          <div className="bg-white border border-border rounded-lg p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SalesCrmSettingsView;
