/** Product joined via offer_scope_products → unified_services */
export interface ScopeProductWithJoin {
  id: string;
  scope_id: string;
  is_default: boolean;
  sort_order: number | null;
  product?: {
    id: string;
    name: string;
    default_price: number | null;
    price_from: number | null;
    price_small: number | null;
    price_medium: number | null;
    price_large: number | null;
  };
  visibility?: string;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  nip?: string;
  companyAddress?: string;
  companyPostalCode?: string;
  companyCity?: string;
  notes?: string;
  inquiryContent?: string;
}

export interface VehicleData {
  brandModel?: string;
  plate?: string;
  paintColor?: string;
  paintType?: string;
}

export interface OfferItem {
  id: string;
  productId?: string;
  customName?: string;
  customDescription?: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  discountPercent: number;
  isOptional: boolean;
  isCustom: boolean;
}

export interface OfferOption {
  id: string;
  name: string;
  description?: string;
  items: OfferItem[];
  isSelected: boolean;
  sortOrder: number;
  scopeId?: string;
  variantId?: string;
  isUpsell?: boolean;
}

export interface DefaultSelectedState {
  selectedScopeId?: string | null;
  selectedVariants: Record<string, string>; // scopeId → optionId
  selectedOptionalItems: Record<string, boolean>; // itemId → true
  selectedItemInOption: Record<string, string>; // optionId → itemId
}

export interface OfferState {
  id?: string;
  instanceId: string;
  customerData: CustomerData;
  vehicleData: VehicleData;
  selectedScopeIds: string[];
  options: OfferOption[];
  additions: OfferItem[];
  notes?: string;
  paymentTerms?: string;
  warranty?: string;
  serviceInfo?: string;
  validUntil?: string;
  vatRate: number;
  hideUnitPrices: boolean;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  defaultSelectedState?: DefaultSelectedState;
  internalNotes?: string;
  // Widget selections for auto-preselection in Step 3
  widgetSelectedExtras?: string[]; // uuid[] from widget
  widgetDurationSelections?: Record<string, number | null>; // templateId → months
  offerFormat?: 'v1' | 'v2' | null;
}

export const defaultCustomerData: CustomerData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  nip: '',
  companyAddress: '',
  companyPostalCode: '',
  companyCity: '',
  notes: '',
  inquiryContent: '',
};

export const defaultVehicleData: VehicleData = {
  brandModel: '',
  plate: '',
  paintColor: '',
  paintType: '',
};
