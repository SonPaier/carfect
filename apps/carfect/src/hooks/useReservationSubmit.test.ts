import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { validateReservationForm, useReservationSubmit } from './useReservationSubmit';
import type { ReservationFormData } from './useReservationSubmit';
import type { ReservationSlot } from '../components/admin/reservation-form';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/pushNotifications', () => ({
  sendPushNotification: vi.fn(),
  formatDateForPush: vi.fn().mockReturnValue('01.01.2026'),
}));

vi.mock('@shared/utils', () => ({
  normalizePhone: vi.fn((phone: string) => phone),
  isValidPhone: vi.fn().mockReturnValue(true),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/utils/pricing', () => ({
  calculatePricePair: vi.fn().mockReturnValue({ netto: 100, brutto: 123 }),
}));

// Helper to build a valid slot
function buildSlot(overrides?: Partial<ReservationSlot>): ReservationSlot {
  return {
    id: 'slot-1',
    dateRange: { from: new Date('2026-01-01'), to: new Date('2026-01-01') },
    startTime: '09:00',
    endTime: '10:00',
    stationId: 'station-1',
    ...overrides,
  };
}

// Helper to build minimal valid form data
function buildFormData(overrides?: Partial<ReservationFormData>): ReservationFormData {
  return {
    customerName: 'Test Customer',
    phone: '+48123456789',
    carModel: 'Toyota Corolla',
    carSize: 'medium',
    selectedServices: ['service-1'],
    serviceItems: [{ service_id: 'service-1', custom_price: null }],
    servicesWithCategory: [],
    adminNotes: '',
    finalPrice: '',
    totalPrice: 100,
    offerNumber: '',
    assignedEmployeeIds: [],
    isCustomCarModel: false,
    selectedCustomerId: null,
    slots: [buildSlot()],
    arrivalDate: new Date('2026-01-01'),
    pickupDate: null,
    deadlineTime: '',
    ...overrides,
  };
}

// ─── Pure validation tests ───────────────────────────────────────────────────

describe('validateReservationForm', () => {
  describe('yard mode', () => {
    const yardOptions = {
      isYardMode: true,
      isEditMode: false,
    };

    it('requires phone', () => {
      const errors = validateReservationForm(
        { phone: '', carModel: 'Toyota', selectedServices: ['svc-1'], slots: [] },
        yardOptions,
      );
      expect(errors.phone).toBeDefined();
    });

    it('requires carModel', () => {
      const errors = validateReservationForm(
        { phone: '+48123456789', carModel: '', selectedServices: ['svc-1'], slots: [] },
        yardOptions,
      );
      expect(errors.carModel).toBeDefined();
    });

    it('requires at least one service', () => {
      const errors = validateReservationForm(
        { phone: '+48123456789', carModel: 'Toyota', selectedServices: [], slots: [] },
        yardOptions,
      );
      expect(errors.services).toBeDefined();
    });

    it('does not validate slots in yard mode', () => {
      const errors = validateReservationForm(
        { phone: '+48123456789', carModel: 'Toyota', selectedServices: ['svc-1'], slots: [] },
        yardOptions,
      );
      expect(errors.dateRange).toBeUndefined();
      expect(errors.time).toBeUndefined();
      expect(errors.station).toBeUndefined();
    });

    it('returns empty object when all valid', () => {
      const errors = validateReservationForm(
        { phone: '+48123456789', carModel: 'Toyota', selectedServices: ['svc-1'], slots: [] },
        yardOptions,
      );
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('reservation mode', () => {
    const reservationOptions = {
      isYardMode: false,
      isEditMode: false,
    };

    it('requires phone', () => {
      const errors = validateReservationForm(
        { phone: '', carModel: 'Toyota', selectedServices: ['svc-1'], slots: [buildSlot()] },
        reservationOptions,
      );
      expect(errors.phone).toBeDefined();
    });

    it('requires carModel', () => {
      const errors = validateReservationForm(
        { phone: '+48123456789', carModel: '', selectedServices: ['svc-1'], slots: [buildSlot()] },
        reservationOptions,
      );
      expect(errors.carModel).toBeDefined();
    });

    it('requires at least one service', () => {
      const errors = validateReservationForm(
        { phone: '+48123456789', carModel: 'Toyota', selectedServices: [], slots: [buildSlot()] },
        reservationOptions,
      );
      expect(errors.services).toBeDefined();
    });

    it('requires date for each slot', () => {
      const errors = validateReservationForm(
        {
          phone: '+48123456789',
          carModel: 'Toyota',
          selectedServices: ['svc-1'],
          slots: [buildSlot({ dateRange: undefined })],
        },
        reservationOptions,
      );
      expect(errors.dateRange).toBeDefined();
    });

    it('requires start and end time for each slot', () => {
      const errors = validateReservationForm(
        {
          phone: '+48123456789',
          carModel: 'Toyota',
          selectedServices: ['svc-1'],
          slots: [buildSlot({ startTime: '', endTime: '' })],
        },
        reservationOptions,
      );
      expect(errors.time).toBeDefined();
    });

    it('requires station when isEditMode is true and no initialStationId', () => {
      const errors = validateReservationForm(
        {
          phone: '+48123456789',
          carModel: 'Toyota',
          selectedServices: ['svc-1'],
          slots: [buildSlot({ stationId: null })],
        },
        { isYardMode: false, isEditMode: true },
      );
      expect(errors.station).toBeDefined();
    });

    it('requires station when no initialStationId in create mode', () => {
      const errors = validateReservationForm(
        {
          phone: '+48123456789',
          carModel: 'Toyota',
          selectedServices: ['svc-1'],
          slots: [buildSlot({ stationId: null })],
        },
        { isYardMode: false, isEditMode: false, initialStationId: undefined },
      );
      expect(errors.station).toBeDefined();
    });

    it('does not require station when initialStationId is set in create mode', () => {
      const errors = validateReservationForm(
        {
          phone: '+48123456789',
          carModel: 'Toyota',
          selectedServices: ['svc-1'],
          slots: [buildSlot({ stationId: null })],
        },
        { isYardMode: false, isEditMode: false, initialStationId: 'station-123' },
      );
      expect(errors.station).toBeUndefined();
    });

    it('returns empty object when all valid', () => {
      const errors = validateReservationForm(
        {
          phone: '+48123456789',
          carModel: 'Toyota',
          selectedServices: ['svc-1'],
          slots: [buildSlot()],
        },
        reservationOptions,
      );
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});

// ─── Hook integration tests ───────────────────────────────────────────────────

describe('useReservationSubmit', () => {
  const mockOnSuccess = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSlotPreviewChange = vi.fn();

  const defaultOptions = {
    instanceId: 'instance-1',
    mode: 'reservation' as const,
    editingReservation: null,
    editingYardVehicle: null,
    initialStationId: undefined,
    currentUsername: 'admin',
    pricingMode: 'brutto' as const,
    onSuccess: mockOnSuccess,
    onClose: mockOnClose,
    onSlotPreviewChange: mockOnSlotPreviewChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns required interface', () => {
    const { result } = renderHook(() => useReservationSubmit(defaultOptions));

    expect(result.current.loading).toBe(false);
    expect(result.current.validationErrors).toEqual({});
    expect(result.current.setValidationErrors).toBeTypeOf('function');
    expect(result.current.handleSubmit).toBeTypeOf('function');
    expect(result.current.phoneInputRef).toBeDefined();
    expect(result.current.carModelRef).toBeDefined();
    expect(result.current.servicesRef).toBeDefined();
    expect(result.current.timeRef).toBeDefined();
    expect(result.current.dateRangeRef).toBeDefined();
  });

  it('sets validation errors when phone is missing', async () => {
    const { result } = renderHook(() => useReservationSubmit(defaultOptions));

    const formData = buildFormData({ phone: '' });

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(result.current.validationErrors.phone).toBeDefined();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('clears slot preview on submit', async () => {
    const { result } = renderHook(() => useReservationSubmit(defaultOptions));

    const formData = buildFormData({ phone: '' });

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(mockOnSlotPreviewChange).toHaveBeenCalledWith(null);
  });

  it('calls supabase insert for yard create mode', async () => {
    const { supabase: mockSupabase } = await import('@/integrations/supabase/client');
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

    const yardOptions = {
      ...defaultOptions,
      mode: 'yard' as const,
      editingYardVehicle: null,
    };

    const { result } = renderHook(() => useReservationSubmit(yardOptions));

    const formData = buildFormData({
      arrivalDate: new Date('2026-01-01'),
    });

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('yard_vehicles');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls supabase update for yard edit mode', async () => {
    const { supabase: mockSupabase } = await import('@/integrations/supabase/client');
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
    vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

    const editingYardVehicle = {
      id: 'yard-1',
      customer_name: 'Test',
      customer_phone: '+48123456789',
      vehicle_plate: 'ABC123',
      car_size: 'medium' as const,
      service_ids: [],
      arrival_date: '2026-01-01',
      pickup_date: null,
      deadline_time: null,
      notes: null,
      status: 'waiting',
      created_at: '2026-01-01T00:00:00Z',
    };

    const yardOptions = {
      ...defaultOptions,
      mode: 'yard' as const,
      editingYardVehicle,
    };

    const { result } = renderHook(() => useReservationSubmit(yardOptions));

    const formData = buildFormData({
      arrivalDate: new Date('2026-01-01'),
    });

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('yard_vehicles');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls supabase insert for reservation create mode', async () => {
    const { supabase: mockSupabase } = await import('@/integrations/supabase/client');

    // Mock customers lookup (no existing customer) and insert
    const mockCustomerSingle = vi.fn().mockResolvedValue({ data: null });
    const mockCustomerLimit = vi.fn().mockReturnValue({ maybeSingle: mockCustomerSingle });
    const mockCustomerEq2 = vi.fn().mockReturnValue({ limit: mockCustomerLimit });
    const mockCustomerEq1 = vi.fn().mockReturnValue({ eq: mockCustomerEq2 });
    const mockCustomerSelect = vi.fn().mockReturnValue({ eq: mockCustomerEq1 });
    const mockCustomerInsertSingle = vi.fn().mockResolvedValue({ data: { id: 'new-customer-1' }, error: null });
    const mockCustomerInsertSelect = vi.fn().mockReturnValue({ single: mockCustomerInsertSingle });
    const mockCustomerInsert = vi.fn().mockReturnValue({ select: mockCustomerInsertSelect });

    // Mock reservations insert
    const mockReservationInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'customers') {
        return { select: mockCustomerSelect, insert: mockCustomerInsert } as ReturnType<typeof mockSupabase.from>;
      }
      if (table === 'reservations') {
        return { insert: mockReservationInsert } as ReturnType<typeof mockSupabase.from>;
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) } as ReturnType<typeof mockSupabase.from>;
    });

    const { result } = renderHook(() => useReservationSubmit(defaultOptions));

    const formData = buildFormData({ selectedCustomerId: null });

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('reservations');
    expect(mockReservationInsert).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error toast when supabase insert fails', async () => {
    const { supabase: mockSupabase } = await import('@/integrations/supabase/client');
    const { toast } = await import('sonner');

    // Make customers query return null, then insert fail for reservations
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'c1' }, error: null }),
            }),
          }),
        } as ReturnType<typeof mockSupabase.from>;
      }
      if (table === 'reservations') {
        return {
          insert: vi.fn().mockResolvedValue({ error: new Error('DB error') }),
        } as ReturnType<typeof mockSupabase.from>;
      }
      return {} as ReturnType<typeof mockSupabase.from>;
    });

    const { result } = renderHook(() => useReservationSubmit(defaultOptions));

    const formData = buildFormData({ selectedCustomerId: null });

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(toast.error).toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
