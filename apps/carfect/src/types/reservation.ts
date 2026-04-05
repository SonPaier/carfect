export type CarSize = 'small' | 'medium' | 'large';

export interface ServiceItem {
  service_id: string;
  custom_price: number | null;
  name?: string;
  id?: string;
  short_name?: string | null;
  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;
  price_from?: number | null;
}

export interface Reservation {
  id: string;
  instance_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_plate: string;
  car_size?: CarSize | null;
  reservation_date: string;
  end_date?: string | null;
  start_time: string;
  end_time: string;
  station_id?: string | null;
  status: string;
  confirmation_code?: string;
  price?: number | null;
  price_netto?: number | null;
  customer_notes?: string | null;
  admin_notes?: string | null;
  source?: string | null;
  service_id?: string;
  service_ids?: string[];
  service_items?: ServiceItem[] | null;
  has_unified_services?: boolean | null;
  photo_urls?: string[] | null;
  assigned_employee_ids?: string[] | null;
  offer_number?: string | null;
  created_by?: string | null;
  created_by_username?: string | null;
  confirmation_sms_sent_at?: string | null;
  pickup_sms_sent_at?: string | null;
  checked_service_ids?: string[] | null;
  original_reservation_id?: string | null;
  original_reservation?: {
    reservation_date: string;
    start_time: string;
    confirmation_code: string;
  } | null;
  service?: {
    name: string;
    shortcut?: string | null;
  };
  services_data?: Array<{
    id?: string;
    name: string;
    shortcut?: string | null;
    price_small?: number | null;
    price_medium?: number | null;
    price_large?: number | null;
    price_from?: number | null;
  }>;
  station?: {
    name?: string;
    type?: 'washing' | 'ppf' | 'detailing' | 'universal' | string;
  };
}
