import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@shared/utils';
import type { SalesRoll, SalesRollUsage } from '../types/rolls';

// ─── Helpers ────────────────────────────────────────────────

function mapDbRow(row: any): SalesRoll {
  return {
    id: row.id,
    instanceId: row.instance_id,
    brand: row.brand,
    productName: row.product_name,
    description: row.description,
    productCode: row.product_code,
    barcode: row.barcode,
    widthMm: Number(row.width_mm),
    lengthM: Number(row.length_m),
    initialLengthM: Number(row.initial_length_m),
    deliveryDate: row.delivery_date,
    photoUrl: row.photo_url,
    status: row.status,
    extractionConfidence: row.extraction_confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUsageRow(row: any): SalesRollUsage {
  return {
    id: row.id,
    rollId: row.roll_id,
    orderId: row.order_id,
    orderItemId: row.order_item_id,
    usedM2: Number(row.used_m2),
    usedMb: Number(row.used_mb),
    createdAt: row.created_at,
  };
}

// ─── Fetch Rolls ────────────────────────────────────────────

export async function fetchRolls(
  instanceId: string,
  status: 'active' | 'archived'
): Promise<SalesRoll[]> {
  const { data: rollRows, error } = await (supabase
    .from('sales_rolls')
    .select('*')
    .eq('instance_id', instanceId)
    .eq('status', status)
    .order('created_at', { ascending: false }) as any);

  if (error) throw new Error(error.message);
  if (!rollRows || rollRows.length === 0) return [];

  const rolls = rollRows.map(mapDbRow);
  const rollIds = rolls.map((r) => r.id);

  // Fetch aggregated usages
  const { data: usageRows, error: usageErr } = await (supabase
    .from('sales_roll_usages')
    .select('roll_id, used_mb')
    .in('roll_id', rollIds) as any);

  if (usageErr) throw new Error(usageErr.message);

  // Aggregate usage per roll
  const usageMap = new Map<string, number>();
  for (const u of usageRows || []) {
    const current = usageMap.get(u.roll_id) || 0;
    usageMap.set(u.roll_id, current + Number(u.used_mb));
  }

  // Compute remaining
  return rolls.map((roll) => {
    const usedMb = usageMap.get(roll.id) || 0;
    const remainingMb = Math.max(0, roll.lengthM - usedMb);
    const widthM = roll.widthMm / 1000;
    return {
      ...roll,
      currentUsageMb: usedMb,
      remainingMb,
      remainingM2: remainingMb * widthM,
    };
  });
}

// ─── CRUD ───────────────────────────────────────────────────

export async function createRoll(data: {
  instanceId: string;
  brand: string;
  productName: string;
  description?: string;
  productCode?: string;
  barcode?: string;
  widthMm: number;
  lengthM: number;
  deliveryDate?: string;
  photoUrl?: string;
  extractionConfidence?: Record<string, number>;
}): Promise<string> {
  const { data: row, error } = await (supabase
    .from('sales_rolls')
    .insert({
      instance_id: data.instanceId,
      brand: data.brand,
      product_name: data.productName,
      description: data.description || null,
      product_code: data.productCode || null,
      barcode: data.barcode || null,
      width_mm: data.widthMm,
      length_m: data.lengthM,
      initial_length_m: data.lengthM,
      delivery_date: data.deliveryDate || null,
      photo_url: data.photoUrl || null,
      extraction_confidence: data.extractionConfidence || null,
    })
    .select('id')
    .single() as any);

  if (error) throw new Error(error.message);
  return row.id;
}

export async function createRollsBatch(
  rolls: Parameters<typeof createRoll>[0][]
): Promise<string[]> {
  const rows = rolls.map((data) => ({
    instance_id: data.instanceId,
    brand: data.brand,
    product_name: data.productName,
    description: data.description || null,
    product_code: data.productCode || null,
    barcode: data.barcode || null,
    width_mm: data.widthMm,
    length_m: data.lengthM,
    initial_length_m: data.lengthM,
    delivery_date: data.deliveryDate || null,
    photo_url: data.photoUrl || null,
    extraction_confidence: data.extractionConfidence || null,
  }));

  const { data: inserted, error } = await (supabase
    .from('sales_rolls')
    .insert(rows)
    .select('id') as any);

  if (error) throw new Error(error.message);
  return (inserted || []).map((r: any) => r.id);
}

export async function updateRoll(
  id: string,
  data: Partial<{
    brand: string;
    productName: string;
    description: string;
    productCode: string;
    barcode: string;
    widthMm: number;
    lengthM: number;
    initialLengthM: number;
    deliveryDate: string;
    photoUrl: string;
    status: 'active' | 'archived';
  }>
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.brand !== undefined) update.brand = data.brand;
  if (data.productName !== undefined) update.product_name = data.productName;
  if (data.description !== undefined) update.description = data.description;
  if (data.productCode !== undefined) update.product_code = data.productCode;
  if (data.barcode !== undefined) update.barcode = data.barcode;
  if (data.widthMm !== undefined) update.width_mm = data.widthMm;
  if (data.lengthM !== undefined) update.length_m = data.lengthM;
  if (data.initialLengthM !== undefined) update.initial_length_m = data.initialLengthM;
  if (data.deliveryDate !== undefined) update.delivery_date = data.deliveryDate;
  if (data.photoUrl !== undefined) update.photo_url = data.photoUrl;
  if (data.status !== undefined) update.status = data.status;

  const { error } = await (supabase
    .from('sales_rolls')
    .update(update)
    .eq('id', id) as any);

  if (error) throw new Error(error.message);
}

export async function archiveRoll(id: string): Promise<void> {
  await updateRoll(id, { status: 'archived' });
}

export async function restoreRoll(id: string): Promise<void> {
  await updateRoll(id, { status: 'active' });
}

export async function deleteRoll(id: string): Promise<void> {
  // Check if there are usages
  const { data: usages, error: checkErr } = await (supabase
    .from('sales_roll_usages')
    .select('id')
    .eq('roll_id', id)
    .limit(1) as any);

  if (checkErr) throw new Error(checkErr.message);
  if (usages && usages.length > 0) {
    throw new Error('Nie można usunąć rolki, która ma przypisane zużycie. Zarchiwizuj ją zamiast tego.');
  }

  const { error } = await (supabase
    .from('sales_rolls')
    .delete()
    .eq('id', id) as any);

  if (error) throw new Error(error.message);
}

// ─── Roll Usages ────────────────────────────────────────────

export async function fetchRollUsages(rollId: string): Promise<SalesRollUsage[]> {
  const { data, error } = await (supabase
    .from('sales_roll_usages')
    .select('*')
    .eq('roll_id', rollId)
    .order('created_at', { ascending: false }) as any);

  if (error) throw new Error(error.message);
  return (data || []).map(mapUsageRow);
}

export async function createRollUsage(data: {
  rollId: string;
  orderId: string;
  orderItemId: string;
  usedM2: number;
  usedMb: number;
}): Promise<string> {
  const { data: row, error } = await (supabase
    .from('sales_roll_usages')
    .insert({
      roll_id: data.rollId,
      order_id: data.orderId,
      order_item_id: data.orderItemId,
      used_m2: data.usedM2,
      used_mb: data.usedMb,
    })
    .select('id')
    .single() as any);

  if (error) throw new Error(error.message);
  return row.id;
}

export async function deleteRollUsagesByOrderItem(orderItemId: string): Promise<void> {
  const { error } = await (supabase
    .from('sales_roll_usages')
    .delete()
    .eq('order_item_id', orderItemId) as any);

  if (error) throw new Error(error.message);
}

export async function deleteRollUsagesByOrder(orderId: string): Promise<void> {
  const { error } = await (supabase
    .from('sales_roll_usages')
    .delete()
    .eq('order_id', orderId) as any);

  if (error) throw new Error(error.message);
}

// ─── Active rolls by product name (for order autocomplete) ──

export async function fetchActiveRollsByProductName(
  instanceId: string,
  productName: string
): Promise<SalesRoll[]> {
  return fetchRolls(instanceId, 'active').then((rolls) =>
    rolls.filter(
      (r) => r.productName.toLowerCase() === productName.toLowerCase()
    )
  );
}

// ─── AI Extraction ──────────────────────────────────────────

export async function extractRollData(imageBase64: string, mediaType?: string) {
  const { data, error } = await supabase.functions.invoke('extract-roll-data', {
    body: { imageBase64, mediaType: mediaType || 'image/jpeg' },
  });

  if (error) throw new Error(error.message || 'AI extraction failed');
  if (data?.error) throw new Error(data.error);

  return data as {
    brand: string;
    productName: string;
    description: string;
    productCode: string;
    barcode: string;
    widthMm: number;
    lengthM: number;
    deliveryDate: string | null;
    confidence: Record<string, number>;
    warnings: string[];
    rawText?: string;
  };
}

// ─── Photo Upload ───────────────────────────────────────────

export async function uploadRollPhoto(
  file: File,
  instanceId: string
): Promise<string> {
  const blob = await compressImage(file, 1200, 0.8);
  const uuid = crypto.randomUUID();
  const fileName = `${instanceId}/${uuid}.jpg`;

  const { error } = await supabase.storage
    .from('roll-photos')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from('roll-photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// ─── File to Base64 ─────────────────────────────────────────

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
