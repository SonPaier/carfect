import { Search, X, Plus, Loader2 } from 'lucide-react';
import { Input } from '@shared/ui';
import { Button } from '@shared/ui';
import { Label } from '@shared/ui';
import { type SalesCustomerRef } from '../hooks/useCustomerSearch';
import { CUSTOMER_SEARCH_MIN_LENGTH } from '../constants';

interface CustomerSearchSectionProps {
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  selectedCustomer: SalesCustomerRef | null;
  setSelectedCustomer: (c: SalesCustomerRef | null) => void;
  searchResults: SalesCustomerRef[];
  searching: boolean;
  dropdownOpen: boolean;
  setDropdownOpen: (v: boolean) => void;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleCustomerKeyDown: (e: React.KeyboardEvent) => void;
  handleSelectCustomer: (c: SalesCustomerRef) => void;
  onAddNewCustomer: () => void;
}

export const CustomerSearchSection = ({
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
  onAddNewCustomer,
}: CustomerSearchSectionProps) => {
  return (
    <div className="space-y-2">
      <Label>Klient</Label>
      {selectedCustomer ? (
        <div className="flex items-center justify-between bg-muted/20 border border-border rounded-md px-3 py-2">
          <span className="text-sm font-medium">{selectedCustomer.name}</span>
          <button
            onClick={() => setSelectedCustomer(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Wyszukaj klienta..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onFocus={() => {
                if (customerSearch.length >= CUSTOMER_SEARCH_MIN_LENGTH && searchResults.length > 0)
                  setDropdownOpen(true);
              }}
              onKeyDown={handleCustomerKeyDown}
              className="pl-9 pr-9"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {dropdownOpen && customerSearch.length >= CUSTOMER_SEARCH_MIN_LENGTH && (
            <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg overflow-hidden bg-card shadow-lg z-[9999]">
              {searchResults.length > 0 ? (
                searchResults.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`w-full px-4 py-3 text-left transition-colors border-b border-border last:border-0 ${
                      i === activeIndex ? 'bg-accent' : 'hover:bg-hover'
                    }`}
                    onClick={() => handleSelectCustomer(c)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                  </button>
                ))
              ) : !searching ? (
                <div className="p-4 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Nie znaleziono klientów</p>
                  <Button type="button" onClick={onAddNewCustomer}>
                    <Plus className="w-4 h-4 mr-1" />
                    Dodaj klienta
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
