import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@shared/ui';
import { Download, FileText, Loader2 } from 'lucide-react';
import type { PublicInstructionData } from '../hooks/usePublicInstruction';
import { openInstructionPdf } from '../pdfClient';
import { TiptapRenderer } from './TiptapRenderer';

interface InstructionPublicViewProps {
  data: PublicInstructionData;
  publicToken: string;
  /**
   * Override the default PDF download handler. When supplied (e.g. from the
   * preview dialog) it replaces the public-token download flow.
   */
  onDownloadPdf?: () => Promise<void>;
}

export function InstructionPublicView({
  data,
  publicToken,
  onDownloadPdf,
}: InstructionPublicViewProps) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (onDownloadPdf) {
        await onDownloadPdf();
      } else {
        await openInstructionPdf(publicToken);
      }
    } catch {
      toast.error(t('publicInstruction.loadError'));
    } finally {
      setIsDownloading(false);
    }
  };

  const { instance } = data;
  const isHttpUrl = instance.website ? /^https?:\/\//i.test(instance.website) : false;

  return (
    <div className="min-h-full bg-background">
      {/* Header — mirrors PublicOfferCustomerView so admin/customer-facing pages
          share the same chrome. */}
      <header className="border-b">
        <div className="max-w-4xl w-full mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {instance.logo_url ? (
                <img
                  src={instance.logo_url}
                  alt={`Logo ${instance.name ?? ''}`}
                  className="h-12 object-contain"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <span className="font-bold text-lg truncate block">{instance.name}</span>
                <p className="text-sm opacity-70 truncate">{data.title}</p>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end gap-0.5 text-xs opacity-80">
              {instance.phone && (
                <a href={`tel:${instance.phone}`} className="hover:underline">
                  {instance.phone}
                </a>
              )}
              {instance.email && (
                <a href={`mailto:${instance.email}`} className="hover:underline">
                  {instance.email}
                </a>
              )}
              {instance.address && <span>{instance.address}</span>}
              {instance.website && isHttpUrl && (
                <a
                  href={instance.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {instance.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {t('publicInstruction.downloadPdf')}
          </Button>
        </div>

        <article className="prose prose-sm sm:prose max-w-none">
          <h1>{data.title}</h1>
          <TiptapRenderer doc={data.content} />
        </article>

        <footer className="text-center text-xs text-muted-foreground pt-8 pb-4 space-y-1">
          <p>
            {[
              instance.name,
              instance.address,
              instance.phone && `Tel: ${instance.phone}`,
              instance.email && `Email: ${instance.email}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p>Carfect.pl — CRM dla myjni samochodowych i detailingu</p>
        </footer>
      </main>
    </div>
  );
}
