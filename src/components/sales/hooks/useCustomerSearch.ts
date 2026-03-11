import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CUSTOMER_SEARCH_MIN_LENGTH } from '../constants';

export interface SalesCustomerRef {
  id: string;
  name: string;
  discountPercent?: number;
}

export function useCustomerSearch(instanceId: string | null) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<SalesCustomerRef | null>(null);
  const [searchResults, setSearchResults] = useState<SalesCustomerRef[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchCustomers = useCallback(async (q: string) => {
    if (!instanceId || q.length < CUSTOMER_SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    const { data } = await (supabase
      .from('customers')
      .select('id, name, discount_percent')
      .eq('instance_id', instanceId)
      .eq('source', 'sales')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(10) as any);

    const results: SalesCustomerRef[] = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      discountPercent: c.discount_percent ?? undefined,
    }));
    setSearchResults(results);
    setDropdownOpen(true);
    setActiveIndex(-1);
    setSearching(false);
  }, [instanceId]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchCustomers(customerSearch), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [customerSearch, searchCustomers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownOpen) return;
    const totalItems = searchResults.length + (searchResults.length === 0 && customerSearch.length >= CUSTOMER_SEARCH_MIN_LENGTH ? 1 : 0);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < searchResults.length) {
          handleSelectCustomer(searchResults[activeIndex]);
        }
        break;
      case 'Escape':
        setDropdownOpen(false);
        break;
    }
  };

  const handleSelectCustomer = (c: SalesCustomerRef) => {
    setSelectedCustomer(c);
    setCustomerSearch('');
    setDropdownOpen(false);
    setSearchResults([]);
  };

  return {
    customerSearch,
    setCustomerSearch,
    selectedCustomer,
    setSelectedCustomer,
    searchResults,
    searching,
    dropdownOpen,
    setDropdownOpen,
    activeIndex,
    setActiveIndex,
    containerRef,
    handleCustomerKeyDown,
    handleSelectCustomer,
    searchCustomers,
  };
}
