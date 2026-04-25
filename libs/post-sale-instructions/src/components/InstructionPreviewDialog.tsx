import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@shared/ui';
import { X } from 'lucide-react';
import type { PublicInstructionData } from '../hooks/usePublicInstruction';
import type { InstructionListItem } from '../types';
import { previewInstructionPdf } from '../pdfClient';
import { InstructionPublicView } from './InstructionPublicView';

interface PreviewInstance {
  name?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  contact_person?: string;
}

interface InstructionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InstructionListItem | null;
  instance: PreviewInstance;
}

export function InstructionPreviewDialog({
  open,
  onOpenChange,
  item,
  instance,
}: InstructionPreviewDialogProps) {
  const { t } = useTranslation();

  const data = useMemo<PublicInstructionData | null>(() => {
    if (!item) return null;
    if (item.kind === 'builtin') {
      return {
        title: item.template.titlePl,
        content: item.template.getContent(),
        instance,
      };
    }
    return {
      title: item.row.title,
      content: item.row.content as PublicInstructionData['content'],
      instance,
    };
  }, [item, instance]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ maxWidth: '900px', width: '95vw' }}
        className="[&>button]:hidden max-h-[100dvh] sm:max-h-[90vh] h-[100dvh] sm:h-auto p-0 overflow-hidden rounded-none sm:rounded-md"
      >
        <div className="absolute top-3 right-3 z-50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors shadow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {data && (
          <div className="h-full overflow-y-auto">
            <InstructionPublicView
              data={data}
              publicToken="preview"
              onDownloadPdf={() =>
                previewInstructionPdf({
                  title: data.title,
                  content: data.content,
                  instance: data.instance,
                })
              }
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
