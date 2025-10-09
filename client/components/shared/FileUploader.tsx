import React from 'react';

export default function FileUploader({ onChange }: { onChange?: (url: string) => void }) {
  return (
    <div>
      <input type="file" onChange={(e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        onChange?.(url);
      }} />
    </div>
  );
}
