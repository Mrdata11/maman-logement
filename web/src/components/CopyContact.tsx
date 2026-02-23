"use client";

import { useState } from "react";

export function CopyContact({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-sm px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] rounded-md hover:bg-[var(--surface)] transition-colors font-mono cursor-pointer"
      title="Cliquer pour copier"
    >
      {value}
      {copied && (
        <span className="ml-2 text-green-600 font-sans">
          Copie !
        </span>
      )}
    </button>
  );
}
