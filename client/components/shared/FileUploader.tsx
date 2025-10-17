import React, { useRef, useState } from 'react';
import { validateLicense, type ImageValidationError } from '@/lib/image-utils';

interface FileUploaderProps {
  onChange?: (url: string) => void;
  fileType?: 'image' | 'license';
}

export default function FileUploader({ onChange, fileType = 'image' }: FileUploaderProps) {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      if (fileType === 'license') {
        await validateLicense(file);
      }

      const url = URL.createObjectURL(file);
      onChange?.(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setLoading(false);
    }
  };

  const accept = fileType === 'license' ? '.pdf' : 'image/*';

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={loading}
        />
        {loading && <span className="text-sm text-muted-foreground">Processing...</span>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
