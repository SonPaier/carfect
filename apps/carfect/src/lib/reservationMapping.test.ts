import { describe, it, expect } from 'vitest';
import { mapRawReservation, type ServicesMap, type RawReservation } from './reservationMapping';

function makeServicesMap(entries: Array<{ id: string; name: string; shortcut?: string; price_small?: number }>): ServicesMap {
  const map: ServicesMap = new Map();
  for (const e of entries) {
    map.set(e.id, {
      id: e.id,
      name: e.name,
      shortcut: e.shortcut ?? null,
      price_small: e.price_small ?? null,
      price_medium: null,
      price_large: null,
      price_from: null,
    });
  }
  return map;
}

function makeRaw(overrides: Partial<RawReservation> = {}): RawReservation {
  return {
    id: 'r1',
    instance_id: 'inst-1',
    customer_name: 'Jan Kowalski',
    customer_phone: '123456789',
    customer_email: null,
    vehicle_plate: 'WA12345',
    car_size: null,
    reservation_date: '2026-04-10',
    end_date: null,
    start_time: '10:00',
    end_time: '12:00',
    station_id: null,
    status: 'confirmed',
    confirmation_code: 'ABC123',
    price: null,
    price_netto: null,
    customer_notes: null,
    admin_notes: null,
    source: null,
    service_id: null,
    service_ids: null,
    service_items: null,
    has_unified_services: null,
    photo_urls: null,
    assigned_employee_ids: null,
    offer_number: null,
    created_by: null,
    created_by_username: null,
    confirmation_sms_sent_at: null,
    pickup_sms_sent_at: null,
    checked_service_ids: null,
    original_reservation_id: null,
    cancelled_at: null,
    cancelled_by: null,
    change_request_note: null,
    completed_at: null,
    confirmed_at: null,
    created_at: null,
    edited_by_customer_at: null,
    no_show_at: null,
    released_at: null,
    reminder_1day_last_attempt_at: null,
    reminder_1day_sent: null,
    reminder_1hour_last_attempt_at: null,
    reminder_1hour_sent: null,
    reminder_failure_count: null,
    reminder_failure_reason: null,
    reminder_permanent_failure: null,
    started_at: null,
    updated_at: null,
    stations: null,
    ...overrides,
  };
}

const baseRaw = makeRaw();

describe('mapRawReservation', () => {
  it('maps basic fields from raw data', () => {
    const result = mapRawReservation(baseRaw, new Map());

    expect(result.id).toBe('r1');
    expect(result.customer_name).toBe('Jan Kowalski');
    expect(result.status).toBe('confirmed');
    expect(result.services_data).toBeUndefined();
    expect(result.station).toBeUndefined();
  });

  it('defaults status to pending when missing', () => {
    const result = mapRawReservation({ ...baseRaw, status: '' }, new Map());
    expect(result.status).toBe('pending');
  });

  describe('services_data mapping with service_ids (primary path)', () => {
    it('resolves names from servicesMap when service_items absent', () => {
      const svcMap = makeServicesMap([{ id: 's1', name: 'Mycie', shortcut: 'MY' }]);
      const raw = { ...baseRaw, service_ids: ['s1'], service_items: null };

      const result = mapRawReservation(raw, svcMap);

      expect(result.services_data).toEqual([
        expect.objectContaining({ id: 's1', name: 'Mycie', shortcut: 'MY' }),
      ]);
    });

    it('prefers service_items metadata over servicesMap', () => {
      const svcMap = makeServicesMap([{ id: 's1', name: 'Mycie (stare)', shortcut: 'OLD' }]);
      const raw = {
        ...baseRaw,
        service_ids: ['s1'],
        service_items: [{ service_id: 's1', custom_price: null, name: 'Mycie Premium', short_name: 'MP' }],
      };

      const result = mapRawReservation(raw, svcMap);

      expect(result.services_data![0].name).toBe('Mycie Premium');
      expect(result.services_data![0].shortcut).toBe('MP');
    });

    it('falls back to "Usługa" when no name found anywhere', () => {
      const raw = { ...baseRaw, service_ids: ['unknown-id'], service_items: null };
      const result = mapRawReservation(raw, new Map());

      expect(result.services_data![0].name).toBe('Usługa');
    });
  });

  describe('services_data mapping with service_items fallback', () => {
    it('uses service_items when service_ids is absent', () => {
      const raw = {
        ...baseRaw,
        service_ids: null,
        service_items: [
          { id: 's1', service_id: 's1', custom_price: null, name: 'Polerowanie' },
        ],
      };

      const result = mapRawReservation(raw, new Map());

      expect(result.services_data).toEqual([
        expect.objectContaining({ id: 's1', name: 'Polerowanie' }),
      ]);
    });

    it('deduplicates service_items by id', () => {
      const raw = {
        ...baseRaw,
        service_ids: null,
        service_items: [
          { id: 's1', service_id: 's1', custom_price: null, name: 'Mycie' },
          { id: 's1', service_id: 's1', custom_price: 100, name: 'Mycie' },
        ],
      };

      const result = mapRawReservation(raw, new Map());

      expect(result.services_data).toHaveLength(1);
    });

    it('filters out items without id', () => {
      const raw = {
        ...baseRaw,
        service_ids: null,
        service_items: [
          { service_id: '', custom_price: null, name: 'No ID' },
          { id: 's2', service_id: 's2', custom_price: null, name: 'Valid' },
        ],
      };

      const result = mapRawReservation(raw, new Map());

      expect(result.services_data).toHaveLength(1);
      expect(result.services_data![0].name).toBe('Valid');
    });
  });

  describe('includePrices option', () => {
    it('includes price fields by default', () => {
      const svcMap = makeServicesMap([{ id: 's1', name: 'Mycie', price_small: 50 }]);
      const raw = { ...baseRaw, service_ids: ['s1'] };

      const result = mapRawReservation(raw, svcMap);

      expect(result.services_data![0].price_small).toBe(50);
    });

    it('omits price fields when includePrices is false', () => {
      const svcMap = makeServicesMap([{ id: 's1', name: 'Mycie', price_small: 50 }]);
      const raw = { ...baseRaw, service_ids: ['s1'] };

      const result = mapRawReservation(raw, svcMap, { includePrices: false });

      expect(result.services_data![0].price_small).toBeUndefined();
    });
  });

  describe('station mapping', () => {
    it('maps station from stations relation', () => {
      const raw = { ...baseRaw, stations: { name: 'Stanowisko 1', type: 'washing' } };
      const result = mapRawReservation(raw, new Map());

      expect(result.station).toEqual({ name: 'Stanowisko 1', type: 'washing' });
    });

    it('returns undefined station when stations is null', () => {
      const raw = { ...baseRaw, stations: null };
      const result = mapRawReservation(raw, new Map());

      expect(result.station).toBeUndefined();
    });
  });

  describe('array fields normalization', () => {
    it('normalizes service_ids from array', () => {
      const raw = { ...baseRaw, service_ids: ['s1', 's2'] };
      const result = mapRawReservation(raw, new Map());
      expect(result.service_ids).toEqual(['s1', 's2']);
    });

    it('returns undefined for non-array service_ids', () => {
      const raw = { ...baseRaw, service_ids: 'not-an-array' };
      const result = mapRawReservation(raw, new Map());
      expect(result.service_ids).toBeUndefined();
    });

    it('normalizes assigned_employee_ids', () => {
      const raw = { ...baseRaw, assigned_employee_ids: ['e1'] };
      const result = mapRawReservation(raw, new Map());
      expect(result.assigned_employee_ids).toEqual(['e1']);
    });

    it('normalizes checked_service_ids', () => {
      const raw = { ...baseRaw, checked_service_ids: ['s1'] };
      const result = mapRawReservation(raw, new Map());
      expect(result.checked_service_ids).toEqual(['s1']);
    });
  });
});
