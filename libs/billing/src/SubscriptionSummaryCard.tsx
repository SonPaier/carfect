import { Badge } from '@shared/ui';
import type { SubscriptionSummary } from './billing.types';
import { SMS_OVERAGE_PRICE } from './billing.types';
import { formatDate } from './formatDate';

export function SubscriptionSummaryCard({ summary }: SubscriptionSummaryCardProps) {
  const {
    monthlyPrice,
    stationLimit,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    nextBillingDate,
    smsUsed,
    smsLimit,
  } = summary;

  // Display period end = day before next billing date (non-overlapping convention)
  const periodEndDisplay = currentPeriodEnd
    ? (() => {
        const d = new Date(currentPeriodEnd + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() - 1);
        return d.toISOString().split('T')[0];
      })()
    : null;

  const isOverLimit = smsUsed > smsLimit;
  const overCount = isOverLimit ? smsUsed - smsLimit : 0;
  const overCost = (overCount * SMS_OVERAGE_PRICE).toFixed(2).replace('.', ',');

  return (
    <div>
      <h4 className="text-base font-semibold mb-4">Subskrypcja</h4>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Cena</dt>
          <dd className="mt-1 font-medium">
            {monthlyPrice} zł netto / mies.
            <span className="block text-xs text-muted-foreground">powiększone o 23% VAT</span>
          </dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">Stanowiska</dt>
          <dd className="mt-1 font-medium">{stationLimit}</dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">Status</dt>
          <dd className="mt-1">
            {status === 'active' ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">Aktywna</Badge>
            ) : (
              <Badge variant="secondary">Nieaktywna</Badge>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">Obecny okres</dt>
          <dd className="mt-1 font-medium">
            {formatDate(currentPeriodStart)}–{formatDate(periodEndDisplay)}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">Kolejne rozliczenie</dt>
          <dd className="mt-1 font-medium">{formatDate(nextBillingDate)}</dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">
            SMS w bieżącym okresie
            {currentPeriodStart && periodEndDisplay && (
              <span className="block text-xs text-muted-foreground/70">
                ({formatDate(currentPeriodStart)}–{formatDate(periodEndDisplay)})
              </span>
            )}
          </dt>
          <dd className="mt-1 font-medium">
            {smsUsed} / {smsLimit}
            {isOverLimit && (
              <span className="block text-xs text-destructive font-medium">
                +{overCount} SMS ponad limit = {overCost} zł netto
              </span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
