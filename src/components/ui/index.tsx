import { useId, useState, type ReactNode } from 'react';
import { AlertTriangle, Info, Lightbulb, ListChecks, Ruler, ChevronDown } from 'lucide-react';
import { parseNum } from '@/lib/calc/format';
import { MathText } from './Math';
import { usePrefs } from '@/lib/prefs';

export { M, MathText } from './Math';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Card({ children, className, title, subtitle, icon, actions, id }: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cx('card card-pad', className)}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">{icon}</div>}
            <div className="min-w-0">
              {title && <h3 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h3>}
              {subtitle && <p className="text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, kicker, children, accent = 'emerald', icon }: {
  title: string;
  kicker?: string;
  children?: ReactNode;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {kicker && (
        <p className={cx('mb-1 text-xs font-semibold uppercase tracking-[0.14em]', accentText(accent))}>{kicker}</p>
      )}
      <h1 className="flex items-center gap-3 text-2xl font-bold text-ink-900 sm:text-3xl dark:text-white">
        {icon}
        {title}
      </h1>
      {children && <div className="prose-eng mt-2 max-w-3xl">{children}</div>}
    </header>
  );
}

export function accentText(a: string) {
  return (
    {
      civil: 'text-civil dark:text-civil-light',
      transport: 'text-transport dark:text-transport-light',
      aero: 'text-aero dark:text-aero-light',
      telecom: 'text-telecom dark:text-telecom-light',
    } as Record<string, string>
  )[a] ?? 'text-emerald-700 dark:text-emerald-400';
}
export function accentBg(a: string) {
  return (
    {
      civil: 'bg-civil',
      transport: 'bg-transport',
      aero: 'bg-aero',
      telecom: 'bg-telecom',
    } as Record<string, string>
  )[a] ?? 'bg-emerald-600';
}
export const ACCENT_HEX: Record<string, string> = {
  civil: '#2e7d32',
  transport: '#ea580c',
  aero: '#0284c7',
  telecom: '#7c3aed',
  emerald: '#059669',
};

export function Badge({ children, tone = 'ink', className }: { children: ReactNode; tone?: string; className?: string }) {
  const tones: Record<string, string> = {
    ink: 'border-ink-200 bg-ink-50 text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
    red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
    blue: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300',
    violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
    civil: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
    transport: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
    aero: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300',
    telecom: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
  };
  return <span className={cx('chip', tones[tone] ?? tones.ink, className)}>{children}</span>;
}

type CalloutKind = 'info' | 'warn' | 'tip' | 'assume' | 'exam';
export function Callout({ kind = 'info', title, children, className }: { kind?: CalloutKind; title?: string; children: ReactNode; className?: string }) {
  const map = {
    info: { icon: <Info size={16} />, cls: 'border-sky-200 bg-sky-50/70 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100', t: 'Note' },
    warn: { icon: <AlertTriangle size={16} />, cls: 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100', t: 'Common mistake' },
    tip: { icon: <Lightbulb size={16} />, cls: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100', t: 'Tip' },
    assume: { icon: <Ruler size={16} />, cls: 'border-ink-200 bg-ink-50 text-ink-800 dark:border-ink-700 dark:bg-ink-800/50 dark:text-ink-200', t: 'Assumptions' },
    exam: { icon: <ListChecks size={16} />, cls: 'border-violet-200 bg-violet-50/70 text-violet-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100', t: 'HSC exam focus' },
  }[kind];
  return (
    <div className={cx('rounded-lg border px-3.5 py-2.5 text-sm', map.cls, className)} role="note">
      <div className="mb-0.5 flex items-center gap-1.5 font-semibold">
        {map.icon}
        {title ?? map.t}
      </div>
      <div className="leading-relaxed [&_li]:ml-4 [&_li]:list-disc">{children}</div>
    </div>
  );
}

/** Prose that disappears in visual-only mode. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('prose-only prose-eng', className)}>{children}</div>;
}

/** Beginner/advanced dual explanation. */
export function Explain({ beginner, advanced }: { beginner: string; advanced?: string }) {
  const { prefs } = usePrefs();
  const text = prefs.mode === 'advanced' && advanced ? advanced : beginner;
  return (
    <p className="prose-only prose-eng">
      <MathText text={text} />
    </p>
  );
}

export function KeyPoints({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cx('space-y-1.5 text-sm', className)}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <MathText text={t} className="text-ink-700 dark:text-ink-300" />
        </li>
      ))}
    </ul>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className, size = 'md' }: {
  tabs: { id: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="tablist" className={cx('flex flex-wrap gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800/70', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'rounded-md font-medium transition',
            size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            value === t.id
              ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
              : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, unit, onChange, format }: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-ink-600 dark:text-ink-300">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-ink-900 dark:text-ink-100">
          {format ? format(value) : value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/**
 * Validated numeric input. Keeps the raw text so users can type freely, reports a parsed number
 * (or null) and shows a red message when the value is invalid or out of range.
 */
export function NumField({ label, value, onChange, unit, min, max, allowZero = true, integer, hint, className }: {
  label: ReactNode;
  value: string;
  onChange: (raw: string) => void;
  unit?: ReactNode;
  min?: number;
  max?: number;
  allowZero?: boolean;
  integer?: boolean;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  const err = numError(value, { min, max, allowZero, integer });
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          id={id}
          inputMode="decimal"
          className={cx('input', err && 'input-error')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!err}
          aria-describedby={err ? id + '-err' : undefined}
        />
        {unit && <span className="shrink-0 text-xs text-ink-500 dark:text-ink-400">{unit}</span>}
      </div>
      {err ? (
        <p id={id + '-err'} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {err}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function numError(raw: string, o: { min?: number; max?: number; allowZero?: boolean; integer?: boolean } = {}): string | null {
  const n = parseNum(raw);
  if (n === null) return raw.trim() === '' ? 'Required' : 'Enter a valid number';
  if (o.integer && !Number.isInteger(n)) return 'Must be a whole number';
  if (o.allowZero === false && n === 0) return 'Cannot be zero';
  if (o.min !== undefined && n < o.min) return `Must be ≥ ${o.min}`;
  if (o.max !== undefined && n > o.max) return `Must be ≤ ${o.max}`;
  return null;
}

export function Select<T extends string>({ label, value, onChange, options, className }: {
  label?: ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <select id={id} className="input pr-8" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700 dark:text-ink-300">
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onChange(!checked))}
        onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 rounded-full transition', checked ? 'bg-emerald-600' : 'bg-ink-300 dark:bg-ink-600')}
      >
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition', checked ? 'left-[18px]' : 'left-0.5')} />
      </span>
      {label}
    </label>
  );
}

export function Collapse({ title, children, defaultOpen = false, className }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cx('rounded-lg border border-ink-200 dark:border-ink-800', className)}>
      <button
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-ink-800 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800/60"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown size={16} className={cx('shrink-0 transition', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-ink-200 px-3 py-3 dark:border-ink-800">{children}</div>}
    </div>
  );
}

/** Result readout tile. */
export function Stat({ label, value, unit, tone = 'ink', sub }: { label: ReactNode; value: ReactNode; unit?: ReactNode; tone?: string; sub?: ReactNode }) {
  const tones: Record<string, string> = {
    ink: 'text-ink-900 dark:text-white',
    emerald: 'text-emerald-700 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-sky-700 dark:text-sky-400',
    amber: 'text-amber-700 dark:text-amber-400',
  };
  return (
    <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-3 py-2 dark:border-ink-800 dark:bg-ink-950/50">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</div>
      <div className={cx('font-mono text-lg font-semibold tabular-nums', tones[tone])}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-ink-500">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-ink-500 dark:text-ink-400">{sub}</div>}
    </div>
  );
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      <div className="mb-1 flex items-center gap-1.5 font-semibold">
        <AlertTriangle size={15} /> Cannot solve
      </div>
      <ul className="ml-4 list-disc space-y-0.5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export function Grid({ children, cols = 2, className }: { children: ReactNode; cols?: 1 | 2 | 3 | 4; className?: string }) {
  const c = { 1: 'grid-cols-1', 2: 'grid-cols-1 lg:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' }[cols];
  return <div className={cx('grid gap-4', c, className)}>{children}</div>;
}

/** A diagram panel with grid background. */
export function Figure({ children, caption, className }: { children: ReactNode; caption?: ReactNode; className?: string }) {
  return (
    <figure className={cx('overflow-hidden rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950', className)}>
      <div className="grid-bg">{children}</div>
      {caption && <figcaption className="border-t border-ink-100 px-3 py-1.5 text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400">{caption}</figcaption>}
    </figure>
  );
}

export function SectionTitle({ children, id, sub }: { children: ReactNode; id?: string; sub?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 first:mt-0" id={id}>
      <h2 className="text-lg font-bold text-ink-900 dark:text-white">{children}</h2>
      {sub && <p className="prose-only text-sm text-ink-500 dark:text-ink-400">{sub}</p>}
    </div>
  );
}
