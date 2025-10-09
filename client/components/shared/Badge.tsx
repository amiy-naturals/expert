import React from 'react';

export default function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs font-semibold">{children}</span>;
}
