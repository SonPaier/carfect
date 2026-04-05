/** Customer information for PDF rendering */
export interface PdfCustomerData {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  nip?: string;
  address?: string;
}

/** Vehicle information for PDF rendering */
export interface PdfVehicleData {
  brand?: string;
  model?: string;
  brandModel?: string;
  plate?: string;
  vin?: string;
  year?: number;
  paintColor?: string;
  paintType?: string;
}

/** A single line item within a scope */
export interface PdfOfferItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  /** Pre-calculated net total: quantity * unitPrice * (1 - discountPercent / 100) */
  total: number;
  isOptional: boolean;
  description?: string;
  photoUrl?: string | null;
}

/** A scope group with its items */
export interface PdfScope {
  key: string;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  isExtrasScope: boolean;
  items: PdfOfferItem[];
}

/** Top-level offer data passed to PDF components */
export interface PdfOfferData {
  id: string;
  offerNumber: string;
  status: string;
  totalNet: number;
  totalGross: number;
  vatRate: number;
  hideUnitPrices: boolean;
  notes?: string;
  paymentTerms?: string;
  warranty?: string;
  serviceInfo?: string;
  validUntil?: string;
  createdAt: string;
  customerData?: PdfCustomerData;
  vehicleData?: PdfVehicleData;
  scopes: PdfScope[];
}

/** Trust tile shown in the "why trust us" section */
export interface PdfTrustTile {
  icon: string;
  title: string;
  description: string;
}

/** Instance (company) data for branding, contact, and bank details */
export interface PdfInstanceData {
  name: string;
  logoUrl?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  accentColor?: string;
  bankCompanyName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  trustTiles?: PdfTrustTile[];
  trustHeaderTitle?: string;
  trustDescription?: string;
}
