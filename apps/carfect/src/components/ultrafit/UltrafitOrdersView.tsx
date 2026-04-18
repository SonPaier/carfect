import { useState, useEffect, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, ChevronRight, ChevronDown, ExternalLink, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Input,
  Badge,
  Button,
  EmptyState,
  useIsMobile,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  PaginationFooter,
} from '@shared/ui';
import { useUltrafitOrders } from '@/hooks/useUltrafitOrders';
import { useUltrafitOrderRolls } from '@/hooks/useUltrafitOrderRolls';
import type { UltrafitOrder, UltrafitOrderItem } from '@/types/ultrafit';

interface UltrafitOrdersViewProps {
  instanceId: string | null;
}

const PAGE_SIZE = 25;

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy');
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number, currency: string): string {
  const formatted = value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency === 'EUR') return `${formatted} €`;
  return `${formatted} zł`;
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  if (status === 'new' || status === 'nowy') {
    return (
      <Badge className="border-amber-500 text-amber-600 bg-transparent hover:bg-transparent">
        {t('integrations.orders.statusNew')}
      </Badge>
    );
  }
  if (status === 'shipped' || status === 'wysłany') {
    return (
      <Badge className="border-green-500 text-green-600 bg-transparent hover:bg-transparent">
        {t('integrations.orders.statusShipped')}
      </Badge>
    );
  }
  if (status === 'cancelled' || status === 'anulowany') {
    return (
      <Badge variant="destructive">
        {t('integrations.orders.statusCancelled')}
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function DeliveryBadge({ deliveryType }: { deliveryType: string | null }) {
  if (!deliveryType) return <span className="text-muted-foreground">—</span>;

  const label =
    deliveryType === 'wysyłka' || deliveryType === 'shipment'
      ? 'wysyłka'
      : deliveryType === 'odbiór' || deliveryType === 'pickup'
        ? 'odbiór'
        : deliveryType === 'uber'
          ? 'uber'
          : deliveryType;

  return <Badge variant="outline">{label}</Badge>;
}

function RollsSubRow({ orderId, itemId }: { orderId: string; itemId: string }) {
  const { data, isLoading } = useUltrafitOrderRolls({ orderId, enabled: true });

  if (isLoading) {
    return <div className="text-xs text-muted-foreground py-1">Ładowanie rolek...</div>;
  }

  const rolls = data?.rolls ?? [];
  if (rolls.length === 0) return null;

  return (
    <div className="mt-2 pl-4 border-l-2 border-border/50 space-y-1">
      {rolls.map((roll, idx) => (
        <div key={idx} className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">{roll.brand}</span>
          <span>{roll.productName}</span>
          <span>{roll.widthMm} mm</span>
          <span>{roll.usedMb} mb</span>
          <span className="font-mono">{roll.barcode}</span>
        </div>
      ))}
    </div>
  );
}

function OrderItemRow({
  item,
  orderId,
  itemIndex,
}: {
  item: UltrafitOrderItem;
  orderId: string;
  itemIndex: number;
}) {
  const [rollsExpanded, setRollsExpanded] = useState(false);
  const hasRolls = item.productType === 'roll';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {hasRolls && (
            <button
              type="button"
              onClick={() => setRollsExpanded((prev) => !prev)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={rollsExpanded ? 'Ukryj rolki' : 'Pokaż rolki'}
            >
              {rollsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <span className="text-muted-foreground truncate">
            {item.name}
            {item.vehicle && (
              <span className="ml-2 text-xs text-muted-foreground/70">({item.vehicle})</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0 tabular-nums text-xs text-muted-foreground">
          <span>
            {item.quantity} {item.unit}
          </span>
          <span className="w-24 text-right">{formatCurrency(item.priceNet, 'PLN')}</span>
        </div>
      </div>
      {rollsExpanded && hasRolls && (
        <RollsSubRow orderId={orderId} itemId={`${orderId}-item-${itemIndex}`} />
      )}
    </div>
  );
}

function ExpandedOrderItems({ order }: { order: UltrafitOrder }) {
  return (
    <div className="bg-card px-6 py-4 border-t border-border/50 space-y-1.5">
      {order.items.map((item, idx) => (
        <OrderItemRow key={idx} item={item} orderId={order.id} itemIndex={idx} />
      ))}
    </div>
  );
}

function OrderCardMobile({
  order,
  expanded,
  onToggle,
}: {
  order: UltrafitOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-border/50 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-sm">{order.orderNumber}</div>
          <div className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('integrations.orders.totalNet')}</span>
        <span className="font-medium">{formatCurrency(order.totalNet, order.currency)}</span>
      </div>

      {order.deliveryType && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('integrations.orders.delivery')}</span>
          <DeliveryBadge deliveryType={order.deliveryType} />
        </div>
      )}

      {order.shippedAt && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('integrations.orders.shippedDate')}</span>
          <span>{formatDate(order.shippedAt)}</span>
        </div>
      )}

      {order.trackingNumber && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('integrations.orders.trackingNumber')}</span>
          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              {order.trackingNumber}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span>{order.trackingNumber}</span>
          )}
        </div>
      )}

      {order.items.length > 0 && (
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onToggle}>
          {expanded
            ? t('integrations.orders.hideProducts')
            : t('integrations.orders.showProducts')}
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          )}
        </Button>
      )}

      {expanded && <ExpandedOrderItems order={order} />}
    </div>
  );
}

export default function UltrafitOrdersView({ instanceId }: UltrafitOrdersViewProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useUltrafitOrders({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    enabled: !!instanceId,
  });

  const orders = data?.orders ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function toggleRow(orderId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
        <h1 className="text-lg font-semibold">{t('integrations.orders.title')}</h1>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('integrations.orders.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {t('common.loading')}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('integrations.orders.empty')}
            description={t('integrations.orders.emptyDescription')}
          />
        ) : isMobile ? (
          /* Mobile: cards */
          <div className="p-4 space-y-3">
            {orders.map((order) => (
              <OrderCardMobile
                key={order.id}
                order={order}
                expanded={expandedRows.has(order.id)}
                onToggle={() => toggleRow(order.id)}
              />
            ))}
          </div>
        ) : (
          /* Desktop: table */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>{t('integrations.orders.orderNumber')}</TableHead>
                <TableHead>{t('integrations.orders.orderDate')}</TableHead>
                <TableHead>{t('integrations.orders.shippedDate')}</TableHead>
                <TableHead>{t('integrations.orders.delivery')}</TableHead>
                <TableHead>{t('integrations.orders.trackingNumber')}</TableHead>
                <TableHead className="text-right">{t('integrations.orders.totalNet')}</TableHead>
                <TableHead>{t('integrations.orders.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const isExpanded = expandedRows.has(order.id);
                return (
                  <Fragment key={order.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggleRow(order.id)}
                    >
                      <TableCell className="w-8">
                        <button
                          type="button"
                          className="p-1 rounded text-muted-foreground hover:text-foreground"
                          aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        {order.shippedAt ? formatDate(order.shippedAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <DeliveryBadge deliveryType={order.deliveryType} />
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.trackingNumber}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            order.trackingNumber
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(order.totalNet, order.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="p-0">
                          <ExpandedOrderItems order={order} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="shrink-0">
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            onPageSizeChange={() => {
              setCurrentPage(1);
            }}
            itemLabel={t('integrations.orders.orderNumber')}
          />
        </div>
      )}
    </div>
  );
}
