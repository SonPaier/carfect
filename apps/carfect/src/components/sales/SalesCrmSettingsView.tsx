import { useState, useEffect } from 'react';
import { IntegrationsSettingsView } from '@shared/invoicing';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SalesCrmSettingsViewProps {
  instanceId: string | null;
  instanceData: any;
}

const SalesCrmSettingsView = ({ instanceId, instanceData }: SalesCrmSettingsViewProps) => {
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Ustawienia</h2>

      {/* Fakturownia / iFirma Integration */}
      <div className="space-y-2">
        <h3 className="text-base font-medium">Fakturowanie</h3>
        <IntegrationsSettingsView
          instanceId={instanceId}
          supabaseClient={supabase}
          supabaseProjectId={import.meta.env.VITE_SUPABASE_PROJECT_ID}
          providers={['fakturownia']}
        />
      </div>

      <Separator />

      {/* Apaczka Integration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Apaczka</CardTitle>
          <CardDescription>Integracja z apaczka.pl — klucze API i adres nadawcy</CardDescription>
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
              onChange={(e) => setApaczkaServiceId(e.target.value ? Number(e.target.value) : '')}
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
};

export default SalesCrmSettingsView;
