import { useState, useEffect } from 'react';
import { IntegrationsSettingsView } from '@shared/invoicing';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Building2, FileText, Truck, Loader2, Save, ChevronDown } from 'lucide-react';
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
  const [apaczkaServiceId, setApaczkaServiceId] = useState<number | ''>('');
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

  // Populate from instanceData
  useEffect(() => {
    if (instanceData) {
      setApaczkaAppId(instanceData.apaczka_app_id || '');
      setApaczkaAppSecret(instanceData.apaczka_app_secret || '');
      setApaczkaServiceId(instanceData.apaczka_service_id || '');
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
          apaczka_service_id: apaczkaServiceId || null,
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

                <div className="space-y-2">
                  <Label>ID serwisu kurierskiego</Label>
                  <Input
                    type="number"
                    value={apaczkaServiceId}
                    onChange={(e) =>
                      setApaczkaServiceId(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="np. 52"
                    className="bg-white w-40"
                  />
                </div>

                <Separator />
                <h4 className="text-sm font-medium">Adres nadawcy</h4>

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

                <Button onClick={handleSaveApaczka} disabled={savingApaczka} className="w-full">
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
