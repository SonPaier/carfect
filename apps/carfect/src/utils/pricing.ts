const VAT_RATE = 1.23;

/** Round to nearest 5 PLN */
export const roundToNearest5 = (value: number): number => {
  return Math.round(value / 5) * 5;
};

/** Convert net price to brutto (gross) and round to nearest 5 */
export const netToBrutto = (netPrice: number): number => {
  return roundToNearest5(netPrice * VAT_RATE);
};

/** Convert brutto (gross) to net, rounded to 2 decimal places */
export const bruttoToNetto = (brutto: number): number => {
  return Math.round((brutto / VAT_RATE) * 100) / 100;
};

/** Convert netto (net) to gross, rounded to 2 decimal places */
export const nettoToBrutto = (netto: number): number => {
  return Math.round(netto * VAT_RATE * 100) / 100;
};

interface ServiceLike {
  price_from: number | null;
  price_small: number | null;
  price_medium: number | null;
  price_large: number | null;
  category_prices_are_net?: boolean;
}

type CarSize = 'small' | 'medium' | 'large';

/** Get raw price for car size (before any net/brutto conversion) */
export const getRawServicePrice = (
  service: ServiceLike,
  carSize: CarSize,
): number | null => {
  if (carSize === 'small' && service.price_small !== null) return service.price_small;
  if (carSize === 'medium' && service.price_medium !== null) return service.price_medium;
  if (carSize === 'large' && service.price_large !== null) return service.price_large;
  return service.price_from;
};

/** Get both netto and brutto prices for a service based on car size and prices_are_net flag */
export const getServicePricePair = (
  service: ServiceLike,
  carSize: CarSize,
): { netto: number; brutto: number } | null => {
  const raw = getRawServicePrice(service, carSize);
  if (raw === null) return null;

  if (service.category_prices_are_net) {
    // Raw price is netto
    return { netto: raw, brutto: netToBrutto(raw) };
  }
  // Raw price is brutto
  return { netto: bruttoToNetto(raw), brutto: raw };
};

/** Get display price for a service based on pricing mode */
export const getServiceDisplayPrice = (
  service: ServiceLike,
  carSize: CarSize,
  pricingMode: 'netto' | 'brutto',
): number | null => {
  const pair = getServicePricePair(service, carSize);
  if (!pair) return null;
  return pricingMode === 'netto' ? pair.netto : pair.brutto;
};

/** Calculate netto from brutto or vice-versa, depending on pricing mode */
export const calculatePricePair = (
  price: number,
  pricingMode: 'netto' | 'brutto',
): { netto: number; brutto: number } => {
  if (pricingMode === 'netto') {
    return { netto: price, brutto: netToBrutto(price) };
  }
  return { netto: bruttoToNetto(price), brutto: price };
};
