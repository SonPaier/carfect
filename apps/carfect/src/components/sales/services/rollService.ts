import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@shared/utils';
import type { SalesRoll, SalesRollUsage } from '../types/rolls';

// ─── Helpers ────────────────────────────────────────────────

interface RollDbRow {
  id: string;
  instance_id: string;
  brand: string;
  product_name: string;
  description: string | null;
  product_code: string | null;
  barcode: string | null;
  width_mm: number | string;
  length_m: number | string;
  initial_length_m: number | string;
  initial_remaining_mb: number | string | null;
  delivery_date: string | null;
  photo_url: string | null;
  status: string;
  extraction_confidence: Record<string, number> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface UsageDbRow {
  id: string;
  roll_id: string;
  order_id: string | null;
  order_item_id: string | null;
  used_m2: number | string;
  used_mb: number | string;
  source: string;
  worker_name: string | null;
  note: string | null;
  created_at: string;
}

function mapDbRow(row: RollDbRow): SalesRoll {
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
    initialRemainingMb: Number(row.initial_remaining_mb ?? row.length_m),
    deliveryDate: row.delivery_date,
    photoUrl: row.photo_url,
    status: row.status,
    extractionConfidence: row.extraction_confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? null,
  };
}

function mapUsageRow(row: UsageDbRow): SalesRollUsage {
  return {
    id: row.id,
    rollId: row.roll_id,
    orderId: row.order_id ?? null,
    orderItemId: row.order_item_id ?? null,
    usedM2: Number(row.used_m2),
    usedMb: Number(row.used_mb),
    source: row.source || 'order',
    workerName: row.worker_name ?? null,
    note: row.note ?? null,
    createdAt: row.created_at,
  };
}

// ─── Fetch Rolls ────────────────────────────────────────────

const SOLD_THRESHOLD_MB = 1.5;

export async function fetchRolls(instanceId: string, tab: 'active' | 'sold'): Promise<SalesRoll[]> {
  // For 'sold' tab we need all rolls that have usages and remaining < threshold
  // For 'active' we fetch only active-status rolls
  let query = supabase
    .from('sales_rolls')
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: false });

  // Active tab: only active status
  // Sold tab: any status (active or archived) — we'll filter by usage+remaining client-side
  if (tab === 'active') {
    query = query.eq('status', 'active');
  }

  const { data: rollRows, error } = await query;

  if (error) throw new Error(error.message);
  if (!rollRows || rollRows.length === 0) return [];

  const rolls = rollRows.map(mapDbRow);
  const rollIds = rolls.map((r) => r.id);

  // Fetch aggregated usages with order → customer info
  const { data: usageRows, error: usageErr } = await supabase
    .from('sales_roll_usages')
    .select('roll_id, used_mb, order_id')
    .in('roll_id', rollIds);

  if (usageErr) throw new Error(usageErr.message);

  // Aggregate usage per roll
  const usageMap = new Map<string, number>();
  const rollOrderIds = new Map<string, Set<string>>();
  for (const u of usageRows || []) {
    const current = usageMap.get(u.roll_id) || 0;
    usageMap.set(u.roll_id, current + Number(u.used_mb));
    if (u.order_id) {
      if (!rollOrderIds.has(u.roll_id)) rollOrderIds.set(u.roll_id, new Set());
      rollOrderIds.get(u.roll_id)!.add(u.order_id);
    }
  }

  // Fetch customer names for orders
  const allOrderIds = [...new Set((usageRows || []).map((u) => u.order_id).filter(Boolean))];
  const orderCustomerMap = new Map<string, string>();
  if (allOrderIds.length > 0) {
    const { data: orderRows } = await supabase
      .from('sales_orders')
      .select('id, customer_name')
      .in('id', allOrderIds);
    for (const o of orderRows || []) {
      if (o.customer_name) orderCustomerMap.set(o.id, o.customer_name);
    }
  }

  // Fetch creator names
  const creatorIds = [...new Set(rolls.map((r) => r.createdBy).filter(Boolean))] as string[];
  const creatorMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds);
    for (const p of profileRows || []) {
      if (p.full_name && !p.full_name.includes('@')) creatorMap.set(p.id, p.full_name);
    }
  }

  // Compute remaining + customer names
  const enriched = rolls.map((roll) => {
    const usageMb = usageMap.get(roll.id) || 0;
    const usedMb = (roll.lengthM - roll.initialRemainingMb) + usageMb;
    const remainingMb = Math.max(0, roll.initialRemainingMb - usageMb);
    const widthM = roll.widthMm / 1000;
    const orderIds = rollOrderIds.get(roll.id);
    const customerNames = orderIds
      ? [
          ...new Set(
            [...orderIds].map((oid) => orderCustomerMap.get(oid)).filter(Boolean) as string[],
          ),
        ]
      : [];
    return {
      ...roll,
      currentUsageMb: usedMb,
      remainingMb,
      remainingM2: remainingMb * widthM,
      customerNames,
      createdByName: roll.createdBy ? creatorMap.get(roll.createdBy) ?? null : null,
    };
  });

  if (tab === 'sold') {
    return enriched.filter((r) => r.status === 'archived');
  }

  return enriched;
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
  initialRemainingMb?: number;
  deliveryDate?: string;
  photoUrl?: string;
  extractionConfidence?: Record<string, number>;
  createdBy?: string | null;
}): Promise<string> {
  const { data: row, error } = await supabase
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
      initial_remaining_mb: data.initialRemainingMb ?? data.lengthM,
      delivery_date: data.deliveryDate || null,
      photo_url: data.photoUrl || null,
      extraction_confidence: data.extractionConfidence || null,
      created_by: data.createdBy ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return row.id;
}

export async function createRollsBatch(
  rolls: Parameters<typeof createRoll>[0][],
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
    initial_remaining_mb: data.initialRemainingMb ?? data.lengthM,
    delivery_date: data.deliveryDate || null,
    photo_url: data.photoUrl || null,
    extraction_confidence: data.extractionConfidence || null,
    created_by: data.createdBy ?? null,
  }));

  const { data: inserted, error } = await supabase
    .from('sales_rolls')
    .insert(rows)
    .select('id');

  if (error) throw new Error(error.message);
  return (inserted || []).map((r: { id: string }) => r.id);
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
  }>,
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

  const { error } = await supabase.from('sales_rolls').update(update).eq('id', id);

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
  const { data: usages, error: checkErr } = await supabase
    .from('sales_roll_usages')
    .select('id')
    .eq('roll_id', id)
    .limit(1);

  if (checkErr) throw new Error(checkErr.message);
  if (usages && usages.length > 0) {
    throw new Error(
      'Nie można usunąć rolki, która ma przypisane zużycie. Zarchiwizuj ją zamiast tego.',
    );
  }

  const { error } = await supabase.from('sales_rolls').delete().eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Roll Usages ────────────────────────────────────────────

export async function fetchRollUsages(rollId: string): Promise<SalesRollUsage[]> {
  const { data, error } = await supabase
    .from('sales_roll_usages')
    .select('id, roll_id, order_id, order_item_id, used_m2, used_mb, source, worker_name, note, created_at')
    .eq('roll_id', rollId)
    .order('created_at', { ascending: false });

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
  const { data: row, error } = await supabase
    .from('sales_roll_usages')
    .insert({
      roll_id: data.rollId,
      order_id: data.orderId,
      order_item_id: data.orderItemId,
      used_m2: data.usedM2,
      used_mb: data.usedMb,
      source: 'order',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return row.id;
}

export async function createManualRollUsage(data: {
  rollId: string;
  usedMb: number;
  usedM2: number;
  source: 'manual' | 'worker';
  workerName?: string;
  note?: string;
}): Promise<string> {
  const { data: row, error } = await supabase
    .from('sales_roll_usages')
    .insert({
      roll_id: data.rollId,
      used_mb: data.usedMb,
      used_m2: data.usedM2,
      source: data.source,
      worker_name: data.workerName || null,
      note: data.note || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return row.id;
}

export async function updateManualRollUsage(
  id: string,
  data: {
    usedMb: number;
    usedM2: number;
    source: 'manual' | 'worker';
    workerName?: string;
    note?: string;
  },
): Promise<void> {
  const { data: rows, error } = await supabase
    .from('sales_roll_usages')
    .update({
      used_mb: data.usedMb,
      used_m2: data.usedM2,
      source: data.source,
      worker_name: data.workerName || null,
      note: data.note || null,
    })
    .eq('id', id)
    .neq('source', 'order')
    .select('id');

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) {
    throw new Error('Nie udało się zaktualizować zużycia — brak uprawnień lub rekord nie istnieje.');
  }
}

export async function deleteRollUsage(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('sales_roll_usages')
    .delete()
    .eq('id', id)
    .neq('source', 'order')
    .select('id');

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error('Nie udało się usunąć zużycia — brak uprawnień lub rekord nie istnieje.');
  }
}

export async function deleteRollUsagesByOrderItem(orderItemId: string): Promise<void> {
  const { error } = await supabase
    .from('sales_roll_usages')
    .delete()
    .eq('order_item_id', orderItemId);

  if (error) throw new Error(error.message);
}

export async function deleteRollUsagesByOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('sales_roll_usages')
    .delete()
    .eq('order_id', orderId);

  if (error) throw new Error(error.message);
}

// ─── Fetch single roll with remaining usage ─────────────────

export async function fetchRollRemainingMb(
  rollId: string,
  excludeOrderId?: string,
): Promise<{ lengthM: number; widthMm: number; usedMb: number; remainingMb: number }> {
  const { data: roll, error: rollErr } = await supabase
    .from('sales_rolls')
    .select('length_m, width_mm, initial_remaining_mb')
    .eq('id', rollId)
    .single();

  if (rollErr || !roll) throw new Error(rollErr?.message || 'Roll not found');

  let query = supabase.from('sales_roll_usages').select('used_mb').eq('roll_id', rollId);

  if (excludeOrderId) {
    query = query.neq('order_id', excludeOrderId);
  }

  const { data: usages, error: usageErr } = await query;
  if (usageErr) throw new Error(usageErr.message);

  const usageMb = (usages || []).reduce((sum: number, u: { used_mb: number | string }) => sum + Number(u.used_mb), 0);
  const lengthM = Number(roll.length_m);
  const widthMm = Number(roll.width_mm);
  const initialRemainingMb = Number(roll.initial_remaining_mb ?? lengthM);

  return {
    lengthM,
    widthMm,
    usedMb: (lengthM - initialRemainingMb) + usageMb,
    remainingMb: Math.max(0, initialRemainingMb - usageMb),
  };
}

// ─── Fetch single roll by ID (with usage) ───────────────────

export async function fetchRollById(rollId: string): Promise<SalesRoll | null> {
  const { data: row, error } = await supabase
    .from('sales_rolls')
    .select('*')
    .eq('id', rollId)
    .single();

  if (error || !row) return null;

  const roll = mapDbRow(row as RollDbRow);

  const { data: usageRows } = await supabase
    .from('sales_roll_usages')
    .select('used_mb')
    .eq('roll_id', rollId);

  const usageMb = (usageRows || []).reduce((sum: number, u: { used_mb: number | string }) => sum + Number(u.used_mb), 0);
  const usedMb = (roll.lengthM - roll.initialRemainingMb) + usageMb;
  const remainingMb = Math.max(0, roll.initialRemainingMb - usageMb);
  const widthM = roll.widthMm / 1000;

  return {
    ...roll,
    currentUsageMb: usedMb,
    remainingMb,
    remainingM2: remainingMb * widthM,
  };
}

// ─── Active rolls by product name (for order autocomplete) ──

export async function fetchActiveRollsByProductName(
  instanceId: string,
  productName: string,
): Promise<SalesRoll[]> {
  return fetchRolls(instanceId, 'active').then((rolls) =>
    rolls.filter((r) => r.productName.toLowerCase() === productName.toLowerCase()),
  );
}

// ─── AI Extraction ──────────────────────────────────────────

export async function extractRollData(imageBase64: string, mediaType: string, instanceId: string) {
  const { data, error } = await supabase.functions.invoke('extract-roll-data', {
    body: { imageBase64, mediaType: mediaType || 'image/jpeg', instanceId },
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
    confidence: Record<string, number>;
    warnings: string[];
    rawText?: string;
  };
}

// ─── Photo Upload ───────────────────────────────────────────

export async function uploadRollPhoto(file: File, instanceId: string): Promise<string> {
  const blob = await compressImage(file, 1200, 0.8);
  const uuid = crypto.randomUUID();
  const fileName = `${instanceId}/${uuid}.jpg`;

  const { error } = await supabase.storage.from('roll-photos').upload(fileName, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
  });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from('roll-photos').getPublicUrl(fileName);

  return urlData.publicUrl;
}

// ─── File to Base64 ─────────────────────────────────────────

export async function fileToBase64(file: File): Promise<string> {
  // Convert to JPEG first — Google Vision doesn't support HEIC
  const blob = await compressImage(file, 2048, 0.9);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
