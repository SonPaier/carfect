interface Vehicle {
  id: string;
  phone: string;
  model: string;
  plate: string | null;
  customer_id: string | null;
  customer_name?: string;
  car_size?: string | null;
  last_used_at?: string | null;
}

/** Merge vehicles with the same phone into one entry, joining model names with comma */
export function mergeVehiclesByPhone<T extends Vehicle>(vehicles: T[]): T[] {
  const byPhone = new Map<string, T & { models: string[] }>();
  for (const v of vehicles) {
    const existing = byPhone.get(v.phone);
    if (existing) {
      if (v.model && !existing.models.includes(v.model)) {
        existing.models.push(v.model);
      }
    } else {
      byPhone.set(v.phone, { ...v, models: [v.model].filter(Boolean) });
    }
  }
  return Array.from(byPhone.values()).map(({ models, ...rest }) => ({
    ...rest,
    model: models.join(', '),
  })) as T[];
}
