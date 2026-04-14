import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Button } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@shared/ui';
import { Search, Loader2, ChevronRight } from 'lucide-react';
import { CustomerData, VehicleData } from '@/hooks/useOffer';
import { toast } from 'sonner';
import { CarSearchAutocomplete, CarSearchValue } from '@/components/ui/car-search-autocomplete';
import ClientSearchAutocomplete, {
  ClientSearchValue,
} from '@/components/ui/client-search-autocomplete';
import { PhoneMaskedInput } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, formatPhoneDisplay } from '@shared/utils';

export interface ValidationErrors {
  name?: string;
  email?: string;
  brandModel?: string;
}

export interface CustomerDataStepHandle {
  scrollToFirstError: (errors: ValidationErrors) => void;
}

interface CustomerDataStepProps {
  instanceId: string;
  customerData: CustomerData;
  vehicleData: VehicleData;
  onCustomerChange: (data: Partial<CustomerData>) => void;
  onVehicleChange: (data: Partial<VehicleData>) => void;
  validationErrors?: ValidationErrors;
  internalNotes?: string;
  onInternalNotesChange?: (value: string) => void;
}

// Parse address from API format: "ULICA NR, KOD MIASTO" or "ULICA NR/LOKAL, KOD MIASTO"
const parseAddress = (fullAddress: string) => {
  if (!fullAddress) return { street: '', postalCode: '', city: '' };

  // Try to match pattern: "STREET, POSTAL_CODE CITY"
  const match = fullAddress.match(/^(.+),\s*(\d{2}-\d{3})\s+(.+)$/);
  if (match) {
    return {
      street: match[1].trim(),
      postalCode: match[2].trim(),
      city: match[3].trim(),
    };
  }

  // Fallback - just return the full address as street
  return { street: fullAddress, postalCode: '', city: '' };
};

const paintTypes = [
  { value: 'gloss', label: 'Połysk' },
  { value: 'matte', label: 'Mat' },
];

// Auto-resizing textarea component
interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

const AutoResizeTextarea = ({
  value,
  minRows = 3,
  className,
  ...props
}: AutoResizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
      const minHeight = lineHeight * minRows;
      textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
    }
  }, [value, minRows]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      className={cn('resize-none overflow-hidden', className)}
      {...props}
    />
  );
};

export const CustomerDataStep = forwardRef<CustomerDataStepHandle, CustomerDataStepProps>(
  (
    {
      instanceId,
      customerData,
      vehicleData,
      onCustomerChange,
      onVehicleChange,
      validationErrors,
      internalNotes,
      onInternalNotesChange,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const [nipLoading, setNipLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const hasCompanyData = !!(customerData.company || customerData.companyAddress || customerData.companyCity);
    const [companyExpanded, setCompanyExpanded] = useState(
      !!(customerData.nip || hasCompanyData),
    );
    // Phone search state
    const [phoneResults, setPhoneResults] = useState<
      Array<{ id: string; name: string; phone: string; email: string | null }>
    >([]);
    const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
    const phoneContainerRef = useRef<HTMLDivElement>(null);

    // Refs for scroll-to-error
    const nameInputRef = useRef<HTMLDivElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const brandModelRef = useRef<HTMLDivElement>(null);

    // Expose scrollToFirstError method to parent
    useImperativeHandle(ref, () => ({
      scrollToFirstError: (errors: ValidationErrors) => {
        if (errors.name && nameInputRef.current) {
          nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = nameInputRef.current.querySelector('input');
          if (input) input.focus();
        } else if (errors.email && emailInputRef.current) {
          emailInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          emailInputRef.current.focus();
        } else if (errors.brandModel && brandModelRef.current) {
          brandModelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Focus the input inside the autocomplete if possible
          const input = brandModelRef.current.querySelector('input');
          if (input) input.focus();
        }
      },
    }));

    // Phone search: debounced lookup in customers table
    const suppressPhoneSearchRef = useRef(false);
    const phoneUserInteractedRef = useRef(false);

    useEffect(() => {
      if (suppressPhoneSearchRef.current) {
        suppressPhoneSearchRef.current = false;
        return;
      }
      if (!phoneUserInteractedRef.current) return;
      const digits = customerData.phone.replace(/\D/g, '');
      if (digits.length < 3) {
        setPhoneResults([]);
        setShowPhoneDropdown(false);
        return;
      }
      let cancelled = false;
      const timer = setTimeout(async () => {
        const { data } = await supabase
          .from('customers')
          .select('id, name, phone, email')
          .eq('instance_id', instanceId)
          .or(`phone.ilike.%${digits}%`)
          .order('updated_at', { ascending: false })
          .limit(5);
        if (cancelled) return;
        if (data && data.length > 0) {
          setPhoneResults(data);
          setShowPhoneDropdown(true);
        } else {
          setPhoneResults([]);
          setShowPhoneDropdown(false);
        }
      }, 300);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [customerData.phone, instanceId]);

    // Close phone dropdown on outside click
    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (phoneContainerRef.current && !phoneContainerRef.current.contains(e.target as Node)) {
          setShowPhoneDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelectPhoneResult = (customer: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    }) => {
      onCustomerChange({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
      });
      setShowPhoneDropdown(false);
    };

    const validateEmail = (email: string): string | null => {
      if (!email) return null; // Empty is valid (will be caught by required validation)

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return 'Nieprawidłowy format adresu email';
      }

      // Check for common domain typos
      const domain = email.split('@')[1]?.toLowerCase() || '';

      // Gmail typos
      if (domain.match(/^g?mail\.com[a-z]+/i) || domain.match(/^gmail\.[a-z]{2,}\.[a-z]+$/i)) {
        return 'Sprawdź domenę - czy chodziło o gmail.com?';
      }
      if (
        domain === 'gmial.com' ||
        domain === 'gmal.com' ||
        domain === 'gmali.com' ||
        domain === 'gmaill.com'
      ) {
        return 'Sprawdź domenę - czy chodziło o gmail.com?';
      }

      // Other common typos
      if (domain.match(/\.(com|pl|eu|net|org)[a-z]+$/i)) {
        return 'Sprawdź domenę - wygląda na literówkę';
      }

      // Double dots in domain
      if (domain.includes('..')) {
        return 'Nieprawidłowa domena - podwójna kropka';
      }

      return null;
    };

    const sanitizeEmail = (email: string): string => {
      // Remove mailto: prefix (case-insensitive) and trim whitespace
      return email.replace(/^mailto:/i, '').trim();
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const email = e.target.value;
      onCustomerChange({ email });

      const error = validateEmail(email);
      setEmailError(error);
    };

    const handleEmailPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData('text');

      // Check if pasted text contains mailto:
      if (pastedText.toLowerCase().startsWith('mailto:')) {
        e.preventDefault(); // Prevent default paste
        const cleanEmail = sanitizeEmail(pastedText);
        onCustomerChange({ email: cleanEmail });

        // Also validate the cleaned email
        const error = validateEmail(cleanEmail);
        setEmailError(error);
      }
    };

    const lookupNip = async () => {
      const nip = customerData.nip?.replace(/[^0-9]/g, '');
      if (!nip || nip.length !== 10) {
        toast.error('Wprowadź poprawny NIP (10 cyfr)');
        return;
      }

      setNipLoading(true);
      try {
        // Use White List API from Polish Ministry of Finance
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
          `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${today}`,
        );

        if (!response.ok) {
          throw new Error('Nie znaleziono firmy');
        }

        const data = await response.json();

        if (data.result?.subject) {
          const subject = data.result.subject;
          const addressStr = subject.workingAddress || subject.residenceAddress || '';
          const parsed = parseAddress(addressStr);

          onCustomerChange({
            company: subject.name,
            companyAddress: parsed.street,
            companyPostalCode: parsed.postalCode,
            companyCity: parsed.city,
          });
          setCompanyExpanded(true);
        } else {
          toast.error('Nie znaleziono firmy o podanym NIP');
        }
      } catch (error) {
        console.error('NIP lookup error:', error);
        toast.error('Nie udało się pobrać danych firmy');
      } finally {
        setNipLoading(false);
      }
    };

    // Determine if field has validation error
    const hasNameError = !!validationErrors?.name;
    const hasEmailError = !!validationErrors?.email || !!emailError;
    const hasBrandModelError = !!validationErrors?.brandModel;

    return (
      <div className="space-y-8">
        {/* Customer Info Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2" ref={nameInputRef}>
              <Label htmlFor="customerName">Imię i nazwisko *</Label>
              <ClientSearchAutocomplete
                instanceId={instanceId}
                value={customerData.name}
                onChange={(val) => onCustomerChange({ name: val })}
                onSelect={(customer: ClientSearchValue) => {
                  suppressPhoneSearchRef.current = true;
                  onCustomerChange({
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email || '',
                  });
                }}
                onClear={() => onCustomerChange({ name: '', phone: '' })}
                className={hasNameError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                suppressAutoSearch={!!customerData.name}
              />
              {validationErrors?.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2 relative" ref={phoneContainerRef}>
              <Label htmlFor="customerPhone">Telefon</Label>
              <PhoneMaskedInput
                id="customerPhone"
                value={customerData.phone}
                onChange={(val) => { phoneUserInteractedRef.current = true; onCustomerChange({ phone: val }); }}
              />
              {showPhoneDropdown && phoneResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg overflow-hidden bg-card shadow-lg z-[9999]">
                  {phoneResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="w-full p-4 text-left transition-colors flex flex-col border-b border-border last:border-0 hover:bg-hover"
                      onClick={() => handleSelectPhoneResult(customer)}
                    >
                      <div className="font-semibold text-base text-foreground">{customer.name}</div>
                      <div className="text-sm">
                        <span className="text-primary font-medium">
                          {formatPhoneDisplay(customer.phone)}
                        </span>
                        {customer.email && (
                          <span className="text-muted-foreground"> • {customer.email}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email *</Label>
            <Input
              ref={emailInputRef}
              id="customerEmail"
              type="email"
              value={customerData.email}
              onChange={handleEmailChange}
              onPaste={handleEmailPaste}
              className={hasEmailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {(validationErrors?.email || emailError) && (
              <p className="text-sm text-red-500">{validationErrors?.email || emailError}</p>
            )}
          </div>

          {/* Inquiry Content & Internal Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inquiryContent">Treść zapytania</Label>
              <AutoResizeTextarea
                id="inquiryContent"
                value={customerData.inquiryContent || ''}
                onChange={(e) => onCustomerChange({ inquiryContent: e.target.value })}
                placeholder=""
                minRows={3}
              />
            </div>
            {onInternalNotesChange && (
              <div className="space-y-2">
                <Label htmlFor="internalNotes">Notatka własna</Label>
                <AutoResizeTextarea
                  id="internalNotes"
                  value={internalNotes || ''}
                  onChange={(e) => onInternalNotesChange(e.target.value)}
                  placeholder=""
                  minRows={3}
                />
              </div>
            )}
          </div>
        </div>

        {/* Company Info Section — collapsed by default */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setCompanyExpanded((prev) => !prev)}
            className="text-lg font-semibold flex items-center gap-2 hover:text-primary transition-colors"
          >
            <ChevronRight className={cn('w-4 h-4 transition-transform', companyExpanded && 'rotate-90')} />
            Dane firmy (opcjonalne)
          </button>
          {companyExpanded && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyNip">NIP</Label>
                <div className="flex gap-2">
                  <Input
                    id="companyNip"
                    value={customerData.nip}
                    onChange={(e) => onCustomerChange({ nip: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    onClick={lookupNip}
                    disabled={nipLoading}
                    title="Pobierz dane z GUS"
                    className="gap-2 shrink-0"
                  >
                    {nipLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    GUS
                  </Button>
                </div>
              </div>
              {hasCompanyData && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nazwa firmy</Label>
                    <Input
                      id="companyName"
                      value={customerData.company}
                      onChange={(e) => onCustomerChange({ company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Adres (ulica i numer)</Label>
                    <Input
                      id="companyAddress"
                      value={customerData.companyAddress}
                      onChange={(e) => onCustomerChange({ companyAddress: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyPostalCode">Kod pocztowy</Label>
                      <Input
                        id="companyPostalCode"
                        value={customerData.companyPostalCode}
                        onChange={(e) => onCustomerChange({ companyPostalCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCity">Miejscowość</Label>
                      <Input
                        id="companyCity"
                        value={customerData.companyCity}
                        onChange={(e) => onCustomerChange({ companyCity: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Vehicle Info Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2" ref={brandModelRef}>
              <Label htmlFor="vehicleBrandModel">Marka i model pojazdu *</Label>
              <CarSearchAutocomplete
                value={vehicleData.brandModel || ''}
                onChange={(val: CarSearchValue) => {
                  if (val === null) {
                    onVehicleChange({ brandModel: '' });
                  } else if ('type' in val && val.type === 'custom') {
                    onVehicleChange({ brandModel: val.label });
                  } else {
                    onVehicleChange({ brandModel: val.label });
                  }
                }}
                error={hasBrandModelError}
              />
              {validationErrors?.brandModel && (
                <p className="text-sm text-red-500">{validationErrors.brandModel}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paintColor">Kolor lakieru</Label>
              <Input
                id="paintColor"
                value={vehicleData.paintColor || ''}
                onChange={(e) => onVehicleChange({ paintColor: e.target.value })}
                placeholder=""
              />
            </div>
          </div>

          {/* Paint Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ lakieru</Label>
              <RadioGroup
                value={vehicleData.paintType || 'gloss'}
                onValueChange={(value) => onVehicleChange({ paintType: value })}
                className="flex items-center gap-6"
              >
                {paintTypes.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <RadioGroupItem value={type.value} id={`paintType-${type.value}`} />
                    <Label
                      htmlFor={`paintType-${type.value}`}
                      className="cursor-pointer font-normal"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CustomerDataStep.displayName = 'CustomerDataStep';
