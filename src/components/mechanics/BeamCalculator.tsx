import { useMemo, useRef, useState } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { solveBeam, type BeamResult, type PointLoad } from '@/lib/calc/statics';
import { parseNum, sig } from '@/lib/calc/format';
import { Arrow, PinSupport, RollerSupport, DimH, Label, COL } from '../diagrams/svg';
import { Callout, Card, ErrorList, M, NumField, Stat, Collapse, cx } from '../ui';

interface LoadRow {
  id: string;
  P: string;
  x: string;
}

const PRESETS: { name: string; L: string; a: string; b: string; loads: LoadRow[] }[] = [
  { name: 'Worked example: 6 m, 18 kN at 2 m', L: '6', a: '0', b: '6', loads: [{ id: '1', P: '18', x: '2' }] },
  { name: 'Two point loads (8 m)', L: '8', a: '0', b: '8', loads: [{ id: '1', P: '10', x: '2' }, { id: '2', P: '20', x: '5' }] },
  { name: 'Three loads (10 m)', L: '10', a: '0', b: '10', loads: [{ id: '1', P: '12', x: '2.5' }, { id: '2', P: '8', x: '5' }, { id: '3', P: '15', x: '8' }] },
  { name: 'Overhanging beam', L: '8', a: '0', b: '6', loads: [{ id: '1', P: '20', x: '3' }, { id: '2', P: '10', x: '8' }] },
];

export default function BeamCalculator({ compact = false }: { compact?: boolean }) {
  const [L, setL] = useState('6');
  const [a, setA] = useState('0');
  const [b, setB] = useState('6');
  const [loads, setLoads] = useState<LoadRow[]>(PRESETS[0].loads);
  const nextId = useRef(10);

  const parsed = useMemo(() => {
    const Ln = parseNum(L);
    const an = parseNum(a);
    const bn = parseNum(b);
    const ls = loads.map((l) => ({ id: l.id, P: parseNum(l.P), x: parseNum(l.x) }));
    if (Ln === null || an === null || bn === null || ls.some((l) => l.P === null || l.x === null)) return null;
    return { beam: { L: Ln, a: an, b: bn }, loads: ls as PointLoad[] };
  }, [L, a, b, loads]);

  const res = useMemo(() => (parsed ? solveBeam(parsed.beam, parsed.loads) : null), [parsed]);

  const preset = (i: number) => {
    const p = PRESETS[i];
    setL(p.L);
    setA(p.a);
    setB(p.b);
    setLoads(p.loads.map((l) => ({ ...l })));
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[320px_1fr]">
      <Card title="Beam input" subtitle="Simply supported: pin at A, roller at B. Loads in kN (downward +).">
        <div className="space-y-3">
          <div>
            <label className="label">Preset</label>
            <select className="input" onChange={(e) => preset(Number(e.target.value))} defaultValue={0} aria-label="Beam preset">
              {PRESETS.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumField label="Length L" value={L} onChange={setL} unit="m" min={0.1} max={1000} allowZero={false} />
            <NumField label="Pin A at" value={a} onChange={setA} unit="m" min={0} />
            <NumField label="Roller B at" value={b} onChange={setB} unit="m" min={0} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="label mb-0">Point loads</span>
              <button
                className="btn btn-ghost px-2 py-1 text-xs"
                onClick={() => setLoads((ls) => (ls.length >= 12 ? ls : [...ls, { id: String(nextId.current++), P: '10', x: String((parseNum(L) ?? 4) / 2) }]))}
                disabled={loads.length >= 12}
              >
                <Plus size={14} /> Add load
              </button>
            </div>
            <div className="space-y-2">
              {loads.map((l, i) => (
                <div key={l.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <NumField label={`P${i + 1}`} value={l.P} onChange={(v) => setLoads((ls) => ls.map((q) => (q.id === l.id ? { ...q, P: v } : q)))} unit="kN" />
                  <NumField label={`x${i + 1} from left`} value={l.x} onChange={(v) => setLoads((ls) => ls.map((q) => (q.id === l.id ? { ...q, x: v } : q)))} unit="m" min={0} />
                  <button className="btn btn-ghost mb-0.5 px-2" aria-label={`Remove load ${i + 1}`} onClick={() => setLoads((ls) => ls.filter((q) => q.id !== l.id))} disabled={loads.length === 1}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button className="btn w-full" onClick={() => preset(0)}>
            <RotateCcw size={14} /> Reset to worked example
          </button>
          {!compact && (
            <Callout kind="assume">
              <ul>
                <li>Rigid, weightless beam; statically determinate (pin + roller).</li>
                <li>Vertical point loads only — horizontal reaction at A is zero.</li>
                <li>Sign convention: upward forces +, anticlockwise moments +, sagging bending moment +.</li>
                <li>Shear force: positive when the resultant to the LEFT of a section acts upward.</li>
              </ul>
            </Callout>
          )}
        </div>
      </Card>

      <div className="min-w-0 space-y-4">
        {!res ? (
          <ErrorList errors={['Enter valid numbers in every field to solve the beam.']} />
        ) : !res.ok ? (
          <ErrorList errors={res.errors} />
        ) : (
          <BeamOutput res={res} L={parsed!.beam.L} a={parsed!.beam.a} b={parsed!.beam.b} loads={parsed!.loads} compact={compact} />
        )}
      </div>
    </div>
  );
}

function BeamOutput({ res, L, a, b, loads, compact }: { res: BeamResult; L: number; a: number; b: number; loads: PointLoad[]; compact?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760;
  const m = 60;
  const sx = (x: number) => m + (x / L) * (W - 2 * m);
  const kp = res.keyPoints;
  const Vat = (x: number) => {
    let v = 0;
    for (const p of kp) if (p.x <= x + 1e-9) v = p.Vright;
    return v;
  };
  const Mat = (x: number) => {
    for (let i = 0; i < kp.length - 1; i++) {
      if (x >= kp[i].x - 1e-9 && x <= kp[i + 1].x + 1e-9) {
        const t = (x - kp[i].x) / (kp[i + 1].x - kp[i].x || 1);
        return kp[i].M + t * (kp[i + 1].M - kp[i].M);
      }
    }
    return 0;
  };
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const x = ((px - m) / (W - 2 * m)) * L;
    setHover(x >= 0 && x <= L ? x : null);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={<>Reaction R<sub>A</sub> (pin)</>} value={sig(res.RA, 4)} unit="kN" tone={res.RA >= 0 ? 'emerald' : 'red'} sub={res.RA >= 0 ? 'upward' : 'downward (hold-down)'} />
        <Stat label={<>Reaction R<sub>B</sub> (roller)</>} value={sig(res.RB, 4)} unit="kN" tone={res.RB >= 0 ? 'emerald' : 'red'} sub={res.RB >= 0 ? 'upward' : 'downward (hold-down)'} />
        <Stat label="Max |V|" value={sig(res.maxShear, 4)} unit="kN" />
        <Stat
          label={res.maxMoment.value >= Math.abs(res.minMoment.value) ? 'Max M (sagging)' : 'Max M (hogging)'}
          value={sig(res.maxMoment.value >= Math.abs(res.minMoment.value) ? res.maxMoment.value : res.minMoment.value, 4)}
          unit="kN·m"
          sub={`at x = ${sig(res.maxMoment.value >= Math.abs(res.minMoment.value) ? res.maxMoment.x : res.minMoment.x, 4)} m`}
          tone="blue"
        />
      </div>

      <Card title="Free-body diagram" subtitle="Loads (amber) and support reactions (green) drawn to their calculated directions">
        <svg viewBox={`0 0 ${W} 235`} className="diagram" role="img" aria-label="Beam free-body diagram">
          <rect x={sx(0)} y={98} width={sx(L) - sx(0)} height={12} rx={2} fill="var(--diagram-bg)" stroke={COL.ink} strokeWidth={1.8} />
          <PinSupport x={sx(a)} y={110} label="A" />
          <RollerSupport x={sx(b)} y={110} label="B" />
          {loads.map((l, i) => {
            const down = l.P >= 0;
            return (
              <g key={l.id}>
                <Arrow x1={sx(l.x)} y1={down ? 30 : 160} x2={sx(l.x)} y2={down ? 96 : 112} color={COL.load} w={2.5} />
                <Label x={sx(l.x)} y={down ? 22 : 176} color={COL.load} weight={700} size={13} bg>
                  {`P${i + 1} = ${sig(Math.abs(l.P), 4)} kN`}
                </Label>
              </g>
            );
          })}
          {[
            { x: a, R: res.RA, n: 'R_A' },
            { x: b, R: res.RB, n: 'R_B' },
          ].map((r) =>
            Math.abs(r.R) < 1e-9 ? null : (
              <g key={r.n}>
                <Arrow x1={sx(r.x) + (sx(r.x) > W / 2 ? -24 : 24)} y1={r.R > 0 ? 160 : 60} x2={sx(r.x) + (sx(r.x) > W / 2 ? -24 : 24)} y2={r.R > 0 ? 114 : 94} color={COL.reaction} w={2.5} />
                <Label x={sx(r.x) + (sx(r.x) > W / 2 ? -30 : 30)} y={r.R > 0 ? 174 : 52} anchor={sx(r.x) > W / 2 ? 'end' : 'start'} color={COL.reaction} weight={700} size={13} bg>
                  R<tspan baselineShift="sub" fontSize={10}>{r.n.slice(2)}</tspan>{` = ${sig(Math.abs(r.R), 4)} kN`}
                </Label>
              </g>
            ),
          )}
          {kp.slice(0, -1).map((p, i) => (
            <DimH key={i} x1={sx(p.x)} x2={sx(kp[i + 1].x)} y={215} label={`${sig(kp[i + 1].x - p.x, 3)} m`} ext={12} />
          ))}
        </svg>
      </Card>

      <Card
        title="Shear-force and bending-moment diagrams"
        subtitle={hover !== null ? `x = ${sig(hover, 3)} m   ·   V = ${sig(Vat(hover), 4)} kN   ·   M = ${sig(Mat(hover), 4)} kN·m` : 'Hover or touch the diagrams to read values'}
      >
        <svg viewBox={`0 0 ${W} 420`} className="diagram touch-none" onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchMove={(e) => {
          const t = e.touches[0];
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((t.clientX - rect.left) / rect.width) * W;
          const x = ((px - m) / (W - 2 * m)) * L;
          setHover(x >= 0 && x <= L ? x : null);
        }} role="img" aria-label="Shear force and bending moment diagrams">
          <Plot pts={res.sfd} sx={sx} y0={10} h={170} title="Shear force V (kN)" color="#0ea5e9" kp={kp.map((p) => [p.x, p.Vleft, p.Vright])} />
          <Plot pts={res.bmd} sx={sx} y0={225} h={170} title="Bending moment M (kN·m) — sagging +" color="#8b5cf6" kp={kp.map((p) => [p.x, p.M, p.M])} />
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={sx(hover)} x2={sx(hover)} y1={10} y2={400} stroke={COL.ink} strokeDasharray="3 3" strokeWidth={1} />
            </g>
          )}
          {kp.map((p) => (
            <text key={p.x} x={sx(p.x)} y={414} fontSize={10.5} textAnchor="middle" fill={COL.muted}>
              {sig(p.x, 3)} m
            </text>
          ))}
        </svg>
        <p className="prose-only mt-2 text-xs text-ink-500">
          The SFD is constant between loads and jumps by each point load. The BMD is linear between loads; its slope equals the shear force, so M peaks where V changes sign.
        </p>
      </Card>

      <Card title="Worked solution" subtitle="Generated from your inputs — full precision kept until the final answer">
        <ol className="space-y-3">
          {res.steps.map((s, i) => (
            <li key={i} className="rounded-lg border border-ink-100 p-3 dark:border-ink-800">
              <div className="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-100">
                {i + 1}. {s.title}
              </div>
              {s.latex.map((l, j) => (
                <M key={j} block>
                  {l}
                </M>
              ))}
              {s.note && <p className="prose-only mt-1 text-xs text-ink-500">{s.note}</p>}
            </li>
          ))}
        </ol>
        <div className={cx('mt-3 rounded-lg px-3 py-2 text-sm', Math.abs(res.check.sumFy) < 1e-6 && Math.abs(res.check.endMoment) < 1e-6 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-red-50 text-red-800')}>
          Equilibrium check: ΣF<sub>y</sub> = {sig(res.check.sumFy, 3)} kN, ΣM<sub>A</sub> = {sig(res.check.sumM_A, 3)} kN·m, M at right end = {sig(res.check.endMoment, 3)} kN·m ✓
        </div>
        {!compact && (
          <Collapse title="Key-point table" className="mt-3">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>x (m)</th>
                    <th>Point</th>
                    <th>V just left (kN)</th>
                    <th>V just right (kN)</th>
                    <th>M (kN·m)</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {kp.map((p) => (
                    <tr key={p.x}>
                      <td>{sig(p.x, 4)}</td>
                      <td className="font-sans">{p.label}</td>
                      <td>{sig(p.Vleft, 4)}</td>
                      <td>{sig(p.Vright, 4)}</td>
                      <td>{sig(p.M, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Collapse>
        )}
      </Card>
    </>
  );
}

function Plot({ pts, sx, y0, h, title, color, kp }: {
  pts: { x: number; v: number }[];
  sx: (x: number) => number;
  y0: number;
  h: number;
  title: string;
  color: string;
  kp: [number, number, number][];
}) {
  const maxAbs = Math.max(1e-9, ...pts.map((p) => Math.abs(p.v)));
  const mid = y0 + 22 + (h - 30) / 2;
  const amp = (h - 44) / 2;
  const sy = (v: number) => mid - (v / maxAbs) * amp;
  const line = pts.map((p) => `${sx(p.x)},${sy(p.v)}`).join(' ');
  const area = `${sx(pts[0].x)},${mid} ${line} ${sx(pts[pts.length - 1].x)},${mid}`;
  const labelled = new Set<string>();
  return (
    <g>
      <text x={sx(0) - 50} y={y0 + 12} fontSize={12} fontWeight={600} fill={COL.ink}>
        {title}
      </text>
      <line x1={sx(0)} x2={sx(pts[pts.length - 1].x)} y1={mid} y2={mid} stroke={COL.muted} strokeWidth={1} />
      <polygon points={area} fill={color} opacity={0.15} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
      {kp.flatMap(([x, vl, vr]) =>
        [vl, vr].map((v, k) => {
          const key = `${x}:${sig(v, 4)}`;
          if (labelled.has(key) || Math.abs(v) < 1e-9) return null;
          labelled.add(key);
          const up = v >= 0;
          return (
            <g key={`${x}-${k}`}>
              <circle cx={sx(x)} cy={sy(v)} r={3} fill={color} />
              <Label x={sx(x) + (k === 0 ? -4 : 4)} y={sy(v) + (up ? -7 : 15)} anchor={k === 0 ? 'end' : 'start'} size={11} weight={600} bg>
                {sig(v, 4)}
              </Label>
            </g>
          );
        }),
      )}
      <text x={sx(0) - 8} y={mid + 4} fontSize={10} textAnchor="end" fill={COL.muted}>
        0
      </text>
    </g>
  );
}
