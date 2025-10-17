import React, { useRef, useState } from 'react';
import { validateImage, compressImage, type ImageValidationError } from '@/lib/image-utils';

export default function AvatarUpload({ onChange }: { onChange?: (url: string) => void }) {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      await validateImage(file);
      const compressed = await compressImage(file);
      const url = URL.createObjectURL(compressed.blob);
      onChange?.(url);
    } catch (err) {
      const errObj = err as ImageValidationError | Error;
      const message = 'message' in errObj ? errObj.message : String(err);
      setError(message);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
          disabled={loading}
        />
        {loading && <span className="text-sm text-muted-foreground">Compressing...</span>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
