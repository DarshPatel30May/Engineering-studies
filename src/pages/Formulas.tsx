import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sigma, ArrowLeftRight, Calculator } from 'lucide-react';
import { FORMULAS, FORMULA_CATEGORIES, type Formula } from '@/data/formulas';
import { MODULE_MAP } from '@/data/modules';
import { QUANTITIES, convert, getQuantity } from '@/lib/calc/units';
import { parseNum, sig } from '@/lib/calc/format';
import { PageHeader, Card, M, Badge, Callout, Select, Tabs, KeyPoints, ErrorList, Stat, cx } from '@/components/ui';

const SHEET_LABEL: Record<Formula['sheet'], { t: string; tone: string }> = {
  sheet: { t: 'Formulae-sheet type', tone: 'emerald' },
  learn: { t: 'Learn / derive', tone: 'blue' },
  extension: { t: 'Extension', tone: 'amber' },
};

export default function Formulas() {
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<string>('all');
  const [mod, setMod] = useState<string>('all');
  const [q, setQ] = useState('');
  const open = params.get('f');
  const list = useMemo(
    () =>
      FORMULAS.filter((f) => (cat === 'all' || f.category === cat) && (mod === 'all' || f.modules.includes(mod as never)) && (!q || (f.name + f.meaning).toLowerCase().includes(q.toLowerCase()))),
    [cat, mod, q],
  );
  useEffect(() => {
    if (open) setTimeout(() => document.getElementById(`f-${open}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [open]);
  return (
    <div>
      <PageHeader title="HSC Engineering Formula Centre" kicker="Formulas, meaning, units and calculators" icon={<Sigma className="text-emerald-600" />}>
        Every formula has its notation, variables, SI units, conversions, physical meaning, conditions of use, a worked HSC-style example, a calculator and common mistakes.
      </PageHeader>
      <Callout kind="info" title="About the NESA formulae sheet" className="mb-4">
        A formulae sheet is printed at the back of the HSC Engineering Studies examination (recent papers group it under forces and moments, friction, energy/work/power, pressure, stress and strain, and electricity). The tags below are <strong>indicative</strong>: “Formulae-sheet type” marks relationships of the kind printed on recent sheets; “Learn / derive” marks relationships you should be able to use or derive (e.g. resolving forces, beam reactions); “Extension” goes beyond the syllabus requirement. Always check the sheet in a recent NESA paper —{' '}
        <a className="underline" href="https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/engineering-studies" target="_blank" rel="noreferrer">NESA Engineering Studies exam papers</a>.
      </Callout>
      <UnitConverter />
      <div className="my-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Search formulas</label>
          <input className="input w-56" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. stress, power" />
        </div>
        <Select label="Category" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All categories' }, ...FORMULA_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        <Select label="Module" value={mod} onChange={setMod} options={[{ value: 'all', label: 'All modules' }, ...Object.values(MODULE_MAP).map((m) => ({ value: m.id, label: m.name }))]} />
        <span className="text-xs text-ink-500">{list.length} formulas</span>
      </div>
      <div className="space-y-4">
        {list.map((f) => (
          <FormulaCard key={f.id} f={f} defaultOpen={open === f.id} onOpen={() => setParams({ f: f.id }, { replace: true })} />
        ))}
      </div>
    </div>
  );
}

function FormulaCard({ f, defaultOpen, onOpen }: { f: Formula; defaultOpen: boolean; onOpen: () => void }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => setOpen((o) => o || defaultOpen), [defaultOpen]);
  const tag = SHEET_LABEL[f.sheet];
  return (
    <section id={`f-${f.id}`} className="card scroll-mt-24">
      <button className="flex w-full flex-wrap items-center gap-3 p-4 text-left" onClick={() => (setOpen(!open), !open && onOpen())} aria-expanded={open}>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink-900 dark:text-white">{f.name}</h3>
            <Badge tone={tag.tone}>{tag.t}</Badge>
            <Badge>{f.category}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-500">{f.meaning}</p>
        </div>
        <div className="rounded-lg bg-ink-50 px-3 py-1 dark:bg-ink-950/60">
          <M>{f.latex}</M>
        </div>
      </button>
      {open && (
        <div className="grid gap-4 border-t border-ink-100 p-4 dark:border-ink-800 xl:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h4 className="mb-1 text-sm font-semibold">Variables and SI units</h4>
              <table className="tbl">
                <tbody>
                  {f.vars.map((v) => (
                    <tr key={v.key}>
                      <td className="w-16"><M>{v.sym}</M></td>
                      <td>{v.name}</td>
                      <td className="whitespace-nowrap font-mono text-xs">{v.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><h4 className="mb-1 text-sm font-semibold">Conditions for use</h4><KeyPoints items={f.conditions} /></div>
              <div><h4 className="mb-1 text-sm font-semibold">Unit conversions</h4><KeyPoints items={f.conversions} /></div>
            </div>
            <Callout kind="warn" title="Common mistakes"><ul>{f.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></Callout>
            <div className="rounded-lg border border-ink-200 p-3 dark:border-ink-700">
              <h4 className="mb-1 text-sm font-semibold">Worked HSC-style example</h4>
              <p className="text-sm">{f.example.q}</p>
              {f.example.steps.map((s, i) => <M key={i} block>{s}</M>)}
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Answer: {f.example.a}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-ink-500">Modules:</span>
              {f.modules.map((m) => <Link key={m} to={`/module/${m}`}><Badge tone={m}>{MODULE_MAP[m].name}</Badge></Link>)}
              {f.related && <Link className="btn text-xs" to={f.related}>Interactive tool →</Link>}
            </div>
          </div>
          <FormulaCalculator f={f} />
        </div>
      )}
    </section>
  );
}

/** Generic calculator: choose the unknown, enter the others with units, solve in SI. */
function FormulaCalculator({ f }: { f: Formula }) {
  const targets = Object.keys(f.solve);
  const [target, setTarget] = useState(targets[0]);
  const solver = f.solve[target];
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>(() => Object.fromEntries(f.vars.filter((v) => v.q).map((v) => [v.key, v.def ?? getQuantity(v.q!).units[0].id])));
  const tv = f.vars.find((v) => v.key === target)!;
  const errors: string[] = [];
  const si: Record<string, number> = {};
  for (const k of solver.needs) {
    const v = f.vars.find((x) => x.key === k)!;
    const n = parseNum(raw[k] ?? '');
    if (n === null) {
      errors.push(`Enter a value for ${v.name}.`);
      continue;
    }
    const val = v.q ? convert(n, v.q, units[k], getQuantity(v.q).units.find((u) => u.factor === 1 && !u.offset)?.id ?? units[k]) : n;
    if (v.positive && val <= 0) errors.push(`${v.name} must be greater than zero.`);
    if (v.min !== undefined && val < v.min) errors.push(`${v.name} must be at least ${v.min}.`);
    if (v.max !== undefined && val > v.max) errors.push(`${v.name} must be at most ${v.max}.`);
    si[k] = val;
  }
  let result: number | null = null;
  let warn: string | null = null;
  if (!errors.length) {
    warn = solver.check?.(si) ?? null;
    const r = solver.fn(si);
    if (!Number.isFinite(r)) errors.push('No real answer for these inputs (check for division by zero or impossible values).');
    else result = r;
  }
  const outUnit = units[target];
  const shown = result !== null && tv.q ? convert(result, tv.q, getQuantity(tv.q).units.find((u) => u.factor === 1 && !u.offset)?.id ?? outUnit, outUnit) : result;
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
      <div className="mb-3 flex items-center gap-2 font-semibold"><Calculator size={16} className="text-emerald-600" /> Calculator</div>
      {targets.length > 1 && (
        <div className="mb-3">
          <label className="label">Solve for</label>
          <Tabs size="sm" value={target} onChange={setTarget} tabs={targets.map((t) => ({ id: t, label: f.vars.find((v) => v.key === t)!.name.split(' (')[0] }))} />
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {solver.needs.map((k) => {
          const v = f.vars.find((x) => x.key === k)!;
          const err = raw[k] !== undefined && raw[k] !== '' && parseNum(raw[k]) === null;
          return (
            <div key={k}>
              <label className="label">{v.name}</label>
              <div className="flex gap-1.5">
                <input className={cx('input', err && 'input-error')} inputMode="decimal" value={raw[k] ?? ''} onChange={(e) => setRaw((r) => ({ ...r, [k]: e.target.value }))} placeholder={v.sym.replace(/\\/g, '')} aria-label={v.name} />
                {v.q ? (
                  <select className="input w-auto" value={units[k]} onChange={(e) => setUnits((u) => ({ ...u, [k]: e.target.value }))} aria-label={`${v.name} unit`}>
                    {getQuantity(v.q).units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                ) : (
                  <span className="self-center px-1 text-xs text-ink-500">{v.unit}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {tv.q && (
          <div>
            <label className="label">Answer unit</label>
            <select className="input w-auto" value={outUnit} onChange={(e) => setUnits((u) => ({ ...u, [target]: e.target.value }))}>
              {getQuantity(tv.q).units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="mt-3">
        {errors.length ? (
          Object.keys(raw).length ? <ErrorList errors={errors} /> : <p className="text-xs text-ink-500">Enter the known values to calculate {tv.name.toLowerCase()}.</p>
        ) : (
          <>
            <Stat label={tv.name} value={sig(shown!, 5)} unit={tv.q ? getQuantity(tv.q).units.find((u) => u.id === outUnit)?.label : tv.unit === '—' ? '' : tv.unit} tone="emerald" />
            {warn && <Callout kind="warn" className="mt-2">{warn}</Callout>}
            <p className="mt-2 text-xs text-ink-500">Calculated in SI base units with full precision, then converted for display (5 significant figures).</p>
          </>
        )}
      </div>
    </div>
  );
}

function UnitConverter() {
  const [qid, setQid] = useState('stress');
  const q = getQuantity(qid);
  const [from, setFrom] = useState('MPa');
  const [to, setTo] = useState('Pa');
  const [val, setVal] = useState('250');
  const n = parseNum(val);
  const ok = q.units.some((u) => u.id === from) && q.units.some((u) => u.id === to);
  const out = n !== null && ok ? convert(n, qid, from, to) : null;
  return (
    <Card id="units" title="Engineering unit converter" icon={<ArrowLeftRight size={18} />} subtitle="Area and volume conversions square and cube the length factor">
      <div className="grid gap-3 md:grid-cols-[180px_1fr_auto_1fr]">
        <Select label="Quantity" value={qid} onChange={(v) => { const nq = getQuantity(v); setQid(v); setFrom(nq.units[0].id); setTo(nq.units[Math.min(1, nq.units.length - 1)].id); }} options={QUANTITIES.map((x) => ({ value: x.id, label: x.name }))} />
        <div>
          <label className="label">Value</label>
          <div className="flex gap-1.5">
            <input className={cx('input', n === null && val !== '' && 'input-error')} value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" aria-label="Value to convert" />
            <select className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From unit">{q.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}</select>
          </div>
        </div>
        <button className="btn mt-5 self-start" onClick={() => (setFrom(to), setTo(from))} aria-label="Swap units"><ArrowLeftRight size={15} /></button>
        <div>
          <label className="label">Result</label>
          <div className="flex gap-1.5">
            <div className="input bg-ink-50 font-mono dark:bg-ink-900">{out === null ? '—' : sig(out, 6)}</div>
            <select className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To unit">{q.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}</select>
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">💡 {q.tip}</p>
    </Card>
  );
}
