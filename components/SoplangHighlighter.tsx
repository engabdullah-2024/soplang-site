'use client';

import { tokenizeSoplangCode } from '@/lib/soplang-tokenizer';

interface SoplangHighlighterProps {
  code: string;
  title?: string;
  className?: string;
}

export default function SoplangHighlighter({ code, className = '' }: SoplangHighlighterProps) {
  const tokens = tokenizeSoplangCode(code);

  return (
    <pre className={`p-4 text-sm font-mono whitespace-pre leading-relaxed ${className}`}>
      {tokens.map((token, index) => (
        <span key={index} style={{ color: token.style.color }}>
          {token.content}
        </span>
      ))}
    </pre>
  );
}
