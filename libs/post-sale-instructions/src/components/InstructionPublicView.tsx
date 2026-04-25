import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, CardContent } from '@shared/ui';
import { Download, Loader2 } from 'lucide-react';
import type { PublicInstructionData } from '../hooks/usePublicInstruction';
import { openInstructionPdf } from '../pdfClient';
import { TiptapRenderer } from './TiptapRenderer';

interface InstructionPublicViewProps {
  data: PublicInstructionData;
  publicToken: string;
}

export function InstructionPublicView({ data, publicToken }: InstructionPublicViewProps) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await openInstructionPdf(publicToken);
    } catch {
      toast.error(t('publicInstruction.loadError'));
    } finally {
      setIsDownloading(false);
    }
  };

  const { instance } = data;

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6 sm:p-10 space-y-6">
            <header className="flex items-center gap-3 border-b pb-4">
              {instance.logo_url && (
                <img
                  src={instance.logo_url}
                  alt={instance.name ?? ''}
                  className="h-10 w-auto object-contain"
                />
              )}
              {instance.name && (
                <span className="text-lg font-semibold">{instance.name}</span>
              )}
            </header>

            <h1 className="text-2xl font-bold">{data.title}</h1>

            <article className="prose prose-sm max-w-none">
              <TiptapRenderer doc={data.content} />
            </article>

            <div className="flex justify-start">
              <Button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {t('publicInstruction.downloadPdf')}
              </Button>
            </div>

            <footer className="border-t pt-4 text-sm text-muted-foreground space-y-1">
              {instance.contact_person && <div>{instance.contact_person}</div>}
              {instance.phone && (
                <div>
                  <a href={`tel:${instance.phone}`} className="hover:underline">
                    {instance.phone}
                  </a>
                </div>
              )}
              {instance.email && (
                <div>
                  <a href={`mailto:${instance.email}`} className="hover:underline">
                    {instance.email}
                  </a>
                </div>
              )}
              {instance.address && <div>{instance.address}</div>}
              {instance.website && (
                <div>
                  <a
                    href={instance.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {instance.website}
                  </a>
                </div>
              )}
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
