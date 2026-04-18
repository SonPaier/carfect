export interface RollUsageRow {
  id: string;
  order_id: string;
  order_item_id: string;
  used_mb: number;
}

export interface RollRow {
  id: string;
  brand: string;
  product_name: string;
  width_mm: number;
  barcode: string;
}

export interface MappedRoll {
  brand: string;
  productName: string;
  widthMm: number;
  usedMb: number;
  barcode: string;
}

export function mapRollUsageToResponse(usage: RollUsageRow, roll: RollRow): MappedRoll {
  return {
    brand: roll.brand,
    productName: roll.product_name,
    widthMm: roll.width_mm,
    usedMb: usage.used_mb,
    barcode: roll.barcode,
  };
}
