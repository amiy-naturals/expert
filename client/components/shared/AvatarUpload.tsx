import React from 'react';

export default function AvatarUpload({ onChange }: { onChange?: (url: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="file" accept="image/*" onChange={(e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        onChange?.(url);
      }} />
    </div>
  );
}
