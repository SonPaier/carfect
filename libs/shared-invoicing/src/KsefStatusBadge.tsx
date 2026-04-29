import { ExternalLink, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import type { KsefStatusInfo } from './fakturowniaMappers';

interface KsefStatusBadgeProps {
  ksef: KsefStatusInfo | null;
}

const STATUS_LABELS: Record<string, string> = {
  ok: 'Wysłana',
  processing: 'Wysyłka w toku',
  send_error: 'Błąd wysyłki',
  server_error: 'Błąd KSeF',
  not_applicable: 'Nie dotyczy',
};

export function KsefStatusBadge({ ksef }: KsefStatusBadgeProps) {
  if (!ksef || !ksef.status) return null;

  const status = ksef.status;
  const isOk = status === 'ok';
  const isProcessing = status === 'processing';
  const isError = status === 'send_error' || status === 'server_error';
  const isNa = status === 'not_applicable';

  const colorClasses = isOk
    ? 'bg-green-50 border-green-200 text-green-900'
    : isProcessing
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : isError
        ? 'bg-red-50 border-red-200 text-red-900'
        : 'bg-gray-50 border-gray-200 text-gray-700';

  const Icon = isOk ? CheckCircle2 : isProcessing ? Loader2 : isError ? AlertCircle : null;

  const label = STATUS_LABELS[status] || status;

  return (
    <div className={`rounded border ${colorClasses} px-3 py-2 text-xs space-y-1`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />}
        <span className="font-semibold">KSeF: {label}</span>
        {ksef.govId && <span className="text-muted-foreground font-mono">{ksef.govId}</span>}
        {ksef.verificationLink && (
          <a
            href={ksef.verificationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Weryfikuj
          </a>
        )}
      </div>
      {ksef.sendDate && <div className="text-muted-foreground">Wysłano: {ksef.sendDate}</div>}
      {isError && ksef.errorMessages.length > 0 && (
        <ul className="list-disc list-inside">
          {ksef.errorMessages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
