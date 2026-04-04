import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { OfferState, OfferOption } from '@/hooks/useOffer';
import { PublicOfferCustomerView, PublicOfferData } from './PublicOfferCustomerView';

interface Instance {
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
  offer_trust_tiles?: Array<{ icon: string; title: string; description: string }>;
}

interface ScopeData {
  id: string;
  name: string;
  description?: string;
  is_extras_scope?: boolean;
  photo_urls?: string[] | null;
}

interface OfferPreviewPanelProps {
  offer: OfferState;
  instanceId: string;
  calculateTotalNet: () => number;
  calculateTotalGross: () => number;
  /** Increment to force re-fetch of product data */
  refreshKey?: number;
}

export const OfferPreviewPanel = ({
  offer,
  instanceId,
  calculateTotalNet,
  calculateTotalGross,
  refreshKey,
}: OfferPreviewPanelProps) => {
  const { t } = useTranslation();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [scopes, setScopes] = useState<Record<string, ScopeData>>({});
  const [productDescriptions, setProductDescriptions] = useState<Record<string, string>>({});
  const [productPhotoUrls, setProductPhotoUrls] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const optionsKey = useMemo(
    () =>
      offer.options
        .map((o) => `${o.scopeId}:${o.items.map((i) => i.productId).join(',')}`)
        .join('|'),
    [offer.options],
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setScopes({});
      setProductDescriptions({});
      setProductPhotoUrls({});

      const { data: instanceData } = await supabase
        .from('instances')
        .select(
          `
          name,
          logo_url,
          phone,
          email,
          address,
          website,
          social_facebook,
          social_instagram,
          offer_branding_enabled,
          offer_bg_color,
          offer_header_bg_color,
          offer_header_text_color,
          offer_section_bg_color,
          offer_section_text_color,
          offer_primary_color,
          offer_scope_header_text_color,
          offer_portfolio_url,
          offer_google_reviews_url,
          contact_person,
          offer_bank_company_name,
          offer_bank_account_number,
          offer_bank_name,
          offer_trust_header_title,
          offer_trust_description,
          offer_trust_tiles
        `,
        )
        .eq('id', instanceId)
        .single();

      if (instanceData) {
        setInstance(instanceData as unknown as Instance);
      }

      // Fetch scope data
      const scopeIds = offer.options
        .map((o) => o.scopeId)
        .filter((id): id is string => !!id);

      if (scopeIds.length > 0) {
        const { data: scopeData } = await supabase
          .from('offer_scopes')
          .select('id, name, description, is_extras_scope, photo_urls')
          .in('id', scopeIds);

        if (scopeData) {
          const scopeMap: Record<string, ScopeData> = {};
          scopeData.forEach((s) => {
            scopeMap[s.id] = s as ScopeData;
          });
          setScopes(scopeMap);
        }
      }

      // Fetch product descriptions
      const productIds = offer.options
        .flatMap((o) => o.items.map((i) => i.productId))
        .filter((id): id is string => !!id);

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('unified_services')
          .select('id, description, photo_urls')
          .in('id', productIds);

        if (products) {
          const descMap: Record<string, string> = {};
          const photoMap: Record<string, string[]> = {};
          products.forEach((p) => {
            if (p.description) descMap[p.id] = p.description;
            if (p.photo_urls) photoMap[p.id] = p.photo_urls as string[];
          });
          setProductDescriptions(descMap);
          setProductPhotoUrls(photoMap);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [instanceId, optionsKey, refreshKey]);

  const totalNet = calculateTotalNet();
  const totalGross = calculateTotalGross();

  const mappedOffer: PublicOfferData | null = useMemo(() => {
    if (!instance) return null;

    return {
      id: offer.id || '',
      offer_number: 'PODGLĄD',
      instance_id: instanceId,
      offer_format: offer.offerFormat ?? null,
      customer_data: {
        name: offer.customerData.name,
        email: offer.customerData.email,
        phone: offer.customerData.phone,
        company: offer.customerData.company,
        nip: offer.customerData.nip,
        address: offer.customerData.companyAddress,
      },
      vehicle_data: {
        brandModel: offer.vehicleData.brandModel,
        plate: offer.vehicleData.plate,
      },
      status: offer.status,
      total_net: totalNet,
      total_gross: totalGross,
      vat_rate: offer.vatRate,
      notes: offer.notes,
      payment_terms: offer.paymentTerms,
      warranty: offer.warranty,
      service_info: offer.serviceInfo,
      valid_until: offer.validUntil,
      hide_unit_prices: offer.hideUnitPrices,
      created_at: new Date().toISOString(),
      approved_at: null,
      selected_state: offer.defaultSelectedState
        ? {
            selectedScopeId: offer.defaultSelectedState.selectedScopeId,
            selectedVariants: offer.defaultSelectedState.selectedVariants || {},
            selectedUpsells: {},
            selectedOptionalItems: offer.defaultSelectedState.selectedOptionalItems || {},
            selectedItemInOption: offer.defaultSelectedState.selectedItemInOption || {},
            isDefault: true,
          }
        : null,
      offer_options: offer.options.map((opt: OfferOption) => ({
        id: opt.id,
        name: opt.name,
        description: opt.description,
        is_selected: opt.isSelected,
        subtotal_net: opt.items.reduce((sum, item) => {
          const itemTotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
          return sum + (item.isOptional ? 0 : itemTotal);
        }, 0),
        sort_order: opt.sortOrder,
        scope_id: opt.scopeId,
        is_upsell: opt.isUpsell,
        scope:
          opt.scopeId && scopes[opt.scopeId]
            ? {
                id: scopes[opt.scopeId].id,
                name: scopes[opt.scopeId].name,
                description: scopes[opt.scopeId].description,
                is_extras_scope: scopes[opt.scopeId].is_extras_scope,
                photo_urls: scopes[opt.scopeId].photo_urls,
              }
            : null,
        offer_option_items: opt.items.map((item) => ({
          id: item.id,
          custom_name: item.customName || '',
          custom_description: item.customDescription,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          unit: item.unit,
          discount_percent: item.discountPercent,
          is_optional: item.isOptional,
          unified_services:
            item.productId &&
            (productDescriptions[item.productId] || productPhotoUrls[item.productId])
              ? {
                  description: productDescriptions[item.productId],
                  photo_urls: productPhotoUrls[item.productId] || null,
                }
              : null,
        })),
      })),
      instances: instance,
    };
  }, [
    instance,
    offer,
    scopes,
    productDescriptions,
    productPhotoUrls,
    instanceId,
    totalNet,
    totalGross,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mappedOffer) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-muted-foreground">Ładowanie podglądu...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <PublicOfferCustomerView offer={mappedOffer} mode="overlayPreview" embedded={true} />
    </ScrollArea>
  );
};
