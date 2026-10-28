import React from "react";

export function LegalPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[0.9em] font-medium text-amber-900 border border-amber-200/80"
      title="Placeholder field"
    >
      {children}
    </span>
  );
}

