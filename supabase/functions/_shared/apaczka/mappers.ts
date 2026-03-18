import type {
  ApaczkaAddress,
  ApaczkaOrderRequest,
  ApaczkaShipmentItem,
  ApaczkaCod,
  ApaczkaNotification,
  ApaczkaPickup,
  SenderAddress,
  OrderPackage,
  KartonDimensions,
  TubaDimensions,
  ValidationResult,
} from "./types.ts";

const DEFAULT_WEIGHT_KG = 1;

/**
 * Validate that all required shipping data is present before calling Apaczka.
 */
export function validateShippingData(params: {
  customer: Record<string, unknown>;
  packages: OrderPackage[];
  order: Record<string, unknown>;
  senderAddress: SenderAddress | null;
}): ValidationResult {
  const errors: string[] = [];
  const { customer, packages, order, senderAddress } = params;

  // Sender address
  if (!senderAddress) {
    errors.push("Brak konfiguracji adresu nadawcy (apaczka_sender_address) na instancji");
  } else {
    if (!senderAddress.street) errors.push("Brak ulicy nadawcy");
    if (!senderAddress.postal_code) errors.push("Brak kodu pocztowego nadawcy");
    if (!senderAddress.city) errors.push("Brak miasta nadawcy");
    if (!senderAddress.name) errors.push("Brak nazwy nadawcy");
    if (!senderAddress.phone) errors.push("Brak telefonu nadawcy");
  }

  // Receiver address
  if (!customer.shipping_street) errors.push("Brak ulicy odbiorcy");
  if (!customer.shipping_postal_code) errors.push("Brak kodu pocztowego odbiorcy");
  if (!customer.shipping_city) errors.push("Brak miasta odbiorcy");

  // At least one shipping package
  const shippingPackages = packages.filter((p) => p.shippingMethod === "shipping");
  if (shippingPackages.length === 0) {
    errors.push("Brak paczek z metodą wysyłki 'shipping'");
  }

  // Each shipping package must have dimensions
  for (const pkg of shippingPackages) {
    if (!pkg.dimensions) {
      errors.push(`Paczka ${pkg.id}: brak wymiarów`);
    }
  }

  // COD requires bank account
  if (order.payment_method === "cod") {
    const bankAccount = stripBankAccount(order.bank_account_number as string | null);
    if (!bankAccount || bankAccount.length !== 26) {
      errors.push("Za pobraniem wymaga numeru konta bankowego (26 cyfr)");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Map order data to Apaczka API order request.
 */
export function mapOrderToApaczkaRequest(params: {
  order: Record<string, unknown>;
  customer: Record<string, unknown>;
  senderAddress: SenderAddress;
  packages: OrderPackage[];
  serviceId: number;
}): ApaczkaOrderRequest {
  const { order, customer, senderAddress, packages, serviceId } = params;

  const sender = mapSenderAddress(senderAddress);
  const receiver = mapReceiverAddress(customer);
  const shipmentItems = mapPackagesToShipmentItems(packages);
  const totalGross = Number(order.total_gross) || 0;
  const shipmentValue = Math.round(totalGross * 100); // PLN to grosze

  const request: ApaczkaOrderRequest = {
    service_id: serviceId,
    address: { sender, receiver },
    option: {},
    notification: buildDefaultNotification(),
    shipment_value: shipmentValue,
    shipment_currency: "PLN",
    pickup: buildDefaultPickup(),
    shipment: shipmentItems,
    comment: (order.comment as string) || "",
    content: buildContentDescription(packages),
    is_zebra: 0,
  };

  // Add COD if payment is cash on delivery
  if (order.payment_method === "cod") {
    request.cod = buildCod(totalGross, order.bank_account_number as string);
  }

  return request;
}

function mapSenderAddress(sender: SenderAddress): ApaczkaAddress {
  return {
    country_code: sender.country_code || "PL",
    name: sender.name,
    line1: sender.street,
    line2: "",
    postal_code: formatPostalCode(sender.postal_code),
    state_code: "",
    city: sender.city,
    is_residential: 0,
    contact_person: sender.contact_person || sender.name,
    email: sender.email || "",
    phone: sender.phone || "",
    foreign_address_id: "",
  };
}

function mapReceiverAddress(customer: Record<string, unknown>): ApaczkaAddress {
  const name = (customer.company as string) || (customer.name as string) || "";
  const isResidential = customer.company ? 0 : 1;

  return {
    country_code: (customer.shipping_country_code as string) || "PL",
    name,
    line1: (customer.shipping_street as string) || "",
    line2: (customer.shipping_street_line2 as string) || "",
    postal_code: formatPostalCode(customer.shipping_postal_code as string),
    state_code: "",
    city: (customer.shipping_city as string) || "",
    is_residential: isResidential,
    contact_person: (customer.contact_person as string) || (customer.name as string) || "",
    email: (customer.contact_email as string) || (customer.email as string) || "",
    phone: (customer.contact_phone as string) || (customer.phone as string) || "",
    foreign_address_id: "",
  };
}

/**
 * Map UI packages (only those with shippingMethod==='shipping') to Apaczka shipment items.
 */
export function mapPackagesToShipmentItems(
  packages: OrderPackage[],
): ApaczkaShipmentItem[] {
  return packages
    .filter((pkg) => pkg.shippingMethod === "shipping")
    .map((pkg) => {
      const weight = pkg.weight || DEFAULT_WEIGHT_KG;
      const isNstd = pkg.oversized ? 1 : 0;

      if (pkg.packagingType === "tuba") {
        const dims = pkg.dimensions as TubaDimensions | undefined;
        return {
          dimension1: dims?.length || 0,
          dimension2: dims?.diameter || 0,
          dimension3: 0,
          weight,
          is_nstd: isNstd,
          shipment_type_code: "RURA",
          customs_data: [],
        };
      }
      // Default: karton → PACZKA
      const dims = pkg.dimensions as KartonDimensions | undefined;
      return {
        dimension1: dims?.length || 0,
        dimension2: dims?.width || 0,
        dimension3: dims?.height || 0,
        weight,
        is_nstd: isNstd,
        shipment_type_code: "PACZKA",
        customs_data: [],
      };
    });
}

function buildContentDescription(packages: OrderPackage[]): string {
  const contents = packages
    .filter((p) => p.shippingMethod === "shipping" && p.contents)
    .map((p) => p.contents!.trim())
    .filter(Boolean);
  return contents.length > 0 ? contents.join(", ") : "Produkty";
}

function buildCod(totalGross: number, bankAccountNumber: string): ApaczkaCod {
  return {
    amount: Math.round(totalGross * 100),
    currency: "PLN",
    bankaccount: stripBankAccount(bankAccountNumber) || "",
  };
}

/**
 * Format Polish postal code to XX-XXX format.
 * Handles: "81304" → "81-304", "81-304" → "81-304", "81 304" → "81-304"
 */
export function formatPostalCode(code: string | null | undefined): string {
  if (!code) return "";
  const digits = code.replace(/\D/g, "");
  if (digits.length === 5) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return code.trim();
}

/**
 * Strip bank account to digits only (26-digit Polish IBAN without PL prefix).
 */
export function stripBankAccount(account: string | null | undefined): string {
  if (!account) return "";
  // Remove "PL" prefix if present, then remove all non-digits
  return account.replace(/^PL/i, "").replace(/\D/g, "");
}

function buildDefaultNotification(): ApaczkaNotification {
  return {
    new: { isReceiverEmail: 1, isReceiverSms: 0, isSenderEmail: 1 },
    sent: { isReceiverEmail: 1, isReceiverSms: 0, isSenderEmail: 1, isSenderSms: 0 },
    exception: { isReceiverEmail: 1, isReceiverSms: 0, isSenderEmail: 1, isSenderSms: 0 },
    delivered: { isReceiverEmail: 1, isReceiverSms: 0, isSenderEmail: 1, isSenderSms: 0 },
  };
}

function buildDefaultPickup(): ApaczkaPickup {
  // Next business day
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Skip weekends
  const day = tomorrow.getDay();
  if (day === 0) tomorrow.setDate(tomorrow.getDate() + 1); // Sunday → Monday
  if (day === 6) tomorrow.setDate(tomorrow.getDate() + 2); // Saturday → Monday

  const dateStr = tomorrow.toISOString().split("T")[0];
  return {
    type: "SELF",
    date: dateStr,
    hours_from: "",
    hours_to: "",
  };
}
