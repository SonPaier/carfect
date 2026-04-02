import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Check, Loader2, Search, X } from 'lucide-react';
import { Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export interface PickedProduct {
  id: string;
  name: string;
  short_name: string | null;
  description: string | null;
  price: number;
}

interface Service {
  id: string;
  name: string;
  short_name: string | null;
  description: string | null;
  category_id: string | null;
  price_from: number | null;
}

interface Category {
  id: string;
  name: string;
  sort_order: number | null;
}

export interface OfferProductPickerDrawerProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  alreadyAddedProductIds: string[];
  onConfirm: (products: PickedProduct[]) => void;
}

export function OfferProductPickerDrawer({
  open,
  onClose,
  instanceId,
  alreadyAddedProductIds,
  onConfirm,
}: OfferProductPickerDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open and fetch data
  useEffect(() => {
    if (!open) return;

    setSelectedIds(new Set());
    setSearchQuery('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);

    const fetchData = async () => {
      if (!instanceId) return;
      setLoading(true);

      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          supabase
            .from('unified_services')
            .select('id, name, short_name, description, category_id, price_from')
            .eq('instance_id', instanceId)
            .eq('active', true)
            .in('service_type', ['both', 'offer'])
            .order('sort_order'),
          supabase
            .from('unified_categories')
            .select('id, name, sort_order')
            .eq('instance_id', instanceId)
            .eq('active', true)
            .in('category_type', ['both', 'offer'])
            .order('sort_order'),
        ]);

        if (servicesRes.data) setServices(servicesRes.data);
        if (categoriesRes.data) setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching offer products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, instanceId]);

  // Group services by category, filtered by search
  const groupedServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return categories
      .map((category) => {
        let categoryServices = services.filter((s) => s.category_id === category.id);

        if (query) {
          categoryServices = categoryServices.filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              (s.short_name && s.short_name.toLowerCase().includes(query)),
          );
        }

        return { category, services: categoryServices };
      })
      .filter((group) => group.services.length > 0);
  }, [services, categories, searchQuery]);

  const toggleProduct = (id: string) => {
    if (alreadyAddedProductIds.includes(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const picked: PickedProduct[] = Array.from(selectedIds)
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is Service => s !== undefined)
      .map((s) => ({
        id: s.id,
        name: s.name,
        short_name: s.short_name,
        description: s.description,
        price: s.price_from ?? 0,
      }));

    onConfirm(picked);
    onClose();
  };

  const formatPrice = (price: number | null): string => {
    if (price === null) return 'wycena';
    return `${price.toFixed(0)} zł`;
  };

  const alreadyAddedSet = useMemo(
    () => new Set(alreadyAddedProductIds),
    [alreadyAddedProductIds],
  );

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        hideOverlay
        hideCloseButton
        className="w-full sm:max-w-lg p-0 flex flex-col shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] z-[1100]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <SheetHeader
          className="border-b px-4 py-3 cursor-pointer hover:bg-hover-strong transition-colors shrink-0"
          onClick={onClose}
        >
          <SheetTitle className="flex items-center gap-3 text-lg font-semibold">
            <ArrowLeft className="w-5 h-5" />
            Wybierz usługi
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj usługi..."
              className="pl-9 pr-9 h-11"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : groupedServices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {searchQuery ? 'Nie znaleziono usług' : 'Brak dostępnych usług'}
            </div>
          ) : (
            <div className="pb-4">
              {groupedServices.map(({ category, services: categoryServices }) => (
                <div key={category.id} data-testid={`category-${category.id}`}>
                  {/* Category header */}
                  <div className="py-2 px-4 bg-white">
                    <p className="text-sm font-semibold text-foreground text-center uppercase tracking-wide">
                      {category.name}
                    </p>
                  </div>

                  {/* Services */}
                  {categoryServices.map((service) => {
                    const isAlreadyAdded = alreadyAddedSet.has(service.id);
                    const isSelected = selectedIds.has(service.id);

                    return (
                      <button
                        key={service.id}
                        type="button"
                        data-testid="product-item"
                        data-product-id={service.id}
                        onClick={() => toggleProduct(service.id)}
                        disabled={isAlreadyAdded}
                        className={cn(
                          'w-full flex items-center px-4 py-3 border-b border-border/50 transition-colors',
                          isAlreadyAdded
                            ? 'opacity-40 cursor-not-allowed'
                            : isSelected
                              ? 'bg-primary/5'
                              : 'hover:bg-hover',
                        )}
                      >
                        {/* Service info */}
                        <div className="flex-1 text-left">
                          {service.short_name ? (
                            <>
                              <p className="font-bold text-primary">{service.short_name}</p>
                              <p className="text-muted-foreground text-[11px] leading-tight">
                                {service.name}
                              </p>
                            </>
                          ) : (
                            <p className="font-medium text-foreground">{service.name}</p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right mr-4 ml-4">
                          <p className="font-semibold text-foreground">
                            {formatPrice(service.price_from)}
                          </p>
                        </div>

                        {/* Checkbox */}
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                            isAlreadyAdded
                              ? 'border-muted-foreground/40 bg-muted'
                              : isSelected
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/40',
                          )}
                        >
                          {(isSelected || isAlreadyAdded) && (
                            <Check className="w-4 h-4 text-primary-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-4 shrink-0 bg-background">
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="w-full h-12 text-base font-semibold"
            data-testid="confirm-button"
          >
            Dodaj wybrane ({selectedIds.size})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
