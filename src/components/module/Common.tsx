import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, CheckCircle2, Circle, ExternalLink, Printer, Target, Wrench, Lightbulb, ListTree } from 'lucide-react';
import type { ModuleData } from '@/data/types';
import { OUTCOMES, SYLLABUS_NOTE } from '@/data/outcomes';
import { FORMULA_MAP } from '@/data/formulas';
import { useStored } from '@/lib/storage';
import { usePrefs } from '@/lib/prefs';
import { Badge, Card, Callout, M, MathText, KeyPoints, cx, accentText, Grid } from '../ui';

export function useSyllabusProgress() {
  return useStored<Record<string, boolean>>('syllabus', {});
}
export function useBookmarks() {
  return useStored<string[]>('bookmarks', []);
}

export function moduleProgress(m: ModuleData, done: Record<string, boolean>) {
  const ids = m.syllabus.flatMap((g) => [...g.learnAbout, ...g.learnTo].map((d) => d.id));
  const n = ids.filter((i) => done[i]).length;
  return { n, total: ids.length, pct: ids.length ? Math.round((n / ids.length) * 100) : 0 };
}

export function OverviewTab({ m, features }: { m: ModuleData; features: { label: string; to: string }[] }) {
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Card title="Module summary" icon={<ListTree size={18} />}>
          <div className="prose-eng space-y-2">
            {m.summary.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
          </div>
        </Card>
        <Card title="What engineers do in this field" icon={<Wrench size={18} />}>
          <KeyPoints items={m.engineersDo} />
        </Card>
        <Card title="Main syllabus categories" icon={<Target size={18} />}>
          <ol className="space-y-1.5 text-sm">
            {m.categories.map((c, i) => (
              <li key={c} className="flex gap-2">
                <span className={cx('font-mono text-xs font-bold', accentText(m.accent))}>{String.fromCharCode(65 + i)}</span>
                {c}
              </li>
            ))}
          </ol>
          {m.id === 'telecom' && <p className="mt-2 text-xs text-ink-500">Telecommunications has no separate engineering-mechanics category in the syllabus; its technical core is electricity/electronics.</p>}
        </Card>
        <Card title="What you need to understand" icon={<Lightbulb size={18} />}>
          <KeyPoints items={m.needToUnderstand} />
        </Card>
      </Grid>
      <Card title="Interactive tools for this module" subtitle="Every tool below is fully functional">
        <div className="flex flex-wrap gap-2">
          {features.map((f) => (
            <Link key={f.to + f.label} to={f.to} className="btn text-xs">
              {f.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SyllabusTab({ m }: { m: ModuleData }) {
  const [done, setDone] = useSyllabusProgress();
  const p = moduleProgress(m, done);
  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));
  return (
    <div className="space-y-4">
      <Callout kind="info" title="About these dot points">
        {SYLLABUS_NOTE}{' '}
        <a className="underline" href="https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011" target="_blank" rel="noreferrer">
          NESA Engineering Studies Stage 6 Syllabus (2011) <ExternalLink size={12} className="inline" />
        </a>
      </Callout>
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold">Your progress</div>
          <div className="h-2.5 min-w-[140px] flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${p.pct}%` }} />
          </div>
          <div className="font-mono text-sm tabular-nums">
            {p.n}/{p.total} ({p.pct}%)
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-500">Tick a dot point when you can explain it without notes. Saved in this browser.</p>
      </Card>
      {m.syllabus.map((g) => (
        <Card key={g.id} title={g.heading}>
          <div className="grid gap-4 lg:grid-cols-2">
            {(['learnAbout', 'learnTo'] as const).map((k) => (
              <div key={k}>
                <div className={cx('mb-2 text-xs font-semibold uppercase tracking-wide', accentText(m.accent))}>{k === 'learnAbout' ? 'Students learn about' : 'Students learn to'}</div>
                <ul className="space-y-1.5">
                  {g[k].map((d) => (
                    <li key={d.id} className="flex items-start gap-2">
                      <button onClick={() => toggle(d.id)} aria-label={`${done[d.id] ? 'Untick' : 'Tick'}: ${d.text}`} className="mt-0.5 shrink-0 text-emerald-600">
                        {done[d.id] ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-ink-300 dark:text-ink-600" />}
                      </button>
                      <div className="min-w-0 text-sm">
                        <span className={cx(done[d.id] && 'text-ink-500 line-through decoration-emerald-500/50')}>{d.text}</span>
                        {d.sub && (
                          <ul className="ml-4 mt-0.5 list-[circle] text-xs text-ink-600 dark:text-ink-400">
                            {d.sub.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        )}
                        {d.note && <div className="mt-0.5 text-xs italic text-amber-700 dark:text-amber-400">{d.note}</div>}
                        {d.link && (
                          <Link to={d.link} className="mt-0.5 inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                            Study this →
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Card title="HSC outcomes addressed by this module">
        <div className="overflow-x-auto">
          <table className="tbl">
            <tbody>
              {m.outcomes.map((o) => (
                <tr key={o}>
                  <td className="w-16 font-mono font-semibold">{o}</td>
                  <td>A student {OUTCOMES[o]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function ConceptsTab({ m }: { m: ModuleData }) {
  const [filter, setFilter] = useState<string>('all');
  const [bm, setBm] = useBookmarks();
  const { prefs } = usePrefs();
  const tabs = Array.from(new Set(m.concepts.map((c) => c.tab)));
  const shown = m.concepts.filter((c) => filter === 'all' || c.tab === filter || (filter === 'saved' && bm.includes(`${m.id}:${c.id}`)));
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {['all', ...tabs, 'saved'].map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={cx('chip capitalize', filter === t ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'border-ink-200 dark:border-ink-700')}>
            {t === 'saved' ? '★ Bookmarked' : t}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-500">Showing {prefs.mode} explanations — switch in the top bar.</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((c) => {
          const key = `${m.id}:${c.id}`;
          const saved = bm.includes(key);
          return (
            <article key={c.id} id={c.id} className="card card-pad scroll-mt-32">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink-900 dark:text-white">{c.term}</h3>
                <button onClick={() => setBm((b) => (saved ? b.filter((x) => x !== key) : [...b, key]))} aria-label={saved ? 'Remove bookmark' : 'Bookmark'} className="text-amber-500">
                  {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} className="text-ink-300" />}
                </button>
              </div>
              <p className="mb-2 rounded-md bg-ink-50 px-2 py-1.5 text-sm font-medium text-ink-800 dark:bg-ink-950/60 dark:text-ink-200">
                <MathText text={c.def} />
              </p>
              <p className="prose-only text-sm text-ink-600 dark:text-ink-300">
                <MathText text={prefs.mode === 'advanced' && c.advanced ? c.advanced : c.beginner} />
              </p>
              {c.example && (
                <p className="prose-only mt-2 text-xs text-ink-500">
                  <span className="font-semibold">Example: </span>
                  <MathText text={c.example} />
                </p>
              )}
              <Badge className="mt-2 capitalize">{c.tab}</Badge>
            </article>
          );
        })}
      </div>
      {shown.length === 0 && <p className="text-sm text-ink-500">No concepts here yet — bookmark concepts with the ☆ icon.</p>}
    </div>
  );
}

export function Timeline({ events, accent }: { events: ModuleData['timeline']; accent: string }) {
  const tags = Array.from(new Set(events.map((e) => e.tag)));
  const [tag, setTag] = useState<string | null>(null);
  const shown = events.filter((e) => !tag || e.tag === tag);
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button className={cx('chip', !tag ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'border-ink-200 dark:border-ink-700')} onClick={() => setTag(null)}>
          All
        </button>
        {tags.map((t) => (
          <button key={t} className={cx('chip', tag === t ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'border-ink-200 dark:border-ink-700')} onClick={() => setTag(t)}>
            {t}
          </button>
        ))}
      </div>
      <ol className="relative ml-3 border-l-2 border-ink-200 dark:border-ink-700">
        {shown.map((e) => (
          <li key={e.year + e.title} className="mb-5 ml-5">
            <span className={cx('absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full ring-4 ring-ink-50 dark:ring-ink-950', { civil: 'bg-civil', transport: 'bg-transport', aero: 'bg-aero', telecom: 'bg-telecom' }[accent])} />
            <div className="flex flex-wrap items-baseline gap-2">
              <span className={cx('font-mono text-sm font-bold', accentText(accent))}>{e.year}</span>
              <h4 className="font-semibold text-ink-900 dark:text-white">{e.title}</h4>
              <Badge>{e.tag}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">{e.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HistoryTab({ m, extra }: { m: ModuleData; extra?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {extra}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card title="Historical timeline" subtitle="Filter by theme">
          <Timeline events={m.timeline} accent={m.accent} />
        </Card>
        <div className="space-y-4">
          {m.societal.map((s) => (
            <Card key={s.heading} title={s.heading}>
              <KeyPoints items={s.points} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RevisionTab({ m }: { m: ModuleData }) {
  const defs = useMemo(() => m.concepts.slice(0, 18), [m]);
  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end gap-2">
        <Link to={`/revision-sheets?m=${m.id}`} className="btn">
          <Printer size={15} /> Printable revision sheet
        </Link>
      </div>
      <Card title="30-second summary" className="border-l-4 border-l-emerald-500">
        <p className="prose-eng"><MathText text={m.revision.thirtySecond} /></p>
      </Card>
      <Grid cols={2}>
        <Card title="Top takeaways">
          <ol className="space-y-1.5 text-sm">
            {m.revision.takeaways.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className={cx('font-mono text-xs font-bold', accentText(m.accent))}>{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Important formulas" subtitle={<Link to="/formulas" className="text-emerald-700 hover:underline dark:text-emerald-400">Open the Formula Centre →</Link>}>
          <ul className="space-y-1">
            {m.revision.formulas.map((id) => {
              const f = FORMULA_MAP[id];
              if (!f) return null;
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 py-1 dark:border-ink-800">
                  <span className="text-xs text-ink-500">{f.name}</span>
                  <M>{f.latex}</M>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Essential diagrams">
          <div className="flex flex-wrap gap-2">
            {m.revision.diagrams.map((d) => (
              <Link key={d.to} to={d.to} className="btn text-xs">
                {d.label}
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Common misconceptions">
          <ul className="space-y-2 text-sm">
            {m.revision.misconceptions.map((x) => (
              <li key={x.wrong} className="rounded-lg border border-ink-100 p-2 dark:border-ink-800">
                <div className="text-red-700 dark:text-red-400">✗ <MathText text={x.wrong} /></div>
                <div className="text-emerald-700 dark:text-emerald-400">✓ <MathText text={x.right} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </Grid>
      <Card title="Exam-ready definitions">
        <dl className="grid gap-x-6 gap-y-2 md:grid-cols-2">
          {defs.map((c) => (
            <div key={c.id} className="border-b border-ink-100 pb-2 text-sm dark:border-ink-800">
              <dt className="font-semibold">{c.term}</dt>
              <dd className="text-ink-600 dark:text-ink-300">
                <MathText text={c.def} />
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

export function ScopeTab({ items }: { items: { title: string; points: string[] }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((s) => (
        <Card key={s.title} title={s.title}>
          <KeyPoints items={s.points} />
        </Card>
      ))}
    </div>
  );
}

/** A titled sub-section with anchor for deep links. */
export function Sec({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 space-y-4 pt-2">
      <div>
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">{title}</h2>
        {sub && <p className="prose-only text-sm text-ink-500 dark:text-ink-400">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

export function ReportReminder({ module }: { module: string }) {
  return (
    <Callout kind="exam" title="Engineering Report">
      In the HSC course you complete one Engineering Report from an application module (Civil Structures or Personal and Public Transport) and one from a focus module (Aeronautical or Telecommunications Engineering). {module} can be the basis of one of these reports.{' '}
      <Link to="/reports" className="font-semibold underline">
        Open the Engineering Report guide →
      </Link>
    </Callout>
  );
}
