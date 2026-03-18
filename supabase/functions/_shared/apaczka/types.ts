// Apaczka API v2 types — isolated module

export interface ApaczkaCredentials {
  appId: string;
  appSecret: string;
}

export interface ApaczkaAddress {
  country_code: string;
  name: string;
  line1: string;
  line2: string;
  postal_code: string;
  state_code: string;
  city: string;
  is_residential: number; // 0 = business, 1 = residential
  contact_person: string;
  email: string;
  phone: string;
  foreign_address_id: string;
}

export interface ApaczkaShipmentItem {
  dimension1: number; // length cm
  dimension2: number; // width cm (or diameter for tuba)
  dimension3: number; // height cm (0 for tuba)
  weight: number;     // kg
  is_nstd: number;
  shipment_type_code: string; // "PACZKA" | "RURA"
  customs_data: unknown[];
}

export interface ApaczkaCod {
  amount: number;      // grosze
  currency: string;    // "PLN"
  bankaccount: string; // 26 digits, no spaces
}

export interface ApaczkaPickup {
  type: "SELF" | "COURIER";
  date: string;       // YYYY-MM-DD
  hours_from: string;
  hours_to: string;
}

export interface ApaczkaNotificationChannel {
  isReceiverEmail: number;
  isReceiverSms: number;
  isSenderEmail: number;
  isSenderSms?: number;
}

export interface ApaczkaNotification {
  new: ApaczkaNotificationChannel;
  sent: ApaczkaNotificationChannel;
  exception: ApaczkaNotificationChannel;
  delivered: ApaczkaNotificationChannel;
}

export interface ApaczkaOrderRequest {
  service_id: number;
  address: {
    sender: ApaczkaAddress;
    receiver: ApaczkaAddress;
  };
  option: Record<string, unknown>;
  notification: ApaczkaNotification;
  shipment_value: number;    // grosze
  shipment_currency: string; // "PLN"
  pickup: ApaczkaPickup;
  shipment: ApaczkaShipmentItem[];
  cod?: ApaczkaCod;
  comment: string;
  content: string;
  is_zebra: number;
}

export interface ApaczkaOrderResponseData {
  id: number;
  service_id: number;
  service_name: string;
  waybill_number: string;
  tracking_url: string;
  status: string;
}

export interface ApaczkaApiResponse<T = unknown> {
  status: number;
  message?: string;
  response?: T;
  errors?: Record<string, string[]>;
}

export interface ApaczkaOrderSendResponse {
  order: ApaczkaOrderResponseData;
}

// --- Internal mapping types ---

export interface SenderAddress {
  name: string;
  contact_person: string;
  street: string;
  postal_code: string;
  city: string;
  country_code: string;
  phone: string;
  email: string;
}

export interface OrderPackage {
  id: string;
  shippingMethod: "shipping" | "pickup" | "uber";
  packagingType?: "karton" | "tuba";
  dimensions?: KartonDimensions | TubaDimensions;
  weight?: number;
  contents?: string;
  oversized?: boolean;
  productKeys: string[];
}

export interface KartonDimensions {
  length: number;
  width: number;
  height: number;
}

export interface TubaDimensions {
  length: number;
  diameter: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
