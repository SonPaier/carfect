import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Trash2, Pencil, Image as ImageIcon } from 'lucide-react';
import { Button, Input, Label } from '@shared/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CompanySettingsFormProps {
  instanceId: string | null;
  instanceData: Record<string, unknown>;
  onInstanceUpdate: (data: Record<string, unknown>) => void;
}

const CompanySettingsForm = ({
  instanceId,
  instanceData,
  onInstanceUpdate,
}: CompanySettingsFormProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyForm, setCompanyForm] = useState({
    name: '',
    short_name: '',
    invoice_company_name: '',
    nip: '',
    phone: '',
    reservation_phone: '',
    email: '',
    address: '',
    logo_url: '',
    social_facebook: '',
    social_instagram: '',
    google_maps_url: '',
    website: '',
    contact_person: '',
  });
  const [bankAccounts, setBankAccounts] = useState<{ name: string; number: string }[]>([
    { name: '', number: '' },
  ]);

  // Populate form when instanceData changes
  useEffect(() => {
    if (instanceData) {
      setCompanyForm({
        name: (instanceData.name as string) || '',
        short_name: (instanceData.short_name as string) || '',
        invoice_company_name: (instanceData.invoice_company_name as string) || '',
        nip: (instanceData.nip as string) || '',
        phone: (instanceData.phone as string) || '',
        reservation_phone: (instanceData.reservation_phone as string) || '',
        email: (instanceData.email as string) || '',
        address: (instanceData.address as string) || '',
        logo_url: (instanceData.logo_url as string) || '',
        social_facebook: (instanceData.social_facebook as string) || '',
        social_instagram: (instanceData.social_instagram as string) || '',
        google_maps_url: (instanceData.google_maps_url as string) || '',
        website: (instanceData.website as string) || '',
        contact_person: (instanceData.contact_person as string) || '',
      });
      const accounts = instanceData.bank_accounts;
      if (Array.isArray(accounts) && accounts.length > 0) {
        const normalized = (accounts as (string | { name?: string; number?: string })[]).map((a) =>
          typeof a === 'string'
            ? { name: '', number: a }
            : { name: a.name || '', number: a.number || '' },
        );
        setBankAccounts(normalized);
      } else {
        setBankAccounts([{ name: '', number: '' }]);
      }
    }
  }, [instanceData]);

  const handleInputChange = (field: string, value: string) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !instanceId) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('instanceSettings.selectImageFile'));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('instanceSettings.maxFileSize'));
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${instanceId}/logo-${Date.now()}.${fileExt}`;

      if (companyForm.logo_url) {
        const urlParts = companyForm.logo_url.split('/instance-logos/');
        if (urlParts[1]) {
          await supabase.storage.from('instance-logos').remove([urlParts[1]]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('instance-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('instance-logos').getPublicUrl(fileName);

      setCompanyForm((prev) => ({ ...prev, logo_url: publicUrl }));

      // Auto-save logo_url to database immediately
      const { error: updateError } = await supabase
        .from('instances')
        .update({ logo_url: publicUrl })
        .eq('id', instanceId);

      if (updateError) throw updateError;

      // Invalidate instance data cache so sidebar picks it up
      queryClient.invalidateQueries({ queryKey: ['instance_data', instanceId] });

      toast.success(t('instanceSettings.logoUploaded'));
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(t('instanceSettings.logoUploadError'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyForm.logo_url || !instanceId) return;

    try {
      const urlParts = companyForm.logo_url.split('/instance-logos/');
      if (urlParts[1]) {
        await supabase.storage.from('instance-logos').remove([urlParts[1]]);
      }
      setCompanyForm((prev) => ({ ...prev, logo_url: '' }));

      // Auto-save removal to database
      await supabase.from('instances').update({ logo_url: null }).eq('id', instanceId);
      queryClient.invalidateQueries({ queryKey: ['instance_data', instanceId] });

      toast.success(t('instanceSettings.logoRemoved'));
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error(t('instanceSettings.logoRemoveError'));
    }
  };

  const handleSaveCompany = async () => {
    if (!instanceId) return;
    if (loading) return;

    // Validation — collect all errors
    const errors: Record<string, string> = {};

    if (!companyForm.name.trim()) {
      errors.name = 'Nazwa myjni jest wymagana';
    }

    if (companyForm.short_name && companyForm.short_name.length > 11) {
      errors.short_name = 'Maksymalnie 11 znaków';
    }

    if (companyForm.nip) {
      const nipDigits = companyForm.nip.replace(/[\s-]/g, '');
      if (!/^\d{10}$/.test(nipDigits)) {
        errors.nip = 'NIP musi mieć dokładnie 10 cyfr';
      }
    }

    if (companyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyForm.email)) {
      errors.email = 'Podaj poprawny adres email';
    }

    if (companyForm.phone && companyForm.phone.replace(/\D/g, '').length < 9) {
      errors.phone = 'Numer telefonu musi mieć co najmniej 9 cyfr';
    }

    if (
      companyForm.reservation_phone &&
      companyForm.reservation_phone.replace(/\D/g, '').length < 9
    ) {
      errors.reservation_phone = 'Numer telefonu musi mieć co najmniej 9 cyfr';
    }

    const urlFields: { field: keyof typeof companyForm; label: string }[] = [
      { field: 'website', label: 'Strona WWW' },
      { field: 'social_facebook', label: 'Facebook' },
      { field: 'social_instagram', label: 'Instagram' },
      { field: 'google_maps_url', label: 'Google Maps' },
    ];
    for (const { field } of urlFields) {
      const value = companyForm[field];
      if (value && !/^https?:\/\//.test(value)) {
        errors[field] = 'Adres musi zaczynać się od http:// lub https://';
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('instances')
        .update({
          name: companyForm.name,
          short_name: companyForm.short_name || null,
          invoice_company_name: companyForm.invoice_company_name || null,
          nip: companyForm.nip || null,
          phone: companyForm.phone || null,
          reservation_phone: companyForm.reservation_phone || null,
          email: companyForm.email || null,
          address: companyForm.address || null,
          logo_url: companyForm.logo_url || null,
          social_facebook: companyForm.social_facebook || null,
          social_instagram: companyForm.social_instagram || null,
          google_maps_url: companyForm.google_maps_url || null,
          website: companyForm.website || null,
          contact_person: companyForm.contact_person || null,
          bank_accounts: bankAccounts.filter((a) => a.number.trim() !== ''),
        })
        .eq('id', instanceId);

      if (error) throw error;

      onInstanceUpdate({ ...instanceData, ...companyForm });
      toast.success(t('settings.saved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('settings.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    formErrors[field] ? (
      <p className="text-xs text-destructive mt-1">{formErrors[field]}</p>
    ) : null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Dane firmy</h3>

      {/* Logo + main name fields side by side on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Logo with overlay icons */}
        <div className="shrink-0">
          <div
            className="relative w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer group hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingLogo ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : companyForm.logo_url ? (
              <img
                src={companyForm.logo_url}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}

            {/* Hover overlay */}
            {!uploadingLogo && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <div className="flex gap-2">
                  <Pencil className="w-4 h-4 text-white" />
                  {companyForm.logo_url && (
                    <Trash2
                      className="w-4 h-4 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLogo();
                      }}
                    />
                  )}
                </div>
                <span className="text-white text-xs font-medium">Zmień</span>
              </div>
            )}
          </div>
        </div>

        {/* Name fields to the right of logo */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('instanceSettings.carWashName')} *</Label>
            <Input
              id="name"
              value={companyForm.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={cn(formErrors.name ? 'border-destructive' : '')}
            />
            <FieldError field="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="short_name">{t('instanceSettings.shortName')} *</Label>
            <Input
              id="short_name"
              value={companyForm.short_name}
              onChange={(e) => handleInputChange('short_name', e.target.value)}
              maxLength={11}
              className={cn(formErrors.short_name ? 'border-destructive' : '')}
            />
            <FieldError field="short_name" />
            <p className="text-xs text-muted-foreground">
              Używana w wiadomościach SMS, max 11 znaków
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />

      {/* Invoice Company Name + NIP on one line */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_company_name">
            {t('instanceSettings.invoiceCompanyName')}
          </Label>
          <Input
            id="invoice_company_name"
            value={companyForm.invoice_company_name}
            onChange={(e) => handleInputChange('invoice_company_name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nip">{t('instanceSettings.nip')}</Label>
          <Input
            id="nip"
            value={companyForm.nip}
            onChange={(e) => handleInputChange('nip', e.target.value)}
            maxLength={13}
            className={cn(formErrors.nip ? 'border-destructive' : '')}
          />
          <FieldError field="nip" />
        </div>
      </div>

      {/* Contact fields 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t('instanceSettings.phone')}</Label>
          <Input
            id="phone"
            type="tel"
            value={companyForm.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={cn(formErrors.phone ? 'border-destructive' : '')}
          />
          <FieldError field="phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reservation_phone">{t('instanceSettings.reservationPhone')}</Label>
          <Input
            id="reservation_phone"
            type="tel"
            value={companyForm.reservation_phone}
            onChange={(e) => handleInputChange('reservation_phone', e.target.value)}
            className={cn(formErrors.reservation_phone ? 'border-destructive' : '')}
          />
          <FieldError field="reservation_phone" />
          <p className="text-xs text-muted-foreground">
            {t('instanceSettings.reservationPhoneDescription')}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('instanceSettings.email')}</Label>
          <Input
            id="email"
            type="email"
            value={companyForm.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={cn(formErrors.email ? 'border-destructive' : '')}
          />
          <FieldError field="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">{t('instanceSettings.address')}</Label>
          <Input
            id="address"
            value={companyForm.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />
        </div>
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <Label htmlFor="contact_person">{t('instanceSettings.contactPerson')}</Label>
        <Input
          id="contact_person"
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
              className="w-full sm:w-[40%] shrink-0"
              aria-label={`Nazwa konta ${index + 1}`}
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
              aria-label={`Numer konta ${index + 1}`}
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
          + Dodaj kolejne konto bankowe
        </button>
      </div>

      {/* Web/social links 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website">{t('instanceSettings.website')}</Label>
          <Input
            id="website"
            type="url"
            value={companyForm.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className={cn(formErrors.website ? 'border-destructive' : '')}
          />
          <FieldError field="website" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_facebook">{t('instanceSettings.facebook')}</Label>
          <Input
            id="social_facebook"
            value={companyForm.social_facebook}
            onChange={(e) => handleInputChange('social_facebook', e.target.value)}
            className={cn(formErrors.social_facebook ? 'border-destructive' : '')}
          />
          <FieldError field="social_facebook" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_instagram">{t('instanceSettings.instagram')}</Label>
          <Input
            id="social_instagram"
            value={companyForm.social_instagram}
            onChange={(e) => handleInputChange('social_instagram', e.target.value)}
            className={cn(formErrors.social_instagram ? 'border-destructive' : '')}
          />
          <FieldError field="social_instagram" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_maps_url">{t('instanceSettings.googleMaps')}</Label>
          <Input
            id="google_maps_url"
            value={companyForm.google_maps_url}
            onChange={(e) => handleInputChange('google_maps_url', e.target.value)}
            className={cn(formErrors.google_maps_url ? 'border-destructive' : '')}
          />
          <FieldError field="google_maps_url" />
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSaveCompany} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {t('common.save')}
      </Button>
    </div>
  );
};

export default CompanySettingsForm;
