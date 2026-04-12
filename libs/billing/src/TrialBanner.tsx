import { Alert, AlertDescription, AlertTitle } from '@shared/ui';
import { formatDate } from './formatDate';

interface TrialBannerProps {
  trialExpiresAt: string;
  contactPhone: string;
}

function calcDaysRemaining(dateStr: string): number {
  const now = new Date();
  const expires = new Date(dateStr);
  const diffMs = expires.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function TrialBanner({ trialExpiresAt, contactPhone }: TrialBannerProps) {
  const formattedDate = formatDate(trialExpiresAt);
  const daysRemaining = calcDaysRemaining(trialExpiresAt);

  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-900">
      <AlertTitle className="text-amber-900 font-semibold">Okres próbny</AlertTitle>
      <AlertDescription className="text-amber-800">
        <p>Twój okres próbny kończy się {formattedDate}</p>
        <p>Pozostało {daysRemaining} dni</p>
        <p>
          Skontaktuj się aby aktywować lub przedłużyć:{' '}
          <a href={`tel:${contactPhone}`} className="font-medium underline">
            {contactPhone}
          </a>
        </p>
      </AlertDescription>
    </Alert>
  );
}
