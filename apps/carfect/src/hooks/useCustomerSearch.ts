import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, isValidPhone } from '@shared/utils';
import { mergeVehiclesByPhone } from '@/lib/mergeVehiclesByPhone';
import type { CustomerVehicle, Customer, CarSize } from '@/components/admin/reservation-form';

interface UseCustomerSearchOptions {
  instanceId: string;
  phone: string;
  isEditMode: boolean;
  onVehicleAutoFill?: (vehicle: { model: string; carSize: CarSize }) => void;
}

interface UseCustomerSearchReturn {
  // Search state
  searchingCustomer: boolean;
  foundVehicles: CustomerVehicle[];
  foundCustomers: Customer[];
  showPhoneDropdown: boolean;
  setShowPhoneDropdown: (v: boolean) => void;
  showCustomerDropdown: boolean;
  setShowCustomerDropdown: (v: boolean) => void;
  suppressNextSearch: () => void;

  // Customer state
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  customerDiscountPercent: number | null;
  setCustomerDiscountPercent: (v: number | null) => void;
  noShowWarning: { customerName: string; date: string; serviceName: string } | null;
  setNoShowWarning: (
    v: { customerName: string; date: string; serviceName: string } | null,
  ) => void;

  // Vehicle state
  customerVehicles: CustomerVehicle[];
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;

  // Actions
  searchByPhone: (searchPhone: string) => Promise<void>;
  fetchNoShowWarning: (customerPhone: string, customerName: string) => Promise<void>;
  loadCustomerVehicles: (phoneNumber: string, customerId?: string | null) => Promise<void>;
  selectVehicle: (vehicle: CustomerVehicle) => Promise<{
    customerName?: string;
    customerId?: string | null;
    carSize?: CarSize;
    discountPercent?: number | null;
    carModel: string;
    phone: string;
  }>;
  saveCarModelProposal: (carModel: string, carSize: CarSize) => Promise<void>;

  // Reset
  resetCustomerSearch: () => void;
}

function dbSizeToCarSize(dbSize: string | null | undefined): CarSize {
  if (dbSize === 'S') return 'small';
  if (dbSize === 'L') return 'large';
  return 'medium';
}

export function useCustomerSearch({
  instanceId,
  phone,
  isEditMode,
  onVehicleAutoFill,
}: UseCustomerSearchOptions): UseCustomerSearchReturn {
  const { t } = useTranslation();
  // Stable ref for callback to avoid infinite re-render loops
  const onVehicleAutoFillRef = useRef(onVehicleAutoFill);
  onVehicleAutoFillRef.current = onVehicleAutoFill;
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [foundVehicles, setFoundVehicles] = useState<CustomerVehicle[]>([]);
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const suppressPhoneSearchRef = useRef(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDiscountPercent, setCustomerDiscountPercent] = useState<number | null>(null);
  const [noShowWarning, setNoShowWarning] = useState<{
    customerName: string;
    date: string;
    serviceName: string;
  } | null>(null);

  const [customerVehicles, setCustomerVehicles] = useState<CustomerVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Search customer by phone (partial match on digits)
  const searchByPhone = useCallback(
    async (searchPhone: string) => {
      const digitsOnly = searchPhone.replace(/\D/g, '');
      if (digitsOnly.length < 3) {
        setFoundVehicles([]);
        setShowPhoneDropdown(false);
        return;
      }

      setSearchingCustomer(true);
      try {
        const { data, error } = await supabase
          .from('customer_vehicles')
          .select('id, phone, model, plate, customer_id')
          .eq('instance_id', instanceId)
          .or(`phone.ilike.%${digitsOnly}%`)
          .order('last_used_at', { ascending: false })
          .limit(5);

        if (!error && data) {
          const customerIds = data.filter((v) => v.customer_id).map((v) => v.customer_id!);
          const customerNames: Record<string, string> = {};

          if (customerIds.length > 0) {
            const { data: customersData } = await supabase
              .from('customers')
              .select('id, name')
              .eq('instance_id', instanceId)
              .in('id', customerIds);

            if (customersData) {
              customersData.forEach((c) => {
                customerNames[c.id] = c.name;
              });
            }
          }

          const vehiclesWithNames: CustomerVehicle[] = data.map((v) => ({
            ...v,
            customer_name: v.customer_id ? customerNames[v.customer_id] : undefined,
          }));

          // Merge vehicles by phone — one entry per customer, models joined
          const merged = mergeVehiclesByPhone(vehiclesWithNames);
          setFoundVehicles(merged);
          setShowPhoneDropdown(merged.length > 0);
        }
      } finally {
        setSearchingCustomer(false);
      }
    },
    [instanceId],
  );

  // Fetch last no-show details for a customer
  const fetchNoShowWarning = useCallback(
    async (customerPhone: string, customerName: string) => {
      try {
        const { data } = await supabase
          .from('reservations')
          .select('reservation_date, service_items, service_ids')
          .eq('instance_id', instanceId)
          .eq('customer_phone', customerPhone)
          .not('no_show_at', 'is', null)
          .order('no_show_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          let serviceName = t('common.unknownService');
          const items = data.service_items as Array<{ service_id: string; name?: string }> | null;
          if (items && Array.isArray(items) && items.length > 0 && items[0].name) {
            serviceName = items[0].name;
          }
          setNoShowWarning({
            customerName,
            date: data.reservation_date,
            serviceName,
          });
        } else {
          setNoShowWarning(null);
        }
      } catch {
        setNoShowWarning(null);
      }
    },
    [instanceId],
  );

  // Debounced phone search
  useEffect(() => {
    if (selectedCustomerId) return;

    // Skip search if suppressed (e.g. after programmatic value set in edit mode)
    if (suppressPhoneSearchRef.current) {
      suppressPhoneSearchRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      searchByPhone(phone);
    }, 300);
    return () => clearTimeout(timer);
  }, [phone, searchByPhone, selectedCustomerId]);

  // Load all vehicles for a phone number (and optionally customer_id) for pills display
  const loadCustomerVehicles = useCallback(
    async (phoneNumber: string, customerId?: string | null) => {
      const normalized = normalizePhone(phoneNumber);
      const validPhone = isValidPhone(normalized);
      if (!validPhone && !customerId) {
        setCustomerVehicles([]);
        setSelectedVehicleId(null);
        return;
      }

      try {
        // Build OR filter: match by phone and/or customer_id
        const orFilters: string[] = [];
        if (validPhone) {
          orFilters.push(`phone.eq.${normalized}`);
        }
        if (customerId) {
          orFilters.push(`customer_id.eq.${customerId}`);
        }

        const { data } = await supabase
          .from('customer_vehicles')
          .select('id, phone, model, plate, customer_id, car_size, last_used_at')
          .eq('instance_id', instanceId)
          .or(orFilters.join(','))
          .order('last_used_at', { ascending: false });

        if (data && data.length > 0) {
          // Deduplicate by model (same car might appear with different phone formats)
          const seen = new Set<string>();
          const unique = data.filter((v) => {
            const key = v.model.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          setCustomerVehicles(unique);
          // Default select the first (most recently used)
          setSelectedVehicleId(unique[0].id);
          // Auto-fill model and size via callback
          onVehicleAutoFillRef.current?.({
            model: unique[0].model,
            carSize: dbSizeToCarSize(unique[0].car_size),
          });
        } else {
          setCustomerVehicles([]);
          setSelectedVehicleId(null);
        }
      } catch (err) {
        console.error('Failed to load customer vehicles:', err);
      }
    },
    [instanceId],
  );

  // Effect to load vehicles when phone is valid E.164
  useEffect(() => {
    if (isEditMode) return; // Don't auto-load in edit mode

    if (isValidPhone(phone)) {
      loadCustomerVehicles(phone);
    } else {
      setCustomerVehicles([]);
      setSelectedVehicleId(null);
    }
  }, [phone, loadCustomerVehicles, isEditMode]);

  const selectVehicle = useCallback(
    async (vehicle: CustomerVehicle) => {
      suppressPhoneSearchRef.current = true;
      setShowPhoneDropdown(false);

      // Fetch car_size from customer_vehicles
      const { data: vehicleData } = await supabase
        .from('customer_vehicles')
        .select('car_size')
        .eq('id', vehicle.id)
        .maybeSingle();

      const carSize: CarSize = dbSizeToCarSize(vehicleData?.car_size);

      let customerName: string | undefined;
      let customerId: string | null | undefined;
      let discountPercent: number | null | undefined;

      if (vehicle.customer_id) {
        const { data } = await supabase
          .from('customers')
          .select('name, discount_percent, has_no_show')
          .eq('id', vehicle.customer_id)
          .maybeSingle();

        if (data?.name) {
          customerName = data.name;
          customerId = vehicle.customer_id;
        }
        discountPercent = data?.discount_percent || null;
        setCustomerDiscountPercent(data?.discount_percent || null);

        // Check no-show flag
        if (data?.has_no_show) {
          fetchNoShowWarning(vehicle.phone, data.name || vehicle.customer_name || '');
        } else {
          setNoShowWarning(null);
        }
      } else {
        setCustomerDiscountPercent(null);
        setNoShowWarning(null);
        discountPercent = null;
      }

      // Also load all vehicles for this phone and customer_id
      loadCustomerVehicles(vehicle.phone, vehicle.customer_id);

      return {
        customerName,
        customerId,
        carSize,
        discountPercent,
        carModel: vehicle.model,
        phone: vehicle.phone,
      };
    },
    [fetchNoShowWarning, loadCustomerVehicles],
  );

  const saveCarModelProposal = useCallback(async (carModel: string, carSize: CarSize) => {
    try {
      // Parse brand from car model string (first word is usually brand)
      const parts = carModel.trim().split(/\s+/);
      const brand = parts[0] || 'Do weryfikacji';
      const name = parts.length > 1 ? parts.slice(1).join(' ') : carModel;
      const size = carSize === 'small' ? 'S' : carSize === 'large' ? 'L' : 'M';

      // Insert as proposal - use upsert to avoid duplicates
      await supabase.from('car_models').upsert(
        {
          brand,
          name: name || brand,
          size,
          status: 'proposal',
          active: true,
        },
        {
          onConflict: 'brand,name',
          ignoreDuplicates: true,
        },
      );

      console.log('Car model proposal saved:', { brand, name, size });
    } catch (error) {
      // Silent failure - don't interrupt user flow
      console.error('Failed to save car model proposal:', error);
    }
  }, []);

  const resetCustomerSearch = useCallback(() => {
    setSearchingCustomer(false);
    setFoundVehicles([]);
    setFoundCustomers([]);
    setShowPhoneDropdown(false);
    setShowCustomerDropdown(false);
    setSelectedCustomerId(null);
    setCustomerDiscountPercent(null);
    setNoShowWarning(null);
    setCustomerVehicles([]);
    setSelectedVehicleId(null);
  }, []);

  return {
    searchingCustomer,
    foundVehicles,
    foundCustomers,
    showPhoneDropdown,
    setShowPhoneDropdown,
    showCustomerDropdown,
    setShowCustomerDropdown,
    suppressNextSearch: useCallback(() => {
      suppressPhoneSearchRef.current = true;
    }, []),

    selectedCustomerId,
    setSelectedCustomerId,
    customerDiscountPercent,
    setCustomerDiscountPercent,
    noShowWarning,
    setNoShowWarning,

    customerVehicles,
    selectedVehicleId,
    setSelectedVehicleId,

    searchByPhone,
    fetchNoShowWarning,
    loadCustomerVehicles,
    selectVehicle,
    saveCarModelProposal,

    resetCustomerSearch,
  };
}
