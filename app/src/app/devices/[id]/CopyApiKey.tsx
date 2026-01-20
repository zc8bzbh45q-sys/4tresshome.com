'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyApiKeyProps {
  apiKey: string;
}

export default function CopyApiKey({ apiKey }: CopyApiKeyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy
        </>
      )}
    </button>
  );
}
