import { parseMarkdownLists } from '@shared/utils';
import { formatPrice } from '@/lib/offerUtils';
import { TruncatedDescription } from './TruncatedDescription';
import { ScopePhotoCarousel } from './ScopePhotoCarousel';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  User,
  Building2,
  Car,
  Calendar,
  Clock,
  Shield,
  Phone,
  Mail,
  Globe,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DEFAULT_BRANDING, OfferBranding, getContrastTextColor } from '@shared/utils';
import { TrustTilesSection } from './public/TrustTilesSection';
import { ExpertContactCard } from './public/ExpertContactCard';
import { BankTransferCard } from './public/BankTransferCard';
import { SocialMediaCard } from './public/SocialMediaCard';

interface OfferScopeRef {
  id: string;
  name: string;
  description?: string | null;
  is_extras_scope?: boolean;
  photo_urls?: string[] | null;
}

interface OfferOptionItem {
  id: string;
  custom_name: string;
  custom_description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  sort_order?: number;
  is_optional?: boolean;
  product_id?: string;
  unified_services?: {
    description?: string;
    photo_urls?: string[] | null;
  };
}

interface OfferOption {
  id: string;
  name: string;
  description?: string | null;
  is_selected: boolean;
  subtotal_net: number;
  sort_order?: number;
  scope_id?: string | null;
  is_upsell?: boolean;
  scope?: OfferScopeRef | null;
  offer_option_items: OfferOptionItem[];
}

interface SelectedState {
  selectedVariants: Record<string, string>;
  selectedUpsells: Record<string, boolean>;
  selectedOptionalItems: Record<string, boolean>;
  selectedScopeId?: string | null;
  selectedScopeIds?: Record<string, boolean>;
  selectedItemInOption?: Record<string, string>;
  isDefault?: boolean;
}

interface TrustTile {
  icon: string;
  title: string;
  description: string;
}

interface Instance {
  id?: string;
  name: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  social_facebook?: string;
  social_instagram?: string;
  offer_branding_enabled?: boolean;
  offer_bg_color?: string;
  offer_header_bg_color?: string;
  offer_header_text_color?: string;
  offer_section_bg_color?: string;
  offer_section_text_color?: string;
  offer_primary_color?: string;
  offer_scope_header_text_color?: string;
  offer_portfolio_url?: string;
  offer_google_reviews_url?: string;
  contact_person?: string;
  offer_bank_company_name?: string;
  offer_bank_account_number?: string;
  offer_bank_name?: string;
  offer_trust_header_title?: string;
  offer_trust_description?: string;
  offer_trust_tiles?: TrustTile[];
}

export interface PublicOfferData {
  id: string;
  instance_id: string;
  offer_number: string;
  public_token: string;
  has_unified_services?: boolean;
  offer_format?: string | null;
  customer_data?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    nip?: string;
    address?: string;
  };
  vehicle_data?: {
    brand?: string;
    model?: string;
    brandModel?: string;
    plate?: string;
    vin?: string;
    year?: number;
  };
  status: string;
  total_net: number;
  total_gross: number;
  vat_rate: number;
  notes?: string;
  payment_terms?: string;
  warranty?: string;
  service_info?: string;
  valid_until?: string;
  hide_unit_prices: boolean;
  created_at: string;
  approved_at?: string | null;
  selected_state?: SelectedState | null;
  offer_options: OfferOption[];
  instances: Instance;
}

interface PublicOfferCustomerViewProps {
  offer: PublicOfferData;
  mode: 'public' | 'overlayPreview';
  embedded?: boolean;
  isAdmin?: boolean;
  onClose?: () => void;
}

// Helper to render description with truncation - supports HTML or plain text with line breaks
const renderDescription = (text: string, textColor?: string) => {
  return <TruncatedDescription text={text} maxLines={3} textColor={textColor} />;
};

export const PublicOfferCustomerView = ({
  offer,
  mode,
  embedded = false,
  isAdmin = false,
  onClose,
}: PublicOfferCustomerViewProps) => {
  const { t } = useTranslation();

  const formatPriceRounded = (value: number) => formatPrice(value, true);

  // For line items: show "Gratis!" for zero/null prices
  const formatItemPrice = (value: number, prefix: string = '') => {
    if (value === 0 || value === null || value === undefined) {
      return t('publicOffer.gratis');
    }
    return `${prefix}${formatPriceRounded(value)}`;
  };

  // VAT annotation shown below each item price
  const vatAnnotation = t('publicOffer.netPlusVat');

  const instance = offer.instances;

  // Branding colors
  const brandingEnabled = instance?.offer_branding_enabled ?? false;
  const branding: OfferBranding = {
    offer_branding_enabled: brandingEnabled,
    offer_bg_color: brandingEnabled
      ? (instance?.offer_bg_color ?? DEFAULT_BRANDING.offer_bg_color)
      : DEFAULT_BRANDING.offer_bg_color,
    offer_header_bg_color: brandingEnabled
      ? (instance?.offer_header_bg_color ?? DEFAULT_BRANDING.offer_header_bg_color)
      : DEFAULT_BRANDING.offer_header_bg_color,
    offer_header_text_color: brandingEnabled
      ? (instance?.offer_header_text_color ?? DEFAULT_BRANDING.offer_header_text_color)
      : DEFAULT_BRANDING.offer_header_text_color,
    offer_section_bg_color: brandingEnabled
      ? (instance?.offer_section_bg_color ?? DEFAULT_BRANDING.offer_section_bg_color)
      : DEFAULT_BRANDING.offer_section_bg_color,
    offer_section_text_color: brandingEnabled
      ? (instance?.offer_section_text_color ?? DEFAULT_BRANDING.offer_section_text_color)
      : DEFAULT_BRANDING.offer_section_text_color,
    offer_primary_color: brandingEnabled
      ? (instance?.offer_primary_color ?? DEFAULT_BRANDING.offer_primary_color)
      : DEFAULT_BRANDING.offer_primary_color,
    offer_scope_header_text_color: brandingEnabled
      ? (instance?.offer_scope_header_text_color ?? DEFAULT_BRANDING.offer_scope_header_text_color)
      : DEFAULT_BRANDING.offer_scope_header_text_color,
  };

  const selectedOptions = offer.offer_options
    .filter((opt) => opt.is_selected)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const scopeSections = Object.values(
    selectedOptions.reduce(
      (acc, opt) => {
        const inferredNameFromTitle = opt.name.includes(' - ') ? opt.name.split(' - ')[0] : null;
        const key = opt.scope_id ?? inferredNameFromTitle ?? '__ungrouped__';

        const inferredScopeName = opt.scope_id
          ? (opt.scope?.name ?? inferredNameFromTitle ?? t('publicOffer.serviceFallback'))
          : (inferredNameFromTitle ?? (offer.offer_format === 'v2' ? 'Usługi' : t('publicOffer.otherFallback')));

        const isExtrasScope = opt.scope?.is_extras_scope ?? false;

        // Get scope description and photos
        const scopeDescription = opt.scope?.description ?? opt.description ?? null;
        const scopePhotoUrls = opt.scope?.photo_urls ?? [];

        if (!acc[key]) {
          acc[key] = {
            key,
            scopeName: inferredScopeName,
            scopeDescription,
            scopePhotoUrls: scopePhotoUrls as string[],
            sortKey: opt.sort_order ?? 0,
            isExtrasScope,
            options: [] as OfferOption[],
          };
        }
        acc[key].options.push(opt);
        return acc;
      },
      {} as Record<
        string,
        {
          key: string;
          scopeName: string;
          scopeDescription: string | null;
          scopePhotoUrls: string[];
          sortKey: number;
          isExtrasScope: boolean;
          options: OfferOption[];
        }
      >,
    ),
  ).sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div
      className={cn(embedded ? 'min-h-full' : 'min-h-screen', 'w-full overflow-x-hidden')}
      style={{ backgroundColor: branding.offer_bg_color }}
    >
      {/* Header */}
      <header style={{ backgroundColor: branding.offer_header_bg_color }}>
        <div className="max-w-4xl w-full mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {instance?.logo_url ? (
                <img
                  src={instance.logo_url}
                  alt={`Logo ${instance.name}`}
                  className="h-12 object-contain"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${branding.offer_primary_color}20` }}
                >
                  <FileText className="w-6 h-6" style={{ color: branding.offer_primary_color }} />
                </div>
              )}
              <div>
                <h1
                  className="font-bold text-lg"
                  style={{ color: branding.offer_header_text_color }}
                >
                  <span className="sr-only">Oferta </span>
                  {instance?.name}
                </h1>
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm opacity-70"
                    style={{ color: branding.offer_header_text_color }}
                  >
                    Oferta nr {offer.offer_number}
                  </p>
                </div>
              </div>
            </div>
            {/* Company contact info - right side */}
            <div
              className="hidden md:flex flex-col items-end gap-0.5 text-xs"
              style={{ color: branding.offer_header_text_color }}
            >
              {instance?.phone && (
                <a href={`tel:${instance.phone}`} className="hover:underline opacity-80">
                  {instance.phone}
                </a>
              )}
              {instance?.email && (
                <a href={`mailto:${instance.email}`} className="hover:underline opacity-80">
                  {instance.email}
                </a>
              )}
              {instance?.address && <span className="opacity-80">{instance.address}</span>}
              {instance?.website && /^https?:\/\//i.test(instance.website) && (
                <a
                  href={instance.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline opacity-80"
                >
                  {instance.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Customer Data Card */}
        <Card
          className="border"
          style={{
            backgroundColor: branding.offer_section_bg_color,
            borderColor: '#e0e0e0',
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle
              className="flex items-center gap-2 text-base"
              style={{ color: branding.offer_section_text_color }}
            >
              <User className="w-4 h-4" />
              {t('publicOffer.forClient')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium" style={{ color: branding.offer_section_text_color }}>
              {offer.customer_data?.name}
            </p>
            {offer.customer_data?.phone && (
              <a
                href={`tel:${offer.customer_data.phone}`}
                className="flex items-center gap-2 hover:underline"
                style={{ color: branding.offer_primary_color }}
              >
                <Phone className="w-3 h-3" />
                {offer.customer_data.phone}
              </a>
            )}
            {offer.customer_data?.company && (
              <p
                className="flex items-center gap-1 opacity-70"
                style={{ color: branding.offer_section_text_color }}
              >
                <Building2 className="w-3 h-3" />
                {offer.customer_data.company}
              </p>
            )}
            {offer.customer_data?.nip && (
              <p className="opacity-70" style={{ color: branding.offer_section_text_color }}>
                NIP: {offer.customer_data.nip}
              </p>
            )}
            {offer.customer_data?.email && (
              <a
                href={`mailto:${offer.customer_data.email}`}
                className="flex items-center gap-2 opacity-70 hover:underline"
                style={{ color: branding.offer_section_text_color }}
              >
                <Mail className="w-3 h-3" />
                {offer.customer_data.email}
              </a>
            )}
            {/* Vehicle info integrated with customer */}
            {(offer.vehicle_data?.brand || offer.vehicle_data?.brandModel) && (
              <div className="pt-2 mt-2 border-t" style={{ borderColor: '#e0e0e0' }}>
                <p
                  className="flex items-center gap-1 font-medium"
                  style={{ color: branding.offer_section_text_color }}
                >
                  <Car className="w-3 h-3" />
                  {offer.vehicle_data.brandModel ||
                    `${offer.vehicle_data.brand || ''} ${offer.vehicle_data.model || ''}`.trim()}
                </p>
                {offer.vehicle_data.plate && (
                  <p
                    className="opacity-70 ml-4"
                    style={{ color: branding.offer_section_text_color }}
                  >
                    {offer.vehicle_data.plate}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Why Trust Us Section */}
        {instance.offer_trust_tiles && instance.offer_trust_tiles.length > 0 && (
          <TrustTilesSection
            tiles={instance.offer_trust_tiles}
            title={instance.offer_trust_header_title}
            description={instance.offer_trust_description}
            branding={branding}
          />
        )}

        {/* Service Sections */}
        {scopeSections.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {t('publicOffer.noPositions')}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {scopeSections.map((section) => {
              // Extras scope — flat list of additional items
              if (section.isExtrasScope) {
                const allItems = section.options
                  .flatMap((option) =>
                    (option.offer_option_items || []).map((item) => ({
                      ...item,
                      optionId: option.id,
                      optionDescription: option.description,
                    })),
                  )
                  .filter((item) => item.id);

                if (allItems.length === 0) return null;

                return (
                  <section key={section.key} className="space-y-3">
                    <div>
                      <h2
                        className="text-base font-semibold"
                        style={{ color: branding.offer_scope_header_text_color }}
                      >
                        {section.scopeName}
                      </h2>
                      {section.scopeDescription && (
                        <div
                          className="text-sm mt-1 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0"
                          style={{ color: branding.offer_scope_header_text_color }}
                          dangerouslySetInnerHTML={{
                            __html: parseMarkdownLists(section.scopeDescription),
                          }}
                        />
                      )}
                    </div>
                    {allItems.map((item) => {
                      const itemTotal =
                        item.quantity * item.unit_price * (1 - item.discount_percent / 100);

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border p-4"
                          style={{
                            backgroundColor: branding.offer_section_bg_color,
                            borderColor: '#e0e0e0',
                          }}
                        >
                          {/* Desktop: Name + price on one line, description below */}
                          <div className="hidden md:block">
                            <div className="flex items-center justify-between">
                              <p
                                className="font-medium"
                                style={{ color: branding.offer_section_text_color }}
                              >
                                {item.custom_name}
                              </p>
                              {!offer.hide_unit_prices && (
                                <div className="text-right">
                                  <span
                                    className="font-medium"
                                    style={{ color: branding.offer_section_text_color }}
                                  >
                                    {formatItemPrice(itemTotal, '+')}
                                  </span>
                                  <div className="text-[12px] text-muted-foreground">
                                    {vatAnnotation}
                                  </div>
                                </div>
                              )}
                            </div>
                            {(item.custom_description || item.unified_services?.description) && (
                              <div className="mt-1">
                                {renderDescription(
                                  item.custom_description ||
                                    item.unified_services?.description ||
                                    '',
                                )}
                              </div>
                            )}
                          </div>

                          {/* Mobile: Name, description, then price */}
                          <div className="md:hidden space-y-2">
                            <p
                              className="font-medium"
                              style={{ color: branding.offer_section_text_color }}
                            >
                              {item.custom_name}
                            </p>
                            {(item.custom_description || item.unified_services?.description) &&
                              renderDescription(
                                item.custom_description || item.unified_services?.description || '',
                              )}
                            {!offer.hide_unit_prices && (
                              <div className="flex items-center justify-end">
                                <div className="text-right">
                                  <span
                                    className="font-medium"
                                    style={{ color: branding.offer_section_text_color }}
                                  >
                                    {formatItemPrice(itemTotal, '+')}
                                  </span>
                                  <div className="text-[12px] text-muted-foreground">
                                    {vatAnnotation}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                );
              }

              // Regular scope — service items
              const allItems = section.options.flatMap((opt) =>
                (opt.offer_option_items || []).filter((item) => item.id && !item.is_optional),
              );
              const suggestedItems = section.options.flatMap((opt) =>
                (opt.offer_option_items || []).filter((item) => item.id && item.is_optional),
              );
              if (allItems.length === 0 && suggestedItems.length === 0) return null;

              const scopeDescription = section.scopeDescription;

              return (
                <section key={section.key} className="space-y-3">
                  <div>
                    <h2
                      className="font-semibold flex items-center gap-2"
                      style={{ color: branding.offer_scope_header_text_color, fontSize: '22px' }}
                    >
                      <FileText
                        className="w-5 h-5"
                        style={{ color: branding.offer_primary_color }}
                      />
                      {section.scopeName}
                    </h2>

                    {/* Description + Photos layout */}
                    {(scopeDescription || section.scopePhotoUrls.length > 0) && (
                      <div
                        className={cn(
                          'mt-2',
                          section.scopePhotoUrls.length > 0 && scopeDescription
                            ? 'flex flex-col md:flex-row md:gap-6'
                            : '',
                        )}
                      >
                        {scopeDescription && (
                          <div
                            className={cn(
                              'mt-1',
                              section.scopePhotoUrls.length > 0 ? 'md:flex-1 md:order-1' : '',
                            )}
                          >
                            {renderDescription(
                              scopeDescription,
                              branding.offer_scope_header_text_color,
                            )}
                          </div>
                        )}
                        {section.scopePhotoUrls.length > 0 && (
                          <div
                            className={cn(
                              'mt-3 md:mt-0',
                              scopeDescription ? 'md:flex-1 md:order-2' : 'w-full',
                            )}
                          >
                            <ScopePhotoCarousel photos={section.scopePhotoUrls} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Products — static list */}
                  <div className="space-y-3">
                    {allItems.map((item) => {
                      const itemTotal =
                        item.quantity * item.unit_price * (1 - item.discount_percent / 100);

                      // Parse variant name from custom_name if present
                      const nameParts = (item.custom_name || '').split('\n');
                      const variantLabel = nameParts.length > 1 ? nameParts[0] : null;
                      const productName =
                        nameParts.length > 1 ? nameParts.slice(1).join('\n') : item.custom_name;
                      const description =
                        item.custom_description || item.unified_services?.description;

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border p-4"
                          style={{
                            borderColor: '#e0e0e0',
                            backgroundColor: branding.offer_section_bg_color,
                          }}
                        >
                          {variantLabel && (
                            <p
                              className="text-xs font-semibold uppercase tracking-wide mb-1"
                              style={{ color: branding.offer_primary_color }}
                            >
                              {variantLabel}
                            </p>
                          )}

                          {(() => {
                            const servicePhotos = item.unified_services?.photo_urls || [];
                            const hasPhotos = servicePhotos.length > 0;

                            return (
                              <>
                                {/* Name + price row */}
                                <div className="flex items-start justify-between gap-3">
                                  <span
                                    className="font-medium text-base flex-1"
                                    style={{ color: branding.offer_section_text_color }}
                                  >
                                    {productName}
                                  </span>
                                  {!offer.hide_unit_prices && (
                                    <div className="text-right shrink-0">
                                      <span
                                        className="font-bold text-lg"
                                        style={{ color: branding.offer_section_text_color }}
                                      >
                                        {formatItemPrice(itemTotal)}
                                      </span>
                                      <div className="text-[12px] text-muted-foreground">
                                        {vatAnnotation}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Description + Photos */}
                                {(description || hasPhotos) && (
                                  <div
                                    className={cn(
                                      'mt-2',
                                      hasPhotos && description
                                        ? 'flex flex-col md:flex-row md:gap-4'
                                        : '',
                                    )}
                                  >
                                    {description && (
                                      <div className={cn(hasPhotos ? 'md:flex-1' : '')}>
                                        {renderDescription(description)}
                                      </div>
                                    )}
                                    {hasPhotos && (
                                      <div
                                        className={cn(
                                          'mt-3 md:mt-0',
                                          description ? 'md:flex-1' : 'w-full',
                                        )}
                                      >
                                        <ScopePhotoCarousel photos={servicePhotos} />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>

                  {/* Suggested items for v2 offers */}
                  {suggestedItems.length > 0 && (
                    <div className="mt-6">
                      <h3
                        className="font-semibold text-base mb-3"
                        style={{ color: branding.offer_scope_header_text_color }}
                      >
                        Sugerowane dodatki
                      </h3>
                      <div className="space-y-3">
                        {suggestedItems.map((item) => {
                          const itemTotal =
                            item.quantity * item.unit_price * (1 - item.discount_percent / 100);
                          return (
                            <div
                              key={item.id}
                              className="rounded-lg border p-4"
                              style={{
                                borderColor: '#d0d0d0',
                                backgroundColor: branding.offer_section_bg_color,
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span
                                  className="font-medium text-base flex-1"
                                  style={{ color: branding.offer_section_text_color }}
                                >
                                  {item.custom_name}
                                </span>
                                {!offer.hide_unit_prices && (
                                  <span
                                    className="font-semibold text-base whitespace-nowrap"
                                    style={{ color: itemTotal === 0 ? branding.offer_primary_color : branding.offer_section_text_color }}
                                  >
                                    {itemTotal === 0 ? 'Gratis!' : `${itemTotal.toFixed(2)} zł`}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* Expert Contact */}
        <ExpertContactCard instance={instance} branding={branding} />

        {/* Notes & Terms */}
        {(offer.payment_terms ||
          offer.warranty ||
          offer.service_info ||
          offer.notes ||
          offer.valid_until) && (
          <Card
            className="border"
            style={{
              backgroundColor: branding.offer_section_bg_color,
              borderColor: '#e0e0e0',
            }}
          >
            <CardContent className="pt-6 space-y-4 text-sm">
              {offer.valid_until && (
                <div
                  className="flex items-center gap-2"
                  style={{ color: branding.offer_section_text_color }}
                >
                  <Calendar className="w-4 h-4 opacity-70 shrink-0" />
                  <span>
                    {t('publicOffer.offerValidUntil')}:{' '}
                    <strong>
                      {format(new Date(offer.valid_until), 'd MMMM yyyy', { locale: pl })}
                    </strong>
                  </span>
                </div>
              )}

              {offer.payment_terms && (
                <div style={{ color: branding.offer_section_text_color }}>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <CreditCard className="w-4 h-4 opacity-70" />
                    Warunki płatności
                  </div>
                  <div
                    className="pl-6 opacity-80 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-[15px] md:text-sm"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownLists(offer.payment_terms) }}
                  />
                </div>
              )}

              {offer.warranty && (
                <div style={{ color: branding.offer_section_text_color }}>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Shield className="w-4 h-4 opacity-70" />
                    Warunki gwarancji
                  </div>
                  <div
                    className="pl-6 opacity-80 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-[15px] md:text-sm"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownLists(offer.warranty) }}
                  />
                </div>
              )}

              {offer.service_info && (
                <div style={{ color: branding.offer_section_text_color }}>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <FileText className="w-4 h-4 opacity-70" />
                    Oferta obejmuje
                  </div>
                  <div
                    className="pl-6 opacity-80 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-[15px] md:text-sm"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownLists(offer.service_info) }}
                  />
                </div>
              )}

              {offer.notes && (
                <div style={{ color: branding.offer_section_text_color }}>
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Clock className="w-4 h-4 opacity-70" />
                    Inne informacje
                  </div>
                  <div
                    className="pl-6 opacity-80 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-[15px] md:text-sm"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownLists(offer.notes) }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bank Transfer Details */}
        <BankTransferCard
          instance={instance}
          vehicleModel={
            offer.vehicle_data?.brandModel || offer.vehicle_data?.model || offer.vehicle_data?.brand
          }
          offerNumber={offer.offer_number}
        />

        {/* Social media links */}
        <SocialMediaCard
          facebook={instance?.social_facebook}
          instagram={instance?.social_instagram}
          googleReviewsUrl={instance?.offer_google_reviews_url}
          portfolioUrl={instance?.offer_portfolio_url}
        />

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 pb-4">
          <p>{instance?.name}</p>
          {instance?.address && <p>{instance.address}</p>}
          {instance?.phone && (
            <p>
              Tel:{' '}
              <a href={`tel:${instance.phone}`} className="hover:underline">
                {instance.phone}
              </a>
            </p>
          )}
          {instance?.email && (
            <p>
              Email:{' '}
              <a href={`mailto:${instance.email}`} className="hover:underline">
                {instance.email}
              </a>
            </p>
          )}
        </footer>

        {/* Carfect branding footer */}
        <div className="text-center pb-4">
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
            Carfect.pl - CRM dla myjni samochodowych i detailingu
          </p>
        </div>
      </main>
    </div>
  );
};
