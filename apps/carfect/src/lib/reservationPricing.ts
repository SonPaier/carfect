import { getServiceDisplayPrice } from '@/utils/pricing';

interface ServiceLike {
  id: string;
  duration_minutes: number | null;
  duration_small: number | null;
  duration_medium: number | null;
  duration_large: number | null;
  price_from: number | null;
  price_small: number | null;
  price_medium: number | null;
  price_large: number | null;
  category_id: string | null;
}

interface ServiceWithCategoryInfo {
  id: string;
  category_prices_are_net?: boolean;
}

interface ServiceItemLike {
  service_id: string;
  custom_price: number | null;
}

type CarSize = 'small' | 'medium' | 'large';

/** Convert CarSize to the single-letter code stored in DB */
export function carSizeToCode(carSize: CarSize): 'S' | 'M' | 'L' {
  if (carSize === 'small') return 'S';
  if (carSize === 'large') return 'L';
  return 'M';
}

/** Get duration for a service based on car size */
export function getServiceDuration(
  service: Pick<ServiceLike, 'duration_minutes' | 'duration_small' | 'duration_medium' | 'duration_large'>,
  carSize: CarSize,
): number {
  if (carSize === 'small' && service.duration_small) return service.duration_small;
  if (carSize === 'large' && service.duration_large) return service.duration_large;
  if (carSize === 'medium' && service.duration_medium) return service.duration_medium;
  return service.duration_minutes || 60;
}

/** Get display price for a service, resolving category net/brutto flag */
export function getReservationServicePrice(
  service: ServiceLike,
  carSize: CarSize,
  pricingMode: 'netto' | 'brutto',
  servicesWithCategory: ServiceWithCategoryInfo[],
  categoryNetMap: Map<string, boolean>,
): number {
  const svcWithCat = servicesWithCategory.find((s) => s.id === service.id);
  const categoryIsNet =
    svcWithCat?.category_prices_are_net ??
    (service.category_id ? categoryNetMap.get(service.category_id) || false : false);
  return (
    getServiceDisplayPrice(
      { ...service, category_prices_are_net: categoryIsNet },
      carSize,
      pricingMode,
    ) ?? 0
  );
}

/** Calculate total price from selected services, using custom prices from serviceItems if set */
export function calculateTotalPrice(
  selectedServiceIds: string[],
  services: ServiceLike[],
  serviceItems: ServiceItemLike[],
  carSize: CarSize,
  pricingMode: 'netto' | 'brutto',
  servicesWithCategory: ServiceWithCategoryInfo[],
  categoryNetMap: Map<string, boolean>,
): number {
  return selectedServiceIds.reduce((total, serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return total;

    const serviceItem = serviceItems.find((si) => si.service_id === serviceId);
    if (serviceItem?.custom_price !== null && serviceItem?.custom_price !== undefined) {
      return total + serviceItem.custom_price;
    }

    return total + getReservationServicePrice(service, carSize, pricingMode, servicesWithCategory, categoryNetMap);
  }, 0);
}

/** Apply customer discount to a price */
export function applyDiscount(price: number, discountPercent: number | null): number {
  if (discountPercent && discountPercent > 0) {
    return Math.round(price * (1 - discountPercent / 100));
  }
  return price;
}

/** Calculate total duration from selected services */
export function calculateTotalDuration(
  selectedServiceIds: string[],
  services: Pick<ServiceLike, 'id' | 'duration_minutes' | 'duration_small' | 'duration_medium' | 'duration_large'>[],
  carSize: CarSize,
): number {
  return selectedServiceIds.reduce((total, serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return total + (service ? getServiceDuration(service, carSize) : 0);
  }, 0);
}
