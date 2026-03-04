import React, { useState, useMemo } from 'react';
import { Search, Plus, MoreHorizontal, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface SalesCustomer {
  id: string;
  name: string;
  nip: string;
  city: string;
  caretaker: { name: string };
  phone: string;
  email: string;
  billingStreet?: string;
  billingCity?: string;
  billingPostalCode?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  contactPerson?: string;
  vatEu?: string;
  notes?: string;
}

const ITEMS_PER_PAGE = 10;

const SalesCustomersView = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const customers: SalesCustomer[] = [];

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nip.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [search, customers]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-foreground">Klienci</h2>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj klienta..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Button size="sm" className="gap-2" onClick={() => toast.info('Formularz dodawania klienta')}>
          <Plus className="w-4 h-4" />
          Dodaj klienta
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30px]" />
              <TableHead>Nazwa</TableHead>
              <TableHead>Miasto</TableHead>
              <TableHead>Opiekun</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Brak wyników
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((c) => {
                const isExpanded = expandedRows.has(c.id);
                return (
                  <React.Fragment key={c.id}>
                    <TableRow className="hover:bg-[#F1F5F9] cursor-pointer" onClick={() => toggleExpand(c.id)}>
                      <TableCell className="pr-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-medium max-w-[220px] truncate">{c.name}</TableCell>
                      <TableCell>{c.city}</TableCell>
                      <TableCell>
                        <span className="text-sm truncate">{c.caretaker.name}</span>
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="text-primary hover:underline text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {c.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${c.email}`} className="text-primary hover:underline text-sm truncate block max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                          {c.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info('Utwórz zamówienie')}>Utwórz zamówienie</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Edytuj')}>Edytuj</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => toast.info('Usuń')}>Usuń</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0">
                          <div className="bg-white dark:bg-card px-8 py-4 grid grid-cols-3 gap-6 text-sm border-t">
                            <div>
                              <p className="text-muted-foreground text-xs font-medium mb-1">NIP</p>
                              <p>{c.nip}</p>
                              {c.vatEu && (
                                <>
                                  <p className="text-muted-foreground text-xs font-medium mb-1 mt-3">VAT EU</p>
                                  <p>{c.vatEu}</p>
                                </>
                              )}
                              {c.contactPerson && (
                                <>
                                  <p className="text-muted-foreground text-xs font-medium mb-1 mt-3">Osoba kontaktowa</p>
                                  <p>{c.contactPerson}</p>
                                </>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs font-medium mb-1">Adres faktury</p>
                              {c.billingStreet ? (
                                <>
                                  <p>{c.billingStreet}</p>
                                  <p>{c.billingPostalCode} {c.billingCity}</p>
                                </>
                              ) : (
                                <p className="text-muted-foreground">—</p>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs font-medium mb-1">Adres wysyłki</p>
                              {c.shippingStreet ? (
                                <>
                                  <p>{c.shippingStreet}</p>
                                  <p>{c.shippingPostalCode} {c.shippingCity}</p>
                                </>
                              ) : (
                                <p className="text-muted-foreground">—</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Strona {page} z {totalPages} ({filtered.length} klientów)
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon className="w-4 h-4" />
              Poprzednia
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" className="w-9" onClick={() => setPage(p)}>
                {p}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Następna
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesCustomersView;
