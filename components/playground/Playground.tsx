'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import CodeEditor from './CodeEditor';
import { playgroundExamples } from '@/constants/playgroundExamples';
import { sample_codeSnippet } from '@/constants/codeSnippetData';

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number;
  error?: string;
}

function encodeCode(code: string): string {
  return btoa(unescape(encodeURIComponent(code)));
}

function decodeCode(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)));
}

export default function Playground() {
  const [code, setCode] = useState(sample_codeSnippet.trim());
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('code');
    if (!shared) return;
    try {
      setCode(decodeCode(shared));
    } catch {
      // Malformed share link — keep the default snippet.
    }
  }, []);

  const runCode = useCallback(async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          stdout: '',
          stderr: '',
          exitCode: null,
          timeMs: 0,
          error: data.error || 'Failed to run code.',
        });
      } else {
        setResult(data);
      }
    } catch {
      setResult({
        stdout: '',
        stderr: '',
        exitCode: null,
        timeMs: 0,
        error: 'Network error — could not reach the playground runner.',
      });
    } finally {
      setRunning(false);
    }
  }, [code]);

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?code=${encodeCode(code)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing we can do without user gesture context.
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.sop';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const example = playgroundExamples.find((ex) => ex.id === e.target.value);
    if (example) {
      setCode(example.code.trim() + '\n');
      setResult(null);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runCode}
          disabled={running}
          className="h-11 px-6 rounded-xl bg-gradient-primary text-primary-foreground font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icon
            icon={running ? 'lucide:loader-2' : 'lucide:play'}
            className={`w-4 h-4 ${running ? 'animate-spin' : ''}`}
          />
          {running ? 'Running...' : 'Run'}
        </button>

        <select
          onChange={handleExampleChange}
          defaultValue=""
          className="h-11 px-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground"
        >
          <option value="" disabled>
            Load an example
          </option>
          {playgroundExamples.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title}
            </option>
          ))}
        </select>

        <button
          onClick={handleShare}
          className="h-11 px-4 rounded-xl bg-card border border-border text-sm font-medium flex items-center gap-2 hover:bg-secondary/50 transition-all"
        >
          <Icon icon={shareCopied ? 'lucide:check' : 'lucide:share-2'} className="w-4 h-4" />
          {shareCopied ? 'Link Copied!' : 'Share'}
        </button>

        <button
          onClick={handleDownload}
          className="h-11 px-4 rounded-xl bg-card border border-border text-sm font-medium flex items-center gap-2 hover:bg-secondary/50 transition-all"
        >
          <Icon icon="lucide:download" className="w-4 h-4" />
          Download
        </button>

        <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
          Ctrl+Enter to run
        </span>
      </div>

      {/* Editor + Output */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CodeEditor value={code} onChange={setCode} onRun={runCode} className="h-120" />

        <div className="flex flex-col rounded-xl overflow-hidden border border-border bg-[#1e1e1e] shadow-lg h-120">
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/20 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  result?.error || (result && result.exitCode !== 0)
                    ? 'bg-red-500'
                    : result && result.exitCode === 0
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                }`}
              />
              <span className="font-mono text-xs text-gray-400">Output</span>
            </div>
            {result && !result.error && (
              <span className="text-xs text-gray-500 font-mono">
                exit {result.exitCode ?? '—'} · {result.timeMs}ms
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm whitespace-pre-wrap">
            {!result && !running && (
              <span className="text-gray-500">
                Hit <span className="text-gray-300">Run</span> to see your program&apos;s output
                here.
              </span>
            )}
            {running && <span className="text-gray-500">Running…</span>}
            {result?.error && <span className="text-red-400">{result.error}</span>}
            {result && !result.error && (
              <>
                {result.stdout && <div className="text-gray-100">{result.stdout}</div>}
                {result.stderr && <div className="text-red-400 mt-2">{result.stderr}</div>}
                {!result.stdout && !result.stderr && (
                  <span className="text-gray-500">(no output)</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <code>gelin()</code> (reading input) isn&apos;t supported here yet — programs run with
        empty stdin.
      </p>
    </div>
  );
}
