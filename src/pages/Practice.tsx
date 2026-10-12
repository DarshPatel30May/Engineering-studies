import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, RotateCcw, CheckCircle2, XCircle, ExternalLink, Shuffle } from 'lucide-react';
import { QUESTIONS, type Question, type MCQ, type ShortQ, type CalcQ, type Difficulty } from '@/data/questions';
import { MODULES, MODULE_MAP } from '@/data/modules';
import { EXAM_SPEC } from '@/data/outcomes';
import { useStored, type Attempt } from '@/lib/storage';
import { approxEqual, parseNum, sig } from '@/lib/calc/format';
import { PageHeader, Card, Tabs, Badge, M, Callout, Select, KeyPoints, cx, Stat, MathText } from '@/components/ui';
import QuestionDiagram from '@/components/practice/QuestionDiagram';

type Mode = 'mcq' | 'short' | 'calc' | 'diagram' | 'progress' | 'papers';
type DiffFilter = Difficulty | 'all' | 'adaptive';
const DIFF_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'hsc'];
const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', hsc: 'HSC exam' };

export function useAttempts() {
  return useStored<Attempt[]>('attempts', []);
}

export default function Practice() {
  const [mode, setMode] = useState<Mode>('mcq');
  const [mod, setMod] = useState<string>('all');
  const [diff, setDiff] = useState<DiffFilter>('all');
  const [attempts, setAttempts] = useAttempts();
  const record = (q: Question, score: number, max: number) => setAttempts((a) => [...a, { qid: q.id, module: q.module, topic: q.topic, score, max, at: Date.now() }].slice(-2000));

  // Adaptive: pick difficulty from the last 4 results in this mode
  const adaptiveLevel = useMemo<Difficulty>(() => {
    const recent = attempts.slice(-4);
    if (!recent.length) return 'medium';
    const rate = recent.reduce((s, a) => s + a.score / a.max, 0) / recent.length;
    return rate > 0.85 ? 'hsc' : rate > 0.65 ? 'hard' : rate > 0.4 ? 'medium' : 'easy';
  }, [attempts]);

  const pool = (kind: Question['kind'] | 'diagram') =>
    QUESTIONS.filter((q) => (kind === 'diagram' ? !!q.diagram : q.kind === kind))
      .filter((q) => mod === 'all' || q.module === mod)
      .filter((q) => diff === 'all' || (diff === 'adaptive' ? Math.abs(DIFF_ORDER.indexOf(q.difficulty) - DIFF_ORDER.indexOf(adaptiveLevel)) <= 1 : q.difficulty === diff));

  return (
    <div>
      <PageHeader title="HSC Practice Centre" kicker="Original HSC-style questions with feedback" icon={<GraduationCap className="text-emerald-600" />}>
        Questions are original and written in the style of the HSC examination. Numerical answers are marked deterministically with a tolerance; written answers use transparent, indicative marking criteria for self-assessment — they do not reproduce official NESA marking.
      </PageHeader>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total marks" value={EXAM_SPEC.totalMarks} />
        <Stat label="Working time" value="3 h" sub="plus 5 minutes reading time" />
        <Stat label={EXAM_SPEC.sections[0].name} value={`${EXAM_SPEC.sections[0].marks} marks`} sub={EXAM_SPEC.sections[0].desc} />
        <Stat label={EXAM_SPEC.sections[1].name} value={`${EXAM_SPEC.sections[1].marks} marks`} sub={EXAM_SPEC.sections[1].desc} />
      </div>
      <div className="no-print sticky top-14 z-10 -mx-3 mb-4 flex flex-wrap items-end gap-3 border-b border-ink-200 bg-ink-50/95 px-3 py-2 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Tabs value={mode} onChange={setMode} tabs={[{ id: 'mcq', label: 'Multiple choice' }, { id: 'short', label: 'Short answer' }, { id: 'calc', label: 'Calculations' }, { id: 'diagram', label: 'Diagram interpretation' }, { id: 'progress', label: 'Progress' }, { id: 'papers', label: 'Past papers' }]} />
        {mode !== 'progress' && mode !== 'papers' && (
          <>
            <Select value={mod} onChange={setMod} options={[{ value: 'all', label: 'All modules' }, ...MODULES.map((m) => ({ value: m.id, label: m.name }))]} />
            <Select value={diff} onChange={setDiff} options={[{ value: 'all', label: 'All difficulties' }, ...DIFF_ORDER.map((d) => ({ value: d, label: DIFF_LABEL[d] })), { value: 'adaptive', label: `Adaptive (now: ${DIFF_LABEL[adaptiveLevel]})` }]} />
          </>
        )}
      </div>
      {mode === 'mcq' && <Runner key={`mcq${mod}${diff}`} pool={pool('mcq')} record={record} />}
      {mode === 'short' && <Runner key={`sa${mod}${diff}`} pool={pool('short')} record={record} />}
      {mode === 'calc' && <Runner key={`c${mod}${diff}`} pool={pool('calc')} record={record} />}
      {mode === 'diagram' && <Runner key={`d${mod}${diff}`} pool={pool('diagram')} record={record} />}
      {mode === 'progress' && <ProgressView attempts={attempts} reset={() => setAttempts([])} />}
      {mode === 'papers' && <Papers />}
    </div>
  );
}

function Runner({ pool, record }: { pool: Question[]; record: (q: Question, s: number, m: number) => void }) {
  const [order, setOrder] = useState(() => pool.map((_, i) => i));
  const [i, setI] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  if (!pool.length) return <Callout kind="info">No questions match these filters — try another module or difficulty.</Callout>;
  const q = pool[order[i % order.length]];
  const next = () => (setI((x) => x + 1), setAttemptKey((k) => k + 1));
  const shuffle = () => {
    const o = pool.map((_, k) => k);
    for (let k = o.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [o[k], o[j]] = [o[j], o[k]];
    }
    setOrder(o);
    setI(0);
    setAttemptKey((k) => k + 1);
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-500">Question {(i % pool.length) + 1} of {pool.length}</span>
        <Badge tone={q.module}>{MODULE_MAP[q.module].name}</Badge>
        <Badge>{q.topic}</Badge>
        <Badge tone={q.difficulty === 'hsc' ? 'violet' : q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'amber' : 'emerald'}>{DIFF_LABEL[q.difficulty]}</Badge>
        {q.kind !== 'mcq' && <Badge tone="blue">{(q as ShortQ | CalcQ).marks} mark{(q as ShortQ | CalcQ).marks > 1 ? 's' : ''}</Badge>}
        <button className="btn btn-ghost ml-auto text-xs" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
      </div>
      {q.kind === 'mcq' && <MCQView key={attemptKey} q={q} record={record} next={next} retry={() => setAttemptKey((k) => k + 1)} />}
      {q.kind === 'short' && <ShortView key={attemptKey} q={q} record={record} next={next} retry={() => setAttemptKey((k) => k + 1)} />}
      {q.kind === 'calc' && <CalcView key={attemptKey} q={q} record={record} next={next} retry={() => setAttemptKey((k) => k + 1)} />}
    </div>
  );
}

interface ViewProps<T> {
  q: T;
  record: (q: Question, s: number, m: number) => void;
  next: () => void;
  retry: () => void;
}

function MCQView({ q, record, next, retry }: ViewProps<MCQ>) {
  const [pick, setPick] = useState<number | null>(null);
  const done = pick !== null;
  return (
    <Card>
      {q.diagram && <div className="mb-3"><QuestionDiagram k={q.diagram} /></div>}
      <p className="mb-3 font-medium"><MathText text={q.stem} /></p>
      <div className="space-y-2">
        {q.options.map((o, k) => {
          const correct = k === q.answer;
          return (
            <button
              key={k}
              disabled={done}
              onClick={() => (setPick(k), record(q, k === q.answer ? 1 : 0, 1))}
              className={cx('w-full rounded-lg border px-3 py-2 text-left text-sm transition', !done && 'border-ink-200 hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-ink-700 dark:hover:bg-emerald-950/20', done && correct && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40', done && !correct && k === pick && 'border-red-500 bg-red-50 dark:bg-red-950/40', done && !correct && k !== pick && 'border-ink-200 opacity-80 dark:border-ink-800')}
            >
              <div className="flex gap-2">
                <span className="font-mono font-bold">{String.fromCharCode(65 + k)}</span>
                <span className="flex-1"><MathText text={o.text} /></span>
                {done && correct && <CheckCircle2 size={17} className="text-emerald-600" />}
                {done && k === pick && !correct && <XCircle size={17} className="text-red-500" />}
              </div>
              {done && <p className={cx('mt-1 pl-6 text-xs', correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink-600 dark:text-ink-400')}><MathText text={o.why} /></p>}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="mt-3 flex gap-2">
          <Badge tone={pick === q.answer ? 'emerald' : 'red'}>{pick === q.answer ? 'Correct — 1/1' : 'Incorrect — 0/1'}</Badge>
          <button className="btn text-xs" onClick={retry}><RotateCcw size={13} /> Try again</button>
          <button className="btn btn-primary text-xs" onClick={next}>Next question →</button>
        </div>
      )}
    </Card>
  );
}

function ShortView({ q, record, next, retry }: ViewProps<ShortQ>) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>(q.features.map(() => false));
  const [saved, setSaved] = useState(false);
  const termHits = q.features.map((f) => {
    const words = f.toLowerCase().replace(/[()/,.:;'’]/g, ' ').split(/\s+/).filter((w) => w.length > 5);
    return words.length ? words.filter((w) => text.toLowerCase().includes(w.slice(0, Math.max(5, w.length - 2)))).length / words.length : 0;
  });
  const fraction = ticks.filter(Boolean).length / q.features.length;
  const indicative = Math.round(fraction * q.marks * 2) / 2;
  return (
    <Card>
      {q.diagram && <div className="mb-3"><QuestionDiagram k={q.diagram} /></div>}
      <p className="mb-2 font-medium"><MathText text={q.stem} /> <span className="text-ink-500">({q.marks} marks)</span></p>
      <textarea className="input min-h-[150px] font-sans" value={text} onChange={(e) => setText(e.target.value)} disabled={submitted} placeholder="Write your answer as you would in the exam. Use engineering terminology and link causes to effects." aria-label="Your answer" />
      <div className="mt-1 text-xs text-ink-500">{text.trim() ? text.trim().split(/\s+/).length : 0} words · aim for about {q.marks * 25}–{q.marks * 40} words</div>
      {!submitted ? (
        <button className="btn btn-primary mt-3" onClick={() => setSubmitted(true)} disabled={!text.trim()}>Submit and see marking criteria</button>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-1 text-sm font-semibold">Indicative marking criteria</h4>
              <table className="tbl">
                <tbody>
                  {q.criteria.map((c) => <tr key={c.marks}><td className="w-16 font-mono font-semibold">{c.marks}</td><td><MathText text={c.text} /></td></tr>)}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold">Self-assessment: tick the features your answer includes</h4>
              <ul className="space-y-1">
                {q.features.map((f, k) => (
                  <li key={k}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-1 accent-emerald-600" checked={ticks[k]} onChange={() => setTicks((t) => t.map((x, j) => (j === k ? !x : x)))} />
                      <span>
                        {f}
                        {termHits[k] < 0.34 && <span className="ml-1 text-[11px] text-amber-700 dark:text-amber-400">(key terminology not detected — check)</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="blue">Indicative mark: {indicative} / {q.marks}</Badge>
                <button className="btn text-xs" disabled={saved} onClick={() => (record(q, indicative, q.marks), setSaved(true))}>{saved ? 'Saved to progress' : 'Save result to progress'}</button>
              </div>
              <p className="mt-1 text-[11px] text-ink-500">The terminology hint is a simple word match to prompt your review — it is not how NESA markers assess responses. Judge your answer against the criteria and the sample.</p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="mb-1 font-semibold">Sample high-band response</div>
            <p><MathText text={q.sample} /></p>
          </div>
          <div className="flex gap-2">
            <button className="btn text-xs" onClick={retry}><RotateCcw size={13} /> Try again</button>
            <button className="btn btn-primary text-xs" onClick={next}>Next question →</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function CalcView({ q, record, next, retry }: ViewProps<CalcQ>) {
  const [vals, setVals] = useState<string[]>(q.parts.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [showWork, setShowWork] = useState(false);
  const results = q.parts.map((p, k) => {
    const n = parseNum(vals[k]);
    if (n === null) return { ok: false, msg: 'No valid number entered.' };
    const tol = p.tol ?? 0.01;
    if (approxEqual(n, p.answer, tol, 1e-9)) return { ok: true, msg: 'Correct.' };
    const trap = p.traps?.find((t) => approxEqual(n, t.value, 0.01));
    if (trap) return { ok: false, msg: trap.msg };
    if (approxEqual(n, -p.answer, tol)) return { ok: false, msg: 'Magnitude correct but the sign is wrong — check your sign convention (tension +, compression −) or direction.' };
    for (const f of [1000, 1e6, 0.001, 1e-6]) if (approxEqual(n, p.answer * f, tol)) return { ok: false, msg: `Off by a factor of ${f >= 1 ? f : `1/${1 / f}`} — check your unit conversions (k = 10³, M = 10⁶, mm² vs m²).` };
    if (approxEqual(n, p.answer, 0.05)) return { ok: false, msg: 'Close — check rounding: keep full precision until the final answer.' };
    return { ok: false, msg: 'Not correct — compare your method with the working.' };
  });
  const score = (results.filter((r) => r.ok).length / q.parts.length) * q.marks;
  return (
    <Card>
      {q.diagram && <div className="mb-3"><QuestionDiagram k={q.diagram} /></div>}
      <p className="mb-3 font-medium"><MathText text={q.stem} /> <span className="text-ink-500">({q.marks} marks)</span></p>
      <div className="space-y-2">
        {q.parts.map((p, k) => (
          <div key={k} className="flex flex-wrap items-center gap-2">
            <span className="w-6 font-mono text-sm font-bold">({String.fromCharCode(97 + k)})</span>
            <label className="min-w-[200px] flex-1 text-sm" htmlFor={`${q.id}-${k}`}><MathText text={p.label} /></label>
            <input id={`${q.id}-${k}`} className="input w-36" inputMode="decimal" value={vals[k]} onChange={(e) => (setChecked(false), setVals((v) => v.map((x, j) => (j === k ? e.target.value : x))))} />
            <span className="w-14 text-sm text-ink-500">{p.unit}</span>
            {checked && (results[k].ok ? <CheckCircle2 size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-red-500" />)}
            {checked && !results[k].ok && <p className="w-full pl-8 text-xs text-red-700 dark:text-red-400"><MathText text={results[k].msg} /></p>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={() => { setChecked(true); record(q, score, q.marks); }}>Check answers</button>
        <button className="btn" onClick={() => setShowWork((s) => !s)}>{showWork ? 'Hide' : 'Show'} full working</button>
        {checked && <Badge tone={score === q.marks ? 'emerald' : 'amber'}>{sig(score, 3)} / {q.marks} marks</Badge>}
        {checked && <button className="btn text-xs" onClick={retry}><RotateCcw size={13} /> Try again</button>}
        <button className="btn text-xs" onClick={next}>Next →</button>
      </div>
      {showWork && (
        <div className="mt-4 space-y-3 rounded-lg border border-ink-200 p-3 dark:border-ink-700">
          {q.parts.map((p, k) => (
            <div key={k}>
              <div className="text-sm font-semibold">({String.fromCharCode(97 + k)}) {p.label}: {sig(p.answer, 4)} {p.unit}</div>
              {p.working.map((w, j) => <M key={j} block>{w}</M>)}
            </div>
          ))}
          <Callout kind="exam">Marks are typically awarded for the correct formula, correct substitution with units, and the correct answer with units. Show every step — method marks can still be earned if the final answer is wrong.</Callout>
        </div>
      )}
      <p className="mt-2 text-[11px] text-ink-500">Marked automatically within ±{Math.round((q.parts[0].tol ?? 0.01) * 100)}% to allow for rounding.</p>
    </Card>
  );
}

function ProgressView({ attempts, reset }: { attempts: Attempt[]; reset: () => void }) {
  const byModule = MODULES.map((m) => {
    const a = attempts.filter((x) => x.module === m.id);
    const s = a.reduce((t, x) => t + x.score, 0);
    const mx = a.reduce((t, x) => t + x.max, 0);
    return { m, n: a.length, pct: mx ? Math.round((s / mx) * 100) : null };
  });
  const topics = new Map<string, { module: string; s: number; mx: number; n: number }>();
  for (const a of attempts) {
    const k = `${a.module}|${a.topic}`;
    const t = topics.get(k) ?? { module: a.module, s: 0, mx: 0, n: 0 };
    t.s += a.score;
    t.mx += a.max;
    t.n += 1;
    topics.set(k, t);
  }
  const rows = Array.from(topics.entries()).map(([k, v]) => ({ topic: k.split('|')[1], ...v, pct: Math.round((v.s / v.mx) * 100) })).sort((a, b) => a.pct - b.pct);
  const weak = rows.filter((r) => r.n >= 1 && r.pct < 70).slice(0, 6);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {byModule.map(({ m, n, pct }) => (
          <Card key={m.id} title={m.name} subtitle={`${n} attempts`}>
            <div className="text-3xl font-bold tabular-nums">{pct === null ? '—' : `${pct}%`}</div>
            <div className="mt-2 h-2 rounded-full bg-ink-100 dark:bg-ink-800"><div className={cx('h-2 rounded-full', { civil: 'bg-civil', transport: 'bg-transport', aero: 'bg-aero', telecom: 'bg-telecom' }[m.id])} style={{ width: `${pct ?? 0}%` }} /></div>
          </Card>
        ))}
      </div>
      <Card title="Weaker areas" subtitle="Topics below 70% from your completed responses">
        {attempts.length === 0 ? (
          <p className="text-sm text-ink-500">No attempts yet — answer some questions and your analysis will appear here.</p>
        ) : weak.length === 0 ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">No weak topics detected so far. Try harder difficulty levels.</p>
        ) : (
          <KeyPoints items={weak.map((w) => `${MODULE_MAP[w.module as keyof typeof MODULE_MAP].short} · ${w.topic}: ${w.pct}% over ${w.n} attempt${w.n > 1 ? 's' : ''} — revise this topic and retry.`)} />
        )}
      </Card>
      <Card title="All topics">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Module</th><th>Topic</th><th>Attempts</th><th>Score</th></tr></thead>
            <tbody>
              {rows.map((r) => <tr key={r.module + r.topic}><td><Badge tone={r.module}>{MODULE_MAP[r.module as keyof typeof MODULE_MAP].short}</Badge></td><td>{r.topic}</td><td>{r.n}</td><td className={cx('font-mono', r.pct < 50 ? 'text-red-600' : r.pct < 70 ? 'text-amber-600' : 'text-emerald-600')}>{r.pct}%</td></tr>)}
            </tbody>
          </table>
        </div>
        <button className="btn mt-3 text-xs" onClick={() => confirm('Delete all practice history on this device?') && reset()}><RotateCcw size={13} /> Reset practice history</button>
      </Card>
    </div>
  );
}

function Papers() {
  return (
    <Card title="Official NESA past papers and marking guidelines">
      <p className="text-sm">Practise under exam conditions with official papers. NESA publishes each year’s Engineering Studies examination, marking guidelines, sample answers and notes from the marking centre.</p>
      <a className="btn btn-primary mt-3" href="https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/engineering-studies" target="_blank" rel="noreferrer">
        NESA Engineering Studies HSC exam papers <ExternalLink size={14} />
      </a>
      <KeyPoints className="mt-4" items={['Use the formulae sheet printed in the paper while practising.', 'Mark your answers with the official marking guidelines, then read the markers’ notes for common errors.', 'Time yourself: roughly 1.8 minutes per mark (180 minutes ÷ 100 marks).']} />
      <p className="mt-3 text-xs text-ink-500">This site does not reproduce copyrighted past-paper questions. Questions in this Practice Centre are original. <Link to="/solver" className="underline">Try the step-by-step solver</Link> for guided calculation practice.</p>
    </Card>
  );
}
