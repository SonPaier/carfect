export interface SelectedState {
  selectedVariants?: Record<string, string>;
  selectedUpsells?: Record<string, boolean>;
  selectedOptionalItems?: Record<string, boolean>;
  selectedScopeId?: string | null;
  selectedItemInOption?: Record<string, string>;
}

export type FollowUpPhoneStatus = 'called_discussed' | 'call_later' | 'called_no_answer' | null;

export interface Offer {
  id: string;
  offer_number: string;
  customer_data: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
  };
  vehicle_data?: {
    brandModel?: string;
    brand?: string;
    model?: string;
    plate?: string;
  };
  status: string;
  source?: string;
  total_net: number;
  total_gross: number;
  admin_approved_net?: number | null;
  admin_approved_gross?: number | null;
  created_at: string;
  valid_until?: string;
  public_token: string;
  approved_at?: string | null;
  viewed_at?: string | null;
  selected_state?: SelectedState | null;
  follow_up_phone_status?: FollowUpPhoneStatus;
  internal_notes?: string | null;
}

export interface OfferWithOptions extends Offer {
  offer_options?: {
    id: string;
    name?: string;
    scope_id?: string | null;
    is_upsell?: boolean;
    subtotal_net?: number;
    offer_option_items?: {
      id: string;
      custom_name?: string;
      unit_price?: number;
      quantity?: number;
      discount_percent?: number;
      product_id?: string | null;
    }[];
  }[];
  offer_scopes?: {
    id: string;
    name: string;
  }[];
  selectedOptionName?: string;
  vat_rate?: number;
}

export interface InstanceData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contact_person?: string;
  slug?: string;
  offer_email_template?: string;
}

export const statusColors: Record<string, string> = {
  draft: 'bg-slate-200 text-slate-600',
  sent: 'bg-blue-500/20 text-blue-600',
  viewed: 'bg-amber-500/20 text-amber-600',
  accepted: 'bg-green-500/20 text-green-600',
  rejected: 'bg-red-500/20 text-red-600',
  expired: 'bg-gray-500/20 text-gray-500',
  completed: 'bg-emerald-600/20 text-emerald-700',
};

export const STATUS_OPTIONS = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'completed',
] as const;

export function formatPrice(value: number) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(value);
}
