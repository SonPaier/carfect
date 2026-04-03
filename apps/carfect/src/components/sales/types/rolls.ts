export interface SalesRoll {
  id: string;
  instanceId: string;
  brand: string;
  productName: string;
  description?: string;
  productCode?: string;
  barcode?: string;
  widthMm: number;
  lengthM: number;
  initialLengthM: number;
  initialRemainingMb: number;
  deliveryDate?: string;
  photoUrl?: string;
  status: 'active' | 'archived';
  extractionConfidence?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  // Computed client-side from usages
  currentUsageMb?: number;
  remainingMb?: number;
  remainingM2?: number;
  /** Unique customer names that have ordered this roll */
  customerNames?: string[];
}

export type RollUsageSource = 'order' | 'manual' | 'worker';

export interface SalesRollUsage {
  id: string;
  rollId: string;
  orderId: string | null;
  orderItemId: string | null;
  usedM2: number;
  usedMb: number;
  source: RollUsageSource;
  workerName: string | null;
  note: string | null;
  createdAt: string;
}

export type RollScanStatus = 'uploading' | 'extracting' | 'review' | 'confirmed' | 'error';

export interface RollScanResult {
  tempId: string;
  file: File;
  thumbnailUrl: string;
  photoUrl?: string;
  extractedData: Partial<SalesRoll>;
  confidence: Record<string, number>;
  warnings: string[];
  status: RollScanStatus;
  error?: string;
}

export interface ExtractRollDataResponse {
  brand: string;
  productName: string;
  description: string;
  productCode: string;
  barcode: string;
  widthMm: number;
  lengthM: number;
  confidence: Record<string, number>;
  warnings: string[];
  rawText?: string;
}

// Helpers
export function rollWidthM(roll: { widthMm: number }): number {
  return roll.widthMm / 1000;
}

export function mbToM2(mb: number, widthMm: number): number {
  if (widthMm <= 0) return 0;
  return mb * (widthMm / 1000);
}

export function m2ToMb(m2: number, widthMm: number): number {
  if (widthMm <= 0) return 0;
  return m2 / (widthMm / 1000);
}

export function formatRollSize(widthMm: number, lengthM: number): string {
  return `${widthMm}mm × ${lengthM}m`;
}

export function formatMbM2(mb: number, widthMm: number): string {
  const m2 = mbToM2(mb, widthMm);
  return `${mb.toFixed(1)} mb / ${m2.toFixed(2)} m²`;
}

export function formatMbM2Lines(mb: number, widthMm: number): { mb: string; m2: string } {
  const m2 = mbToM2(mb, widthMm);
  return { mb: `${mb.toFixed(1)} mb`, m2: `${m2.toFixed(2)} m²` };
}
