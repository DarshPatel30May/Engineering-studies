import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, CheckCircle2, XCircle, Lightbulb, RefreshCw, Eye } from 'lucide-react';
import { TEMPLATES, type Problem, type ProblemDiagram, type Step } from '@/data/problems';
import { MODULE_MAP } from '@/data/modules';
import { approxEqual, parseNum, sig } from '@/lib/calc/format';
import { PageHeader, Card, Badge, M, cx, MathText } from '@/components/ui';
import { Arrow, PinSupport, RollerSupport, Label, COL, DimH, Hatch } from '@/components/diagrams/svg';

export default function Solver() {
  const [params, setParams] = useSearchParams();
  const tid = params.get('t') ?? 'beam';
  const seed = Number(params.get('s') ?? 0);
  const tpl = TEMPLATES.find((t) => t.id === tid) ?? TEMPLATES[0];
  const problem = useMemo(() => tpl.generate(seed), [tpl, seed]);
  return (
    <div>
      <PageHeader title="Step-by-step Problem Solver" kicker="Guided calculations with instant feedback" icon={<Calculator className="text-emerald-600" />}>
        Work through each step yourself. Enter an answer to unlock the next step — feedback explains common mathematical and conceptual errors. Every problem is generated and solved by deterministic algorithms (no AI service).
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <nav className="space-y-1" aria-label="Problem types">
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => setParams({ t: t.id, s: '0' })} className={cx('flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm', t.id === tpl.id ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'hover:bg-ink-100 dark:hover:bg-ink-800')}>
              <span>{t.title}</span>
              <Badge tone={t.module}>{MODULE_MAP[t.module].short}</Badge>
            </button>
          ))}
        </nav>
        <ProblemRunner key={`${tpl.id}-${seed}`} problem={problem} title={tpl.title} onNew={() => setParams({ t: tpl.id, s: String(seed + 1) })} isExample={seed === 0} />
      </div>
    </div>
  );
}

function ProblemRunner({ problem, title, onNew, isExample }: { problem: Problem; title: string; onNew: () => void; isExample: boolean }) {
  const [current, setCurrent] = useState(0);
  const done = current >= problem.steps.length;
  return (
    <div className="space-y-4">
      <Card title={title} subtitle={isExample ? 'Worked example' : 'New numbers generated'} actions={<button className="btn text-xs" onClick={onNew}><RefreshCw size={13} /> New numbers</button>}>
        <p className="prose-eng">{problem.statement}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {problem.given.map((g) => (
            <span key={g.label} className="rounded-lg border border-ink-200 bg-ink-50 px-2 py-1 text-xs dark:border-ink-700 dark:bg-ink-950/50"><span className="text-ink-500">{g.label}:</span> <strong>{g.value}</strong></span>
          ))}
        </div>
        {problem.diagram && <div className="mt-3"><SolverDiagram d={problem.diagram} showReactions={done} /></div>}
      </Card>
      <ol className="space-y-3">
        {problem.steps.map((s, i) => (
          <li key={i}>
            {i < current ? <StepDone step={s} /> : i === current ? <StepActive step={s} onPass={() => setCurrent(i + 1)} /> : <div className="rounded-xl border border-dashed border-ink-200 px-4 py-3 text-sm text-ink-400 dark:border-ink-800">Step {i + 1} — locked until the previous step is complete</div>}
          </li>
        ))}
      </ol>
      {done && (
        <Card className="border-l-4 border-l-emerald-500" title="Final answer">
          <p className="prose-eng"><MathText text={problem.final} /></p>
          <button className="btn btn-primary mt-3" onClick={onNew}><RefreshCw size={14} /> Try a new version</button>
        </Card>
      )}
    </div>
  );
}

function StepDone({ step }: { step: Step }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/20">
      <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-emerald-600" /> <MathText text={step.prompt} /></div>
      <div className="mt-1 pl-6">{step.solution.map((l, i) => <M key={i} block>{l}</M>)}</div>
    </div>
  );
}

function StepActive({ step, onPass }: { step: Step; onPass: () => void }) {
  const [val, setVal] = useState('');
  const [fb, setFb] = useState<{ ok: boolean; msg: string } | null>(null);
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState(false);
  const [reveal, setReveal] = useState(false);
  const checkNumber = () => {
    if (step.kind !== 'number') return;
    const n = parseNum(val);
    setTries((t) => t + 1);
    if (n === null) return setFb({ ok: false, msg: 'Enter a number (digits only — the unit is shown beside the box).' });
    const tol = step.tol ?? 0.01;
    const ok = step.answer === 0 ? Math.abs(n) < 1e-6 + (tol || 0) : tol === 0 ? n === step.answer : approxEqual(n, step.answer, tol);
    if (ok) return setFb({ ok: true, msg: 'Correct!' });
    const trap = step.traps?.find((t) => approxEqual(n, t.value, 0.011));
    if (trap) return setFb({ ok: false, msg: trap.msg });
    if (step.answer !== 0 && approxEqual(n, -step.answer, 0.011)) return setFb({ ok: false, msg: 'Right size, wrong sign — check your sign convention.' });
    for (const f of [1000, 0.001, 1e6, 1e-6]) if (step.answer !== 0 && approxEqual(n, step.answer * f, 0.011)) return setFb({ ok: false, msg: 'Out by a power of ten — check unit prefixes (k, M) and mm vs m.' });
    if (step.answer !== 0 && approxEqual(n, step.answer, 0.05)) return setFb({ ok: false, msg: 'Very close — avoid rounding intermediate values too early.' });
    setFb({ ok: false, msg: 'Not quite. Re-check your method — use the hint if you are stuck.' });
  };
  return (
    <div className="rounded-xl border-2 border-emerald-400 bg-white px-4 py-3 shadow-sm dark:border-emerald-700 dark:bg-ink-900">
      <div className="font-medium"><MathText text={step.prompt} /></div>
      {step.kind === 'number' ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input className="input w-40" inputMode="decimal" value={val} onChange={(e) => (setVal(e.target.value), setFb(null))} onKeyDown={(e) => e.key === 'Enter' && checkNumber()} aria-label="Your answer" autoFocus />
          {step.unit && <span className="text-sm text-ink-500">{step.unit}</span>}
          <button className="btn btn-primary" onClick={checkNumber}>Check</button>
          <button className="btn btn-ghost text-xs" onClick={() => setHint(true)}><Lightbulb size={14} /> Hint</button>
          {tries >= 2 && !fb?.ok && <button className="btn btn-ghost text-xs" onClick={() => setReveal(true)}><Eye size={14} /> Show solution</button>}
        </div>
      ) : (
        <div className="mt-2 space-y-1.5">
          {step.options.map((o, k) => (
            <button key={k} className={cx('w-full rounded-lg border px-3 py-2 text-left text-sm', fb && k === step.answer && fb.ok ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-ink-200 hover:border-emerald-400 dark:border-ink-700')} onClick={() => setFb({ ok: k === step.answer, msg: o.feedback })}>
              <MathText text={o.text} />
            </button>
          ))}
        </div>
      )}
      {hint && step.kind === 'number' && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">💡 <MathText text={step.hint} /></p>}
      {fb && (
        <div className={cx('mt-2 flex items-start gap-2 rounded-lg px-3 py-2 text-sm', fb.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200')}>
          {fb.ok ? <CheckCircle2 size={16} className="mt-0.5" /> : <XCircle size={16} className="mt-0.5" />}
          <span><MathText text={fb.msg} /></span>
        </div>
      )}
      {(fb?.ok || reveal) && (
        <div className="mt-2">
          {step.solution.map((l, i) => <M key={i} block>{l}</M>)}
          {reveal && step.kind === 'number' && <p className="text-xs text-ink-500">Answer: {sig(step.answer, 4)} {step.unit}</p>}
          <button className="btn btn-primary mt-2" onClick={onPass}>Next step →</button>
        </div>
      )}
    </div>
  );
}

function SolverDiagram({ d, showReactions }: { d: ProblemDiagram; showReactions: boolean }) {
  const frame = (children: React.ReactNode, w = 560, h = 210) => (
    <svg viewBox={`0 0 ${w} ${h}`} className="diagram mx-auto max-w-2xl rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950" role="img" aria-label="Problem diagram">{children}</svg>
  );
  switch (d.type) {
    case 'beam': {
      const sx = (x: number) => 60 + (x / d.L) * 440;
      return frame(
        <>
          <rect x={60} y={80} width={440} height={10} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={1.6} />
          <PinSupport x={60} y={90} label="A" />
          <RollerSupport x={500} y={90} label="B" />
          <Arrow x1={sx(d.a)} y1={20} x2={sx(d.a)} y2={78} color={COL.load} w={2.6} />
          <Label x={sx(d.a)} y={15} color={COL.load} weight={700}>{d.P} kN</Label>
          {showReactions && d.RA !== undefined && <><Arrow x1={84} y1={150} x2={84} y2={96} color={COL.reaction} w={2.4} /><Label x={90} y={146} anchor="start" color={COL.reaction} weight={700} bg>R<tspan baselineShift="sub" fontSize={10}>A</tspan> = {sig(d.RA, 4)} kN</Label></>}
          {showReactions && d.RB !== undefined && <><Arrow x1={476} y1={150} x2={476} y2={96} color={COL.reaction} w={2.4} /><Label x={470} y={146} anchor="end" color={COL.reaction} weight={700} bg>R<tspan baselineShift="sub" fontSize={10}>B</tspan> = {sig(d.RB, 4)} kN</Label></>}
          <DimH x1={sx(0)} x2={sx(d.a)} y={185} label={`${d.a} m`} ext={10} />
          <DimH x1={sx(d.a)} x2={sx(d.L)} y={185} label={`${d.L - d.a} m`} ext={10} />
        </>,
      );
    }
    case 'truss': {
      const s = 380 / d.span;
      const X = (x: number) => 90 + x * s;
      const Y = (y: number) => 170 - y * Math.min(s, 120 / d.h);
      return frame(
        <>
          <line x1={X(0)} y1={Y(0)} x2={X(d.span)} y2={Y(0)} stroke={COL.ink} strokeWidth={3} />
          <line x1={X(0)} y1={Y(0)} x2={X(d.span / 2)} y2={Y(d.h)} stroke={COL.ink} strokeWidth={3} />
          <line x1={X(d.span)} y1={Y(0)} x2={X(d.span / 2)} y2={Y(d.h)} stroke={COL.ink} strokeWidth={3} />
          <PinSupport x={X(0)} y={Y(0) + 5} s={10} />
          <RollerSupport x={X(d.span)} y={Y(0) + 5} s={10} />
          <Arrow x1={X(d.span / 2)} y1={Y(d.h) - 40} x2={X(d.span / 2)} y2={Y(d.h) - 6} color={COL.load} w={2.4} />
          <Label x={X(d.span / 2) + 8} y={Y(d.h) - 24} anchor="start" color={COL.load} weight={700}>{d.P} kN</Label>
          <text x={X(0) - 16} y={Y(0) - 6} fontSize={13} fontWeight={700} fill={COL.ink}>A</text>
          <text x={X(d.span) + 8} y={Y(0) - 6} fontSize={13} fontWeight={700} fill={COL.ink}>B</text>
          <text x={X(d.span / 2) - 22} y={Y(d.h) + 4} fontSize={13} fontWeight={700} fill={COL.ink}>C</text>
          <DimH x1={X(0)} x2={X(d.span)} y={200} label={`${d.span} m`} ext={8} />
        </>,
        560,
        215,
      );
    }
    case 'incline': {
      const t = (d.theta * Math.PI) / 180;
      const L = 360;
      return frame(
        <>
          <polygon points={`80,180 ${80 + L * Math.cos(t)},180 ${80 + L * Math.cos(t)},${180 - L * Math.sin(t)}`} fill={COL.muted} opacity={0.15} stroke={COL.ink} />
          <Hatch x={70} y={180} w={L * Math.cos(t) + 20} />
          <g transform={`translate(${80 + 0.55 * L * Math.cos(t)} ${180 - 0.55 * L * Math.sin(t)}) rotate(${-d.theta})`}>
            <rect x={-30} y={-36} width={60} height={36} fill="#0ea5e9" opacity={0.35} stroke="#0284c7" />
            <text x={0} y={-14} fontSize={11} textAnchor="middle" fill={COL.ink}>{d.m} kg</text>
          </g>
          <text x={150} y={172} fontSize={12} fill={COL.ink}>θ = {d.theta}°</text>
          <text x={380} y={40} fontSize={12} fill={COL.ink}>μs = {d.mu}</text>
        </>,
      );
    }
    case 'pulley':
      return frame(
        <>
          <rect x={180} y={10} width={200} height={8} fill={COL.ink} />
          {Array.from({ length: d.n }, (_, i) => <line key={i} x1={210 + i * 26} x2={210 + i * 26} y1={18} y2={130} stroke={COL.tension} strokeWidth={2.2} />)}
          <rect x={196} y={130} width={Math.max(40, (d.n - 1) * 26 + 28)} height={14} rx={4} fill={COL.muted} />
          <rect x={210} y={150} width={60} height={40} fill={COL.load} opacity={0.35} stroke={COL.load} />
          <text x={240} y={175} fontSize={12} textAnchor="middle" fill={COL.ink}>{d.load} N</text>
          <Arrow x1={420} y1={60} x2={420} y2={150} color={COL.reaction} w={2.4} />
          <text x={428} y={110} fontSize={12} fill={COL.reaction}>E = {d.effort} N</text>
          <text x={20} y={200} fontSize={11} fill={COL.muted}>{d.n} rope segments support the moving block</text>
        </>,
      );
    case 'circuit':
      return frame(
        <>
          <line x1={60} x2={60} y1={40} y2={90} stroke={COL.ink} strokeWidth={2} />
          <line x1={44} x2={76} y1={95} y2={95} stroke={COL.ink} strokeWidth={3} />
          <line x1={52} x2={68} y1={108} y2={108} stroke={COL.ink} strokeWidth={3} />
          <line x1={60} x2={60} y1={112} y2={170} stroke={COL.ink} strokeWidth={2} />
          <text x={26} y={106} fontSize={12} fontWeight={700} fill={COL.ink}>{d.V} V</text>
          {d.mode === 'series' ? (
            <>
              <path d="M 60 40 L 500 40 L 500 170 L 60 170" fill="none" stroke={COL.ink} strokeWidth={2} />
              {d.R.map((r, i) => <g key={i}><rect x={180 + i * 150} y={30} width={60} height={20} fill="var(--diagram-bg)" stroke={COL.transport} strokeWidth={2} /><text x={210 + i * 150} y={24} fontSize={12} textAnchor="middle" fill={COL.ink}>{r} Ω</text></g>)}
            </>
          ) : (
            <>
              <path d="M 60 40 L 420 40 M 60 170 L 420 170" fill="none" stroke={COL.ink} strokeWidth={2} />
              {d.R.map((r, i) => <g key={i}><line x1={240 + i * 150} x2={240 + i * 150} y1={40} y2={170} stroke={COL.ink} strokeWidth={2} /><rect x={230 + i * 150} y={75} width={20} height={60} fill="var(--diagram-bg)" stroke={COL.transport} strokeWidth={2} /><text x={256 + i * 150} y={110} fontSize={12} fill={COL.ink}>{r} Ω</text></g>)}
            </>
          )}
        </>,
      );
    case 'hydraulic':
      return frame(
        <>
          <path d="M 90 50 L 90 160 L 380 160 L 380 70 M 130 50 L 130 140 L 340 140 L 340 70" fill="none" stroke={COL.ink} strokeWidth={2} />
          <rect x={90} y={100} width={40} height={60} fill="#f59e0b" opacity={0.25} />
          <rect x={130} y={140} width={210} height={20} fill="#f59e0b" opacity={0.25} />
          <rect x={340} y={90} width={40} height={70} fill="#f59e0b" opacity={0.25} />
          <Arrow x1={110} y1={30} x2={110} y2={94} color={COL.load} w={2.4} />
          <text x={110} y={24} fontSize={12} textAnchor="middle" fill={COL.load}>{d.F1} N</text>
          <text x={110} y={190} fontSize={11} textAnchor="middle" fill={COL.ink}>⌀{d.d1} mm</text>
          <text x={360} y={190} fontSize={11} textAnchor="middle" fill={COL.ink}>⌀{d.d2} mm</text>
          <Arrow x1={360} y1={86} x2={360} y2={30} color={COL.reaction} w={2.8} />
          <text x={372} y={40} fontSize={12} fill={COL.reaction}>F₂ = ?</text>
        </>,
      );
    case 'rod':
      return frame(
        <>
          <rect x={160} y={90} width={240} height={30} fill="#0ea5e9" opacity={0.3} stroke="#0284c7" />
          <Arrow x1={160} y1={105} x2={90} y2={105} color={COL.load} w={2.6} />
          <Arrow x1={400} y1={105} x2={470} y2={105} color={COL.load} w={2.6} />
          <text x={80} y={96} fontSize={12} textAnchor="end" fill={COL.load}>{d.F} kN</text>
          <text x={480} y={96} fontSize={12} fill={COL.load}>{d.F} kN</text>
          <text x={280} y={150} fontSize={12} textAnchor="middle" fill={COL.ink}>⌀ {d.d} mm</text>
        </>,
      );
    case 'lever':
      return frame(
        <>
          <circle cx={120} cy={120} r={14} fill={COL.muted} stroke={COL.ink} />
          <line x1={120} y1={120} x2={440} y2={120} stroke={COL.ink} strokeWidth={8} strokeLinecap="round" />
          <Arrow x1={440 - 70 * Math.cos((d.alpha * Math.PI) / 180)} y1={120 - 70 * Math.sin((d.alpha * Math.PI) / 180)} x2={440} y2={120} color={COL.load} w={2.6} />
          <text x={420} y={60} fontSize={12} fill={COL.load}>{d.F} N at {d.alpha}°</text>
          <DimH x1={120} x2={440} y={170} label={`${d.d} m`} ext={40} />
        </>,
      );
    case 'section':
      return frame(
        <>
          <path d="M 220 30 h 120 v 14 h -48 v 132 h 48 v 14 h -120 v -14 h 48 v -132 h -48 z" fill="#0ea5e9" opacity={0.3} stroke="#0284c7" />
          <line x1={200} x2={360} y1={110} y2={110} stroke={COL.ink} strokeDasharray="10 3 2 3" />
          <text x={366} y={114} fontSize={11} fill={COL.ink}>N.A.</text>
          <line x1={380} x2={380} y1={30} y2={190} stroke={COL.muted} />
          <text x={386} y={114} fontSize={11} fill={COL.ink}>{d.depth} mm</text>
          <text x={60} y={60} fontSize={12} fill={COL.ink}>M = {d.M} kN·m</text>
          <text x={60} y={80} fontSize={12} fill={COL.ink}>I = {d.I} × 10⁶ mm⁴</text>
        </>,
      );
  }
}

