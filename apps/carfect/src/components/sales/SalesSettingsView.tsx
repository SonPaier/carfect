import { useState, useRef, useEffect } from 'react';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useSalesSettings,
  useSaveSalesSettings,
  type SalesCompanyData,
} from './hooks/useSalesSettings';

const SalesSettingsView = () => {
  const { roles } = useAuth();
  const instanceId = roles.find((r) => r.instance_id)?.instance_id || null;
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: loadingSettings } = useSalesSettings(instanceId);
  const saveMutation = useSaveSalesSettings(instanceId);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyForm, setCompanyForm] = useState<Omit<SalesCompanyData, 'bank_accounts'>>({
    name: '',
    short_name: '',
    invoice_company_name: '',
    nip: '',
    phone: '',
    email: '',
    address: '',
    logo_url: '',
    website: '',
    contact_person: '',
    social_facebook: '',
    social_instagram: '',
    google_maps_url: '',
  });
  const [bankAccounts, setBankAccounts] = useState<{ name: string; number: string }[]>([
    { name: '', number: '' },
  ]);

  // Populate form when data loads
  useEffect(() => {
    if (settingsData) {
      setCompanyForm({
        name: settingsData.name || '',
        short_name: settingsData.short_name || '',
        invoice_company_name: settingsData.invoice_company_name || '',
        nip: settingsData.nip || '',
        phone: settingsData.phone || '',
        email: settingsData.email || '',
        address: settingsData.address || '',
        logo_url: settingsData.logo_url || '',
        website: settingsData.website || '',
        contact_person: settingsData.contact_person || '',
        social_facebook: settingsData.social_facebook || '',
        social_instagram: settingsData.social_instagram || '',
        google_maps_url: settingsData.google_maps_url || '',
      });
      const accounts = settingsData.bank_accounts;
      if (Array.isArray(accounts) && accounts.length > 0) {
        const normalized = accounts.map((a: unknown) =>
          typeof a === 'string'
            ? { name: '', number: a }
            : { name: (a as { name?: string }).name || '', number: (a as { number?: string }).number || '' },
        );
        setBankAccounts(normalized);
      } else {
        setBankAccounts([{ name: '', number: '' }]);
      }
    }
  }, [settingsData]);

  const handleInputChange = (field: string, value: string) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !instanceId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Wybierz plik graficzny');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Maksymalny rozmiar pliku to 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${instanceId}/sales-logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (companyForm.logo_url) {
        const urlParts = companyForm.logo_url.split('/sales-logos/');
        if (urlParts[1]) {
          await supabase.storage.from('sales-logos').remove([urlParts[1]]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('sales-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('sales-logos').getPublicUrl(fileName);

      setCompanyForm((prev) => ({ ...prev, logo_url: publicUrl }));

      // Auto-save logo_url to database immediately
      await (supabase
        .from('sales_instance_settings')
        .upsert(
          { instance_id: instanceId, logo_url: publicUrl, updated_at: new Date().toISOString() },
          { onConflict: 'instance_id' },
        ) as unknown);

      queryClient.invalidateQueries({ queryKey: ['sales_instance_settings', instanceId] });
      toast.success('Logo zostało załadowane');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Nie udało się załadować logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyForm.logo_url || !instanceId) return;

    try {
      const urlParts = companyForm.logo_url.split('/sales-logos/');
      if (urlParts[1]) {
        await supabase.storage.from('sales-logos').remove([urlParts[1]]);
      }
      setCompanyForm((prev) => ({ ...prev, logo_url: '' }));

      // Auto-save removal to database
      await (supabase
        .from('sales_instance_settings')
        .upsert(
          { instance_id: instanceId, logo_url: null, updated_at: new Date().toISOString() },
          { onConflict: 'instance_id' },
        ) as unknown);

      queryClient.invalidateQueries({ queryKey: ['sales_instance_settings', instanceId] });
      toast.success('Logo zostało usunięte');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Nie udało się usunąć logo');
    }
  };

  const handleSave = () => {
    saveMutation.mutate({ ...companyForm, bank_accounts: bankAccounts });
  };

  if (loadingSettings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Dane firmy</h2>

      {/* Logo */}
      <div className="space-y-3">
        <Label>Logo firmy</Label>
        <div className="flex items-center gap-4">
          <div
            className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingLogo ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : companyForm.logo_url ? (
              <img src={companyForm.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              <Upload className="w-4 h-4 mr-2" />
              {companyForm.logo_url ? 'Zmień logo' : 'Załaduj logo'}
            </Button>
            {companyForm.logo_url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń logo
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="sales-name">Nazwa firmy *</Label>
        <Input
          id="sales-name"
          value={companyForm.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
      </div>

      {/* Short Name */}
      <div className="space-y-2">
        <Label htmlFor="sales-short_name">Skrócona nazwa firmy (do SMS) *</Label>
        <Input
          id="sales-short_name"
          value={companyForm.short_name}
          onChange={(e) => handleInputChange('short_name', e.target.value)}
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">Używana w wiadomościach SMS, max 20 znaków</p>
      </div>

      {/* Invoice Company Name */}
      <div className="space-y-2">
        <Label htmlFor="sales-invoice_company_name">Nazwa firmy (do faktury)</Label>
        <Input
          id="sales-invoice_company_name"
          value={companyForm.invoice_company_name}
          onChange={(e) => handleInputChange('invoice_company_name', e.target.value)}
        />
      </div>

      {/* NIP */}
      <div className="space-y-2">
        <Label htmlFor="sales-nip">NIP</Label>
        <Input
          id="sales-nip"
          value={companyForm.nip}
          onChange={(e) => handleInputChange('nip', e.target.value)}
          maxLength={13}
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="sales-phone">Telefon</Label>
        <Input
          id="sales-phone"
          type="tel"
          value={companyForm.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="sales-email">Email</Label>
        <Input
          id="sales-email"
          type="email"
          value={companyForm.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="sales-address">Adres</Label>
        <Input
          id="sales-address"
          value={companyForm.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <Label htmlFor="sales-contact_person">Osoba kontaktowa</Label>
        <Input
          id="sales-contact_person"
          value={companyForm.contact_person}
          onChange={(e) => handleInputChange('contact_person', e.target.value)}
        />
      </div>

      {/* Bank Accounts */}
      <div className="space-y-2">
        <Label>Nr konta bankowego</Label>
        {bankAccounts.map((account, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={account.name}
              onChange={(e) => {
                const updated = [...bankAccounts];
                updated[index] = { ...updated[index], name: e.target.value };
                setBankAccounts(updated);
              }}
              placeholder="Nazwa konta"
              className="w-40 shrink-0"
            />
            <Input
              value={account.number}
              onChange={(e) => {
                const updated = [...bankAccounts];
                updated[index] = { ...updated[index], number: e.target.value };
                setBankAccounts(updated);
              }}
              placeholder="00 0000 0000 0000 0000 0000 0000"
              className="font-mono flex-1"
            />
            {bankAccounts.length > 1 && (
              <button
                type="button"
                onClick={() => setBankAccounts(bankAccounts.filter((_, i) => i !== index))}
                className="text-sm text-destructive hover:underline shrink-0"
              >
                Usuń
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setBankAccounts([...bankAccounts, { name: '', number: '' }])}
          className="text-sm text-primary hover:underline"
        >
          + Dodaj numer konta bankowego
        </button>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="sales-website">Strona www</Label>
        <Input
          id="sales-website"
          type="url"
          value={companyForm.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
        />
      </div>

      {/* Social Links */}
      <div className="space-y-2">
        <Label htmlFor="sales-social_facebook">Facebook</Label>
        <Input
          id="sales-social_facebook"
          value={companyForm.social_facebook}
          onChange={(e) => handleInputChange('social_facebook', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sales-social_instagram">Instagram</Label>
        <Input
          id="sales-social_instagram"
          value={companyForm.social_instagram}
          onChange={(e) => handleInputChange('social_instagram', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sales-google_maps_url">Google Maps</Label>
        <Input
          id="sales-google_maps_url"
          value={companyForm.google_maps_url}
          onChange={(e) => handleInputChange('google_maps_url', e.target.value)}
        />
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saveMutation.isPending}>
        {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Zapisz
      </Button>
    </div>
  );
};

export default SalesSettingsView;
