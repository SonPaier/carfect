import type {
  PdfOfferData,
  PdfInstanceData,
  PdfScope,
  PdfOfferItem,
  PdfCustomerData,
  PdfVehicleData,
  PdfTrustTile,
} from './types';

interface RawOfferOptionItem {
  id: string;
  custom_name?: string;
  quantity?: number;
  unit_price?: number;
  discount_percent?: number;
  is_optional?: boolean;
  unified_services?: {
    photo_urls?: string[] | null;
  } | null;
}

interface RawOfferScopeRef {
  id: string;
  name?: string;
  description?: string | null;
  is_extras_scope?: boolean;
  photo_urls?: string[] | null;
}

interface RawOfferOption {
  id: string;
  name?: string;
  description?: string | null;
  is_selected?: boolean;
  sort_order?: number;
  scope_id?: string | null;
  scope?: RawOfferScopeRef | null;
  offer_option_items?: RawOfferOptionItem[];
}

interface RawOffer {
  id: string;
  offer_number: string;
  status: string;
  total_net: number;
  total_gross: number;
  vat_rate: number;
  hide_unit_prices?: boolean;
  notes?: string | null;
  payment_terms?: string | null;
  warranty?: string | null;
  service_info?: string | null;
  valid_until?: string | null;
  created_at: string;
  offer_format?: string | null;
  customer_data?: {
    name?: string;
    phone?: string;
    email?: string;
    company?: string;
    nip?: string;
    address?: string;
  } | null;
  vehicle_data?: {
    brand?: string;
    model?: string;
    brandModel?: string;
    plate?: string;
    vin?: string;
    year?: number;
  } | null;
  offer_options?: RawOfferOption[];
}

interface RawInstance {
  id: string;
  name: string;
  logo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  contact_person?: string | null;
  offer_primary_color?: string | null;
  offer_bank_company_name?: string | null;
  offer_bank_account_number?: string | null;
  offer_bank_name?: string | null;
  offer_trust_tiles?: PdfTrustTile[] | null;
  offer_trust_header_title?: string | null;
  offer_trust_description?: string | null;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function transformOfferData(rawOffer: RawOffer): PdfOfferData {
  const selectedOptions = (rawOffer.offer_options ?? [])
    .filter((opt) => opt.is_selected)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Group options by scope — same logic as PublicOfferCustomerView
  const scopeMap: Record<
    string,
    {
      key: string;
      name: string;
      description: string | null;
      photoUrl: string | null;
      isExtrasScope: boolean;
      sortKey: number;
      items: PdfOfferItem[];
    }
  > = {};

  for (const opt of selectedOptions) {
    const inferredNameFromTitle = opt.name?.includes(' - ') ? opt.name.split(' - ')[0] : null;
    const key = opt.scope_id ?? inferredNameFromTitle ?? '__ungrouped__';

    const scopeName = opt.scope_id
      ? (opt.scope?.name ?? inferredNameFromTitle ?? 'Usługi')
      : (inferredNameFromTitle ?? (rawOffer.offer_format === 'v2' ? 'Usługi' : 'Inne'));

    const isExtrasScope = opt.scope?.is_extras_scope ?? false;
    const scopeDescription = opt.scope?.description ?? opt.description ?? null;
    const scopePhotoUrls = opt.scope?.photo_urls ?? [];
    const photoUrl = scopePhotoUrls.length > 0 ? scopePhotoUrls[0] : null;

    if (!scopeMap[key]) {
      scopeMap[key] = {
        key,
        name: scopeName,
        description: scopeDescription ? stripHtmlTags(scopeDescription) : null,
        photoUrl,
        isExtrasScope,
        sortKey: opt.sort_order ?? 0,
        items: [],
      };
    }

    const items = opt.offer_option_items ?? [];
    for (const item of items) {
      if (!item.id) continue;
      const qty = item.quantity ?? 1;
      const unitPrice = item.unit_price ?? 0;
      const discountPercent = item.discount_percent ?? 0;
      const total = qty * unitPrice * (1 - discountPercent / 100);

      const servicePhotos = item.unified_services?.photo_urls ?? [];
      const itemPhotoUrl = servicePhotos.length > 0 ? servicePhotos[0] : null;

      // Parse variant label from name (format: "VariantName\nProductName")
      const nameParts = (item.custom_name ?? '').split('\n');
      const displayName = nameParts.length > 1 ? nameParts.slice(1).join('\n') : item.custom_name ?? '';

      scopeMap[key].items.push({
        id: item.id,
        name: displayName,
        quantity: qty,
        unitPrice: unitPrice,
        discountPercent: discountPercent,
        total,
        isOptional: item.is_optional ?? false,
        photoUrl: itemPhotoUrl,
      });
    }
  }

  const scopes: PdfScope[] = Object.values(scopeMap)
    .filter((s) => s.items.length > 0)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ key, name, description, photoUrl, isExtrasScope, items }) => ({
      key,
      name,
      description,
      photoUrl,
      isExtrasScope,
      items,
    }));

  const customerData: PdfCustomerData = {
    name: rawOffer.customer_data?.name,
    phone: rawOffer.customer_data?.phone,
    email: rawOffer.customer_data?.email,
    company: rawOffer.customer_data?.company,
    nip: rawOffer.customer_data?.nip,
    address: rawOffer.customer_data?.address,
  };

  const vehicleData: PdfVehicleData = {
    brand: rawOffer.vehicle_data?.brand,
    model: rawOffer.vehicle_data?.model,
    brandModel: rawOffer.vehicle_data?.brandModel,
    plate: rawOffer.vehicle_data?.plate,
    vin: rawOffer.vehicle_data?.vin,
    year: rawOffer.vehicle_data?.year,
  };

  return {
    id: rawOffer.id,
    offerNumber: rawOffer.offer_number,
    status: rawOffer.status,
    totalNet: rawOffer.total_net,
    totalGross: rawOffer.total_gross,
    vatRate: rawOffer.vat_rate,
    hideUnitPrices: rawOffer.hide_unit_prices ?? false,
    notes: rawOffer.notes ?? undefined,
    paymentTerms: rawOffer.payment_terms ? stripHtmlTags(rawOffer.payment_terms) : undefined,
    warranty: rawOffer.warranty ? stripHtmlTags(rawOffer.warranty) : undefined,
    serviceInfo: rawOffer.service_info ? stripHtmlTags(rawOffer.service_info) : undefined,
    validUntil: rawOffer.valid_until ?? undefined,
    createdAt: rawOffer.created_at,
    customerData,
    vehicleData,
    scopes,
  };
}

export function transformInstanceData(rawInstance: RawInstance): PdfInstanceData {
  return {
    name: rawInstance.name,
    logoUrl: rawInstance.logo_url,
    phone: rawInstance.phone ?? undefined,
    email: rawInstance.email ?? undefined,
    address: rawInstance.address ?? undefined,
    website: rawInstance.website ?? undefined,
    contactPerson: rawInstance.contact_person ?? undefined,
    accentColor: rawInstance.offer_primary_color ?? undefined,
    bankCompanyName: rawInstance.offer_bank_company_name ?? undefined,
    bankAccountNumber: rawInstance.offer_bank_account_number ?? undefined,
    bankName: rawInstance.offer_bank_name ?? undefined,
    trustTiles: rawInstance.offer_trust_tiles ?? undefined,
    trustHeaderTitle: rawInstance.offer_trust_header_title ?? undefined,
    trustDescription: rawInstance.offer_trust_description ?? undefined,
  };
}
