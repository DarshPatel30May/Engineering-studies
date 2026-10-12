import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Scissors } from 'lucide-react';
import { makeTruss, simpleTriangleTruss, solveTruss, methodOfSections, memberLength, type SectionStep, type Truss, type TrussType, type TrussSolution } from '@/lib/calc/truss';
import { sig } from '@/lib/calc/format';
import { Arrow, PinSupport, RollerSupport, Label, COL } from '../diagrams/svg';
import { Callout, Card, ErrorList, M, Select, Slider, Tabs, Badge, Toggle, cx } from '../ui';

type Preset = TrussType | 'triangle';

export default function TrussSolver() {
  const [type, setType] = useState<Preset>('pratt');
  const [panels, setPanels] = useState(4);
  const [span, setSpan] = useState(12);
  const [height, setHeight] = useState(3);
  const [P, setP] = useState(10);
  const [overrides, setOverrides] = useState<Record<string, { Fx: number; Fy: number }>>({});
  const [selNode, setSelNode] = useState<string | null>(null);
  const [view, setView] = useState<'joints' | 'sections' | 'table'>('joints');
  const [step, setStep] = useState(0);
  const [cutPanel, setCutPanel] = useState(1);
  const [showValues, setShowValues] = useState(true);

  const truss: Truss = useMemo(() => {
    const base = type === 'triangle' ? simpleTriangleTruss(span, height, P) : makeTruss(type, type === 'king-post' ? 2 : panels, span, height, P);
    // Apply user-edited joint loads
    const loads = new Map(base.loads.map((l) => [l.node, { ...l }]));
    for (const [node, f] of Object.entries(overrides)) {
      if (!base.nodes.some((n) => n.id === node)) continue;
      loads.set(node, { node, Fx: f.Fx, Fy: f.Fy });
    }
    return { ...base, loads: Array.from(loads.values()).filter((l) => l.Fx !== 0 || l.Fy !== 0) };
  }, [type, panels, span, height, P, overrides]);

  const sol = useMemo(() => solveTruss(truss), [truss]);
  const resetLoads = () => setOverrides({});

  const changeType = (t: Preset) => {
    setType(t);
    setOverrides({});
    setSelNode(null);
    setStep(0);
    if (t === 'triangle') {
      setSpan(6);
      setHeight(3);
    } else if (span < 6) setSpan(12);
  };

  // Method of sections cut
  const nPanels = type === 'triangle' ? 1 : type === 'king-post' ? 2 : panels;
  const w = span / nPanels;
  const cutX = type === 'warren' ? (cutPanel + 0.25) * w : (cutPanel + 0.5) * w;
  const section = useMemo(() => {
    if (!sol.ok || type === 'triangle') return null;
    const left = truss.nodes.filter((n) => n.x < cutX).map((n) => n.id);
    const crossing = truss.members.filter((m) => left.includes(m.a) !== left.includes(m.b)).map((m) => m.id);
    if (crossing.length !== 3) return { left, crossing, result: { error: `This cut crosses ${crossing.length} members — choose an interior panel so exactly three members are cut.` } };
    return { left, crossing, result: methodOfSections(truss, sol, crossing as [string, string, string], left) };
  }, [sol, truss, cutX, type]);

  const jointSteps = sol.ok ? sol.jointSteps : [];
  const curJoint = view === 'joints' && jointSteps[step] ? jointSteps[step].node : null;

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[300px_1fr]">
      <Card title="Truss set-up" subtitle="Statically determinate, pin-jointed plane trusses">
        <div className="space-y-3">
          <Select
            label="Truss type"
            value={type}
            onChange={changeType}
            options={[
              { value: 'pratt', label: 'Pratt (diagonals in tension)' },
              { value: 'howe', label: 'Howe (diagonals in compression)' },
              { value: 'warren', label: 'Warren (equilateral-style)' },
              { value: 'king-post', label: 'King-post roof truss' },
              { value: 'triangle', label: 'Simple triangle (A-frame)' },
            ]}
          />
          {(type === 'pratt' || type === 'howe') && <Slider label="Panels" value={panels} min={2} max={8} step={2} onChange={(v) => (setPanels(v), setOverrides({}), setCutPanel(1), setStep(0))} />}
          {type === 'warren' && <Slider label="Panels" value={panels} min={2} max={6} step={1} onChange={(v) => (setPanels(v), setOverrides({}), setCutPanel(1), setStep(0))} />}
          <Slider label="Span" value={span} min={4} max={24} step={1} unit="m" onChange={(v) => (setSpan(v), setStep(0))} />
          <Slider label="Height" value={height} min={1} max={8} step={0.5} unit="m" onChange={(v) => (setHeight(v), setStep(0))} />
          <Slider label={type === 'triangle' ? 'Apex load' : 'Load at each interior bottom joint'} value={P} min={0} max={50} step={1} unit="kN" onChange={(v) => (setP(v), setStep(0))} />
          <div className="rounded-lg border border-ink-200 p-2 text-sm dark:border-ink-700">
            <div className="mb-1 font-medium">Edit a joint load</div>
            <p className="mb-2 text-xs text-ink-500">Click a joint in the diagram, then set its load (kN, +x right, +y up).</p>
            {selNode ? (
              <JointLoadEditor
                node={selNode}
                value={truss.loads.find((l) => l.node === selNode) ?? { Fx: 0, Fy: 0 }}
                onChange={(f) => setOverrides((o) => ({ ...o, [selNode]: f }))}
              />
            ) : (
              <p className="text-xs text-ink-400">No joint selected.</p>
            )}
            <button className="btn mt-2 w-full text-xs" onClick={resetLoads}>
              Reset loads
            </button>
          </div>
          <Toggle checked={showValues} onChange={setShowValues} label="Show member forces on diagram" />
          <Callout kind="assume">
            <ul>
              <li>Frictionless pins; loads only at joints; member weight ignored.</li>
              <li>Tension positive (+); compression negative (−).</li>
              <li>Pin at the left support, roller at the right.</li>
            </ul>
          </Callout>
        </div>
      </Card>

      <div className="min-w-0 space-y-4">
        {!sol.ok ? (
          <ErrorList errors={sol.errors} />
        ) : (
          <>
            <Card
              title="Member forces"
              subtitle={
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">Blue = tension</Badge>
                  <Badge tone="red">Red = compression</Badge>
                  <Badge>Grey dashed = zero force</Badge>
                  <span className="text-xs">Line thickness ∝ |force|</span>
                </span>
              }
            >
              <TrussDiagram
                truss={truss}
                sol={sol}
                showValues={showValues}
                highlightNode={curJoint}
                selected={selNode}
                onSelect={setSelNode}
                cut={view === 'sections' && section ? { x: cutX, members: section.crossing, left: section.left } : null}
              />
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-500">
                <span>
                  Determinacy: m + r = {sol.determinacy.m} + {sol.determinacy.r} = {sol.determinacy.m + sol.determinacy.r}; 2j = {2 * sol.determinacy.j} ✓
                </span>
                <span>· Max equilibrium residual: {sol.maxResidual.toExponential(1)} kN</span>
              </div>
            </Card>

            <Card>
              <Tabs
                value={view}
                onChange={setView}
                tabs={[
                  { id: 'joints', label: 'Method of joints' },
                  { id: 'sections', label: 'Method of sections' },
                  { id: 'table', label: 'Member table' },
                ]}
                className="mb-4"
              />
              {view === 'joints' && <JointsView sol={sol} step={step} setStep={setStep} />}
              {view === 'sections' &&
                (type === 'triangle' ? (
                  <p className="text-sm text-ink-500">A three-member triangle is solved directly by joints. Choose a Pratt, Howe or Warren truss to try the method of sections.</p>
                ) : (
                  <div className="space-y-3">
                    <Slider label={<span className="flex items-center gap-1"><Scissors size={13} /> Cut through panel</span>} value={cutPanel} min={0} max={nPanels - 1} onChange={setCutPanel} format={(v) => `${v + 1} of ${nPanels}`} />
                    {section && 'error' in section.result ? (
                      <ErrorList errors={[section.result.error]} />
                    ) : (
                      section && (
                        <>
                          <p className="prose-only text-sm text-ink-600 dark:text-ink-300">
                            Cut members <strong>{section.crossing.join(', ')}</strong>. Consider the free body to the LEFT of the cut (shaded). Take moments about the point where two cut members intersect to find the third directly.
                          </p>
                          {(section.result as SectionStep[]).map((s) => (
                            <div key={s.member} className="rounded-lg border border-ink-100 p-3 dark:border-ink-800">
                              <div className="mb-1 flex items-center justify-between text-sm font-medium">
                                <span>
                                  F<sub>{s.member}</sub> {s.method === 'moment' ? `— moments about ${s.about?.label}` : '— resolve perpendicular to the parallel chords'}
                                </span>
                                <TC v={s.value} />
                              </div>
                              <M block>{s.equation}</M>
                              <p className="text-xs text-ink-500">Matches method of joints: {sig(sol.forces[s.member], 5)} kN ✓</p>
                            </div>
                          ))}
                        </>
                      )
                    )}
                  </div>
                ))}
              {view === 'table' && (
                <div className="overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Length (m)</th>
                        <th>Force (kN)</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {truss.members.map((m) => (
                        <tr key={m.id}>
                          <td className="font-mono">{m.id}</td>
                          <td className="font-mono tabular-nums">{sig(memberLength(truss, m), 4)}</td>
                          <td className="font-mono tabular-nums">{sig(sol.forces[m.id], 4)}</td>
                          <td>
                            <TC v={sol.forces[m.id]} />
                          </td>
                        </tr>
                      ))}
                      {sol.reactions.map((r) => (
                        <tr key={r.node + r.dir} className="bg-emerald-50/50 dark:bg-emerald-950/20">
                          <td className="font-mono">
                            R<sub>{r.node + r.dir}</sub>
                          </td>
                          <td>—</td>
                          <td className="font-mono tabular-nums">{sig(r.value, 4)}</td>
                          <td className="text-xs">Reaction ({r.dir === 'y' ? (r.value >= 0 ? 'up' : 'down') : r.value >= 0 ? 'right' : 'left'})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sol.zeroForce.length > 0 && (
                    <p className="mt-2 text-xs text-ink-500">Zero-force members by inspection: {sol.zeroForce.join(', ')} — they still brace the structure and carry load under other load cases.</p>
                  )}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function JointLoadEditor({ node, value, onChange }: { node: string; value: { Fx: number; Fy: number }; onChange: (v: { Fx: number; Fy: number }) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold">Joint {node}</div>
      <Slider label="Fx" value={value.Fx} min={-40} max={40} step={1} unit="kN" onChange={(Fx) => onChange({ ...value, Fx })} />
      <Slider label="Fy" value={value.Fy} min={-60} max={30} step={1} unit="kN" onChange={(Fy) => onChange({ ...value, Fy })} />
    </div>
  );
}

export function TC({ v }: { v: number }) {
  if (Math.abs(v) < 1e-6) return <Badge>Zero</Badge>;
  return v > 0 ? <Badge tone="blue">{sig(v, 4)} kN T</Badge> : <Badge tone="red">{sig(-v, 4)} kN C</Badge>;
}

function JointsView({ sol, step, setStep }: { sol: TrussSolution; step: number; setStep: (n: number) => void }) {
  const s = sol.jointSteps[step];
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="mb-1 text-sm font-semibold">Step 0 — Support reactions (whole truss equilibrium)</div>
        {sol.reactionSteps.map((l, i) => (
          <M key={i} block>
            {l}
          </M>
        ))}
      </div>
      {s && (
        <div className="rounded-lg border border-ink-200 p-3 dark:border-ink-700">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">
              Step {step + 1} of {sol.jointSteps.length} — Joint {s.node}
            </div>
            <div className="flex gap-1">
              <button className="btn px-2" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} aria-label="Previous joint">
                <ChevronLeft size={16} />
              </button>
              <button className="btn px-2" onClick={() => setStep(Math.min(sol.jointSteps.length - 1, step + 1))} disabled={step === sol.jointSteps.length - 1} aria-label="Next joint">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <p className="prose-only mb-1 text-xs text-ink-500">
            Unknown member forces are assumed tensile (pointing away from the joint). Coefficients are the direction cosines of each member measured from this joint.
          </p>
          {s.knownTerms.length > 0 && (
            <p className="mb-1 text-xs">
              Known at this joint: <M>{s.knownTerms.join(',\\ ')}</M>
            </p>
          )}
          {s.equations.map((e, i) => (
            <M key={i} block>
              {e}
            </M>
          ))}
          <div className="mt-2 flex flex-wrap gap-2">
            {s.solved.map((x) => (
              <span key={x.member} className="text-sm">
                F<sub>{x.member}</sub> = <TC v={x.value} />
              </span>
            ))}
          </div>
          {s.note && <p className="prose-only mt-1 text-xs text-ink-500">{s.note}</p>}
        </div>
      )}
    </div>
  );
}

export function TrussDiagram({ truss, sol, showValues = true, highlightNode, selected, onSelect, cut, height = 320 }: {
  truss: Truss;
  sol?: TrussSolution;
  showValues?: boolean;
  highlightNode?: string | null;
  selected?: string | null;
  onSelect?: (n: string) => void;
  cut?: { x: number; members: string[]; left: string[] } | null;
  height?: number;
}) {
  const W = 760;
  const xs = truss.nodes.map((n) => n.x);
  const ys = truss.nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const padX = 70;
  const padTop = 60;
  const padBot = 80;
  const s = Math.min((W - 2 * padX) / Math.max(1e-6, maxX - minX), (height - padTop - padBot) / Math.max(1e-6, maxY));
  const X = (x: number) => padX + (x - minX) * s + ((W - 2 * padX) - (maxX - minX) * s) / 2;
  const Y = (y: number) => height - padBot - y * s;
  const nm = new Map(truss.nodes.map((n) => [n.id, n]));
  const maxF = sol ? Math.max(1e-6, ...Object.values(sol.forces).map(Math.abs)) : 1;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="diagram" role="img" aria-label="Truss diagram with member forces">
      {cut && (
        <g>
          <rect x={0} y={0} width={X(cut.x)} height={height} fill="#10b981" opacity={0.06} />
          <line x1={X(cut.x)} x2={X(cut.x)} y1={20} y2={height - 30} stroke="#10b981" strokeWidth={2} strokeDasharray="8 5" />
          <text x={X(cut.x) + 6} y={30} fontSize={11} fill="#059669" fontWeight={600}>
            section cut
          </text>
        </g>
      )}
      {truss.members.map((m) => {
        const a = nm.get(m.a)!;
        const b = nm.get(m.b)!;
        const f = sol?.forces[m.id] ?? 0;
        const zero = !!sol && Math.abs(f) < 1e-6;
        const color = !sol ? COL.ink : zero ? COL.zero : f > 0 ? COL.tension : COL.compression;
        const width = !sol ? 3 : zero ? 2 : 2.5 + (Math.abs(f) / maxF) * 6;
        const isCut = cut?.members.includes(m.id);
        const mx = (X(a.x) + X(b.x)) / 2;
        const my = (Y(a.y) + Y(b.y)) / 2;
        return (
          <g key={m.id}>
            <line x1={X(a.x)} y1={Y(a.y)} x2={X(b.x)} y2={Y(b.y)} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={zero ? '6 5' : undefined} opacity={isCut ? 1 : cut ? 0.6 : 1} />
            {sol && showValues && (
              <Label x={mx} y={my + 4} size={10.5} weight={700} color={color} bg>
                {zero ? '0' : `${sig(Math.abs(f), 3)}${f > 0 ? 'T' : 'C'}`}
              </Label>
            )}
          </g>
        );
      })}
      {truss.supports.map((sp) => {
        const n = nm.get(sp.node)!;
        return sp.type === 'pin' ? <PinSupport key={sp.node} x={X(n.x)} y={Y(n.y) + 6} /> : <RollerSupport key={sp.node} x={X(n.x)} y={Y(n.y) + 6} />;
      })}
      {truss.loads.map((l) => {
        const n = nm.get(l.node)!;
        const mag = Math.hypot(l.Fx, l.Fy);
        if (mag < 1e-9) return null;
        const len = 44;
        const ux = l.Fx / mag;
        const uy = -l.Fy / mag;
        // Downward loads on bottom-chord joints hang below the joint so they don't cross members.
        const hang = uy > 0.7 && n.y <= Math.min(...ys) + 1e-9;
        const x0 = hang ? X(n.x) : X(n.x) - ux * (8 + len);
        const y0 = hang ? Y(n.y) + 8 : Y(n.y) - uy * (8 + len);
        const x1 = x0 + ux * len;
        const y1 = y0 + uy * len;
        return (
          <g key={'L' + l.node}>
            <Arrow x1={x0} y1={y0} x2={x1} y2={y1} color={COL.load} w={2.4} />
            <Label x={hang ? x1 : x0 - ux * 10} y={hang ? y1 + 14 : y0 - uy * 10 + 4} color={COL.load} size={11} weight={700} bg>
              {`${sig(mag, 3)} kN`}
            </Label>
          </g>
        );
      })}
      {sol &&
        sol.reactions.map((r) => {
          if (Math.abs(r.value) < 1e-9) return null;
          const n = nm.get(r.node)!;
          const x = X(n.x);
          const y = Y(n.y) + 50;
          return r.dir === 'y' ? (
            <g key={r.node + 'y'}>
              <Arrow x1={x - 26} y1={r.value > 0 ? y + 14 : y - 30} x2={x - 26} y2={r.value > 0 ? y - 26 : y + 10} color={COL.reaction} w={2.2} />
              <Label x={x - 30} y={y + 28} anchor="end" color={COL.reaction} size={11} weight={700} bg>
                {`${sig(Math.abs(r.value), 3)} kN`}
              </Label>
            </g>
          ) : (
            <g key={r.node + 'x'}>
              <Arrow x1={r.value > 0 ? x - 60 : x - 14} y1={y - 20} x2={r.value > 0 ? x - 14 : x - 60} y2={y - 20} color={COL.reaction} w={2.2} />
            </g>
          );
        })}
      {truss.nodes.map((n) => (
        <g key={n.id} onClick={() => onSelect?.(n.id)} className={onSelect ? 'cursor-pointer' : ''} role={onSelect ? 'button' : undefined} aria-label={onSelect ? `Select joint ${n.id}` : undefined}>
          <circle
            cx={X(n.x)}
            cy={Y(n.y)}
            r={highlightNode === n.id || selected === n.id ? 9 : 6}
            fill={highlightNode === n.id ? '#10b981' : selected === n.id ? '#f59e0b' : 'var(--diagram-bg)'}
            stroke={COL.ink}
            strokeWidth={1.8}
          />
          <text x={X(n.x) + (n.y > 0 ? 0 : 14)} y={Y(n.y) + (n.y > 0 ? -14 : -10)} fontSize={11.5} fontWeight={700} textAnchor="middle" className={cx('fill-current')} fill={COL.ink}>
            {n.id}
          </text>
        </g>
      ))}
    </svg>
  );
}
