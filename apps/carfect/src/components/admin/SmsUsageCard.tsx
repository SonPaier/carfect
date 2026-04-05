import { Progress } from '@shared/ui';
import { MessageSquare } from 'lucide-react';

interface SmsUsageCardProps {
  smsCount: number;
  smsLimit: number;
  showInstanceName?: boolean;
  instanceName?: string;
}

const SMS_OVER_LIMIT_PRICE = 0.12; // PLN netto per SMS

export function SmsUsageCard({
  smsCount,
  smsLimit,
  showInstanceName = false,
  instanceName,
}: SmsUsageCardProps) {
  const percentage = smsLimit > 0 ? (smsCount / smsLimit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  const isOverLimit = smsCount > smsLimit;
  const overCount = isOverLimit ? smsCount - smsLimit : 0;
  const overCost = (overCount * SMS_OVER_LIMIT_PRICE).toFixed(2).replace('.', ',');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {showInstanceName && instanceName ? instanceName : 'Zużycie SMS'}
        </span>
        <MessageSquare
          className={`h-4 w-4 ${isOverLimit ? 'text-destructive' : isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}
        />
      </div>
      <div className={`text-2xl font-bold ${isOverLimit ? 'text-destructive' : ''}`}>
        {smsCount} / {smsLimit}
      </div>
      <Progress
        value={Math.min(percentage, 100)}
        className={`mt-2 bg-slate-200 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
      />
      <p
        className={`text-xs mt-1 ${isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
      >
        {isOverLimit
          ? `${overCount} SMS ponad limit = ${overCost} zł netto`
          : isAtLimit
            ? 'Limit wyczerpany'
            : isNearLimit
              ? `Pozostało ${smsLimit - smsCount} SMS`
              : `${Math.round(percentage)}% wykorzystane`}
      </p>
      {isOverLimit && (
        <p className="text-xs text-muted-foreground mt-1">
          1 SMS ponad limit = 0,12 zł netto. Zostanie doliczone do najbliższej faktury.
        </p>
      )}
    </div>
  );
}
