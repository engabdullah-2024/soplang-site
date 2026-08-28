'use client';

import { useCallback, useRef } from 'react';
import { tokenizeSoplangCode } from '@/lib/soplang-tokenizer';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  title?: string;
  className?: string;
}

export default function CodeEditor({
  value,
  onChange,
  onRun,
  title = 'main.sop',
  className = '',
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lineCount = value.split('\n').length;
  const tokens = tokenizeSoplangCode(value);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (preRef.current) {
      preRef.current.scrollTop = textarea.scrollTop;
      preRef.current.scrollLeft = textarea.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textarea.scrollTop;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = `${value.slice(0, start)}    ${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
    }
  };

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden border border-border bg-[#1e1e1e] shadow-lg ${className}`}
    >
      {/* macOS-style window header, matching CodeWindow elsewhere on the site */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/20 border-b border-white/5 shrink-0">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
        </div>
        <span className="font-mono text-xs text-gray-400">{title}</span>
        <span className="w-13" aria-hidden />
      </div>

      <div className="relative flex flex-1 min-h-0">
        <div
          ref={lineNumbersRef}
          aria-hidden
          className="select-none text-right pr-3 pl-4 py-4 text-sm font-mono leading-relaxed text-gray-500 overflow-hidden shrink-0"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <div className="relative flex-1 min-w-0">
          <pre
            ref={preRef}
            aria-hidden
            className="absolute inset-0 m-0 p-4 text-sm font-mono leading-relaxed whitespace-pre overflow-auto pointer-events-none"
          >
            {tokens.map((token, i) => (
              <span key={i} style={{ color: token.style.color }}>
                {token.content}
              </span>
            ))}
            {'\n'}
          </pre>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={syncScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="relative w-full h-full p-4 text-sm font-mono leading-relaxed bg-transparent text-transparent caret-white resize-none outline-none whitespace-pre overflow-auto"
            aria-label="Soplang code editor"
          />
        </div>
      </div>
    </div>
  );
}
