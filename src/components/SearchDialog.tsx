import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { search } from '@/lib/search';
import { Badge, cx } from './ui';

export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const nav = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => search(q), [q]);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => setSel(0), [q]);
  const go = (to: string) => {
    onClose();
    nav(to);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-3 pt-[10vh] backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal aria-label="Search">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-ink-200 px-4 dark:border-ink-700">
          <Search size={18} className="text-ink-400" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') (e.preventDefault(), setSel((s) => Math.min(s + 1, results.length - 1)));
              if (e.key === 'ArrowUp') (e.preventDefault(), setSel((s) => Math.max(s - 1, 0)));
              if (e.key === 'Enter' && results[sel]) go(results[sel].to);
            }}
            placeholder="Search: truss, Bernoulli, tempering, NAND, factor of safety…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-ink-400"
            aria-label="Search query"
          />
          <span className="kbd">Esc</span>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
          {q && results.length === 0 && <li className="p-6 text-center text-sm text-ink-500">No results for “{q}”. Try a broader term.</li>}
          {!q && (
            <li className="p-4 text-sm text-ink-500">
              Search across every module, syllabus dot point, concept, formula, material, process and common misconception.
            </li>
          )}
          {results.map((r, i) => (
            <li key={r.type + r.to + r.title} role="option" aria-selected={i === sel}>
              <button
                onMouseEnter={() => setSel(i)}
                onClick={() => go(r.to)}
                className={cx('flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left', i === sel ? 'bg-emerald-50 dark:bg-emerald-950/50' : '')}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900 dark:text-white">{r.title}</div>
                  <div className="truncate text-xs text-ink-500">{r.text}</div>
                </div>
                <Badge tone={r.accent ?? 'ink'}>{r.type}</Badge>
                {i === sel && <CornerDownLeft size={14} className="mt-1 text-ink-400" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
