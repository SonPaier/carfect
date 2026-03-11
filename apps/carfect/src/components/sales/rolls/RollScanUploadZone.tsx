import { useCallback, useRef, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { Button } from '@shared/ui';

interface RollScanUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const RollScanUploadZone = ({ onFilesSelected, disabled }: RollScanUploadZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const imageFiles = Array.from(fileList).filter((f) =>
        f.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
    },
    [onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset so same file can be selected again
          e.target.value = '';
        }}
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          {dragOver ? (
            <Upload className="w-6 h-6 text-primary" />
          ) : (
            <ImagePlus className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            Przeciągnij zdjęcia etykiet rolek lub kliknij
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Obsługiwane formaty: JPG, PNG, HEIC. Możesz wgrać wiele zdjęć na raz.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={disabled} type="button">
          Wybierz pliki
        </Button>
      </div>
    </div>
  );
};

export default RollScanUploadZone;
