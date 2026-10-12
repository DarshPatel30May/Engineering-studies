import { useMemo, useState } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { evaluate, truthTable, layers, GATE_INFO, type Circuit, type GateType, type GateNode } from '@/lib/calc/logic';
import { Card, Tabs, Select, M, Callout, Badge, cx } from '../ui';
import { COL } from '../diagrams/svg';

const PRESETS: { id: string; name: string; c: Circuit }[] = [
  { id: 'and', name: 'AND gate', c: { inputs: ['A', 'B'], gates: [{ id: 'G1', type: 'AND', in: ['A', 'B'] }], output: 'G1' } },
  { id: 'or', name: 'OR gate', c: { inputs: ['A', 'B'], gates: [{ id: 'G1', type: 'OR', in: ['A', 'B'] }], output: 'G1' } },
  { id: 'nand', name: 'NAND gate', c: { inputs: ['A', 'B'], gates: [{ id: 'G1', type: 'NAND', in: ['A', 'B'] }], output: 'G1' } },
  { id: 'nor', name: 'NOR gate', c: { inputs: ['A', 'B'], gates: [{ id: 'G1', type: 'NOR', in: ['A', 'B'] }], output: 'G1' } },
  { id: 'nand-not', name: 'NAND → NOT (= AND)', c: { inputs: ['A', 'B'], gates: [{ id: 'G1', type: 'NAND', in: ['A', 'B'] }, { id: 'G2', type: 'NOT', in: ['G1'] }], output: 'G2' } },
  { id: 'nand-or', name: 'OR built from NANDs only', c: { inputs: ['A', 'B'], gates: [{ id: 'G1', type: 'NAND', in: ['A', 'A'] }, { id: 'G2', type: 'NAND', in: ['B', 'B'] }, { id: 'G3', type: 'NAND', in: ['G1', 'G2'] }], output: 'G3' } },
  { id: 'alarm', name: 'Alarm: A AND (B OR C)', c: { inputs: ['A', 'B', 'C'], gates: [{ id: 'G1', type: 'OR', in: ['B', 'C'] }, { id: 'G2', type: 'AND', in: ['A', 'G1'] }], output: 'G2' } },
  { id: 'nor-and', name: 'NOR-NOR circuit', c: { inputs: ['A', 'B', 'C'], gates: [{ id: 'G1', type: 'NOR', in: ['A', 'B'] }, { id: 'G2', type: 'NOR', in: ['G1', 'C'] }], output: 'G2' } },
  { id: 'half', name: 'Half adder sum (XOR, extension)', c: { inputs: ['A', 'B'], gates: [{ id: 'G1', type: 'XOR', in: ['A', 'B'] }], output: 'G1' } },
];

export function LogicSimulator() {
  const [circuit, setCircuit] = useState<Circuit>(PRESETS[6].c);
  const [vals, setVals] = useState<Record<string, boolean>>({ A: true, B: false, C: true });
  const [mode, setMode] = useState<'sim' | 'quiz'>('sim');
  const result = useMemo(() => {
    try {
      return { ok: true as const, nodes: evaluate(circuit, Object.fromEntries(circuit.inputs.map((i) => [i, !!vals[i]]))), table: truthTable(circuit) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [circuit, vals]);

  const setGate = (id: string, patch: Partial<GateNode>) =>
    setCircuit((c) => ({
      ...c,
      gates: c.gates.map((g) => {
        if (g.id !== id) return g;
        const next = { ...g, ...patch };
        const need = GATE_INFO[next.type].inputs;
        next.in = next.in.slice(0, need);
        while (next.in.length < need) next.in.push(c.inputs[0]);
        return next;
      }),
    }));
  const addGate = () =>
    setCircuit((c) => {
      const id = `G${Math.max(0, ...c.gates.map((g) => Number(g.id.slice(1)))) + 1}`;
      return { ...c, gates: [...c.gates, { id, type: 'AND', in: [c.output, c.inputs[c.inputs.length - 1]] }], output: id };
    });
  const removeGate = (id: string) =>
    setCircuit((c) => {
      const gates = c.gates.filter((g) => g.id !== id).map((g) => ({ ...g, in: g.in.map((x) => (x === id ? c.inputs[0] : x)) }));
      return { ...c, gates, output: c.output === id ? gates[gates.length - 1]?.id ?? c.inputs[0] : c.output };
    });
  const setInputs = (n: number) => setCircuit((c) => {
    const inputs = ['A', 'B', 'C'].slice(0, n);
    return { ...c, inputs, gates: c.gates.map((g) => ({ ...g, in: g.in.map((x) => (/^[A-C]$/.test(x) && !inputs.includes(x) ? inputs[0] : x)) })) };
  });

  return (
    <Card title="Logic gate simulator" subtitle="Click the inputs to toggle them. Build your own circuit below — the truth table updates automatically.">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Select label="Load a circuit" value="" onChange={(id) => { const p = PRESETS.find((x) => x.id === id); if (p) setCircuit(JSON.parse(JSON.stringify(p.c))); }} options={[{ value: '', label: 'Choose a preset…' }, ...PRESETS.map((p) => ({ value: p.id, label: p.name }))]} className="min-w-[240px]" />
        <Tabs size="sm" value={String(circuit.inputs.length) as '2' | '3'} onChange={(v) => setInputs(Number(v))} tabs={[{ id: '2', label: '2 inputs' }, { id: '3', label: '3 inputs' }]} />
        <Tabs size="sm" value={mode} onChange={setMode} tabs={[{ id: 'sim', label: 'Simulate' }, { id: 'quiz', label: 'Truth-table quiz' }]} />
      </div>
      {!result.ok ? (
        <Callout kind="warn">{result.error}</Callout>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Schematic circuit={circuit} nodes={result.nodes} onToggle={(i) => setVals((v) => ({ ...v, [i]: !v[i] }))} />
            <div className="rounded-lg border border-ink-200 p-3 dark:border-ink-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Circuit builder</span>
                <button className="btn text-xs" onClick={addGate} disabled={circuit.gates.length >= 6}><Plus size={13} /> Add gate</button>
              </div>
              <div className="space-y-2">
                {circuit.gates.map((g, idx) => {
                  const sources = [...circuit.inputs, ...circuit.gates.slice(0, idx).map((x) => x.id)];
                  return (
                    <div key={g.id} className="flex flex-wrap items-end gap-2">
                      <span className="mb-2 w-8 font-mono text-xs font-bold">{g.id}</span>
                      <Select value={g.type} onChange={(t) => setGate(g.id, { type: t as GateType })} options={(Object.keys(GATE_INFO) as GateType[]).map((t) => ({ value: t, label: `${t}${GATE_INFO[t].hsc ? '' : ' (ext.)'}` }))} className="w-28" />
                      {g.in.map((src, k) => (
                        <Select key={k} value={src} onChange={(s) => setGate(g.id, { in: g.in.map((x, j) => (j === k ? s : x)) })} options={sources.map((s) => ({ value: s, label: `in${k + 1}: ${s}` }))} className="w-28" />
                      ))}
                      <button className="btn btn-ghost mb-0.5 px-2" onClick={() => removeGate(g.id)} disabled={circuit.gates.length <= 1} aria-label={`Remove ${g.id}`}><Trash2 size={14} /></button>
                    </div>
                  );
                })}
                <Select label="Circuit output Q is" value={circuit.output} onChange={(o) => setCircuit((c) => ({ ...c, output: o }))} options={circuit.gates.map((g) => ({ value: g.id, label: g.id }))} className="w-40" />
              </div>
              <p className="mt-2 text-xs text-ink-500">Gates can only take inputs from A–C or earlier gates, so feedback loops (sequential circuits) are not possible — this simulator covers combinational logic.</p>
            </div>
          </div>
          <div className="space-y-3">
            {mode === 'sim' ? <TruthTable circuit={circuit} rows={result.table} current={circuit.inputs.map((i) => !!vals[i])} /> : <TruthQuiz circuit={circuit} rows={result.table} />}
            <div className="space-y-1 text-xs">
              {(['AND', 'OR', 'NAND', 'NOR', 'NOT'] as GateType[]).map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Badge tone="telecom">{t}</Badge>
                  <M>{GATE_INFO[t].expr}</M>
                  <span className="text-ink-500">{GATE_INFO[t].desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function TruthTable({ circuit, rows, current }: { circuit: Circuit; rows: ReturnType<typeof truthTable>; current: boolean[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="tbl text-center font-mono">
        <thead>
          <tr>
            {circuit.inputs.map((i) => <th key={i} className="text-center">{i}</th>)}
            {circuit.gates.filter((g) => g.id !== circuit.output).map((g) => <th key={g.id} className="text-center text-[10px]">{g.id}</th>)}
            <th className="text-center">Q</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => {
            const isCur = r.inputs.every((v, i) => v === current[i]);
            return (
              <tr key={k} className={cx(isCur && 'bg-violet-100 dark:bg-violet-950/60')}>
                {r.inputs.map((v, i) => <td key={i}>{v ? 1 : 0}</td>)}
                {circuit.gates.filter((g) => g.id !== circuit.output).map((g) => <td key={g.id} className="text-ink-400">{r.nodes[g.id] ? 1 : 0}</td>)}
                <td className={cx('font-bold', r.output ? 'text-emerald-600' : 'text-ink-500')}>{r.output ? 1 : 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-ink-500">Highlighted row = current input switches. Intermediate gate outputs shown in grey.</p>
    </div>
  );
}

function TruthQuiz({ circuit, rows }: { circuit: Circuit; rows: ReturnType<typeof truthTable> }) {
  const [ans, setAns] = useState<Record<number, boolean | undefined>>({});
  const [checked, setChecked] = useState(false);
  const key = circuit.gates.map((g) => g.type + g.in.join()).join('|');
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setAns({});
    setChecked(false);
  }
  const score = rows.filter((r, k) => ans[k] === r.output).length;
  return (
    <div>
      <p className="mb-2 text-xs text-ink-500">Predict Q for every row, then check. Click a cell to cycle ? → 0 → 1.</p>
      <table className="tbl text-center font-mono">
        <thead>
          <tr>
            {circuit.inputs.map((i) => <th key={i} className="text-center">{i}</th>)}
            <th className="text-center">Your Q</th>
            {checked && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k}>
              {r.inputs.map((v, i) => <td key={i}>{v ? 1 : 0}</td>)}
              <td>
                <button className="w-10 rounded border border-ink-300 py-0.5 dark:border-ink-600" onClick={() => (setChecked(false), setAns((a) => ({ ...a, [k]: a[k] === undefined ? false : a[k] === false ? true : undefined })))}>
                  {ans[k] === undefined ? '?' : ans[k] ? 1 : 0}
                </button>
              </td>
              {checked && <td>{ans[k] === r.output ? <CheckCircle2 size={16} className="inline text-emerald-600" /> : <XCircle size={16} className="inline text-red-500" />}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-2">
        <button className="btn btn-primary text-xs" onClick={() => setChecked(true)}>Check answers</button>
        {checked && <Badge tone={score === rows.length ? 'emerald' : 'amber'}>{score}/{rows.length} correct</Badge>}
      </div>
    </div>
  );
}

/** Draws gates in layers with ANSI-style symbols; wires are green when HIGH (1). */
function Schematic({ circuit, nodes, onToggle }: { circuit: Circuit; nodes: Record<string, boolean>; onToggle: (i: string) => void }) {
  const depth = layers(circuit);
  const maxD = Math.max(1, ...circuit.gates.map((g) => depth[g.id]));
  const W = 640;
  const colW = (W - 140) / (maxD + 0.5);
  const byLayer: Record<number, string[]> = {};
  for (const g of circuit.gates) (byLayer[depth[g.id]] ??= []).push(g.id);
  const H = Math.max(200, Math.max(circuit.inputs.length, ...Object.values(byLayer).map((l) => l.length)) * 80 + 40);
  const pos: Record<string, { x: number; y: number }> = {};
  circuit.inputs.forEach((i, k) => (pos[i] = { x: 50, y: ((k + 1) * H) / (circuit.inputs.length + 1) }));
  for (const [d, ids] of Object.entries(byLayer)) ids.forEach((id, k) => (pos[id] = { x: 70 + Number(d) * colW, y: ((k + 1) * H) / (ids.length + 1) }));
  const hi = (v: boolean) => (v ? '#10b981' : '#94a3b8');
  const out = (id: string) => (circuit.inputs.includes(id) ? { x: pos[id].x + 16, y: pos[id].y } : { x: pos[id].x + 70, y: pos[id].y });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram rounded-lg border border-ink-200 dark:border-ink-800" role="img" aria-label="Logic circuit schematic">
      {circuit.gates.map((g) =>
        g.in.map((src, k) => {
          const a = out(src);
          const n = g.in.length;
          const b = { x: pos[g.id].x, y: pos[g.id].y + (n === 1 ? 0 : k === 0 ? -12 : 12) };
          const mx = (a.x + b.x) / 2;
          return <path key={g.id + k} d={`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`} fill="none" stroke={hi(nodes[src])} strokeWidth={2.5} />;
        }),
      )}
      {circuit.gates.map((g) => (
        <GateSymbol key={g.id} type={g.type} x={pos[g.id].x} y={pos[g.id].y} on={nodes[g.id]} label={g.id} />
      ))}
      {circuit.inputs.map((i) => (
        <g key={i} onClick={() => onToggle(i)} className="cursor-pointer" role="button" aria-label={`Toggle input ${i}`}>
          <rect x={pos[i].x - 34} y={pos[i].y - 16} width={50} height={32} rx={8} fill={nodes[i] ? '#10b981' : 'var(--diagram-bg)'} stroke={COL.ink} strokeWidth={1.5} />
          <text x={pos[i].x - 9} y={pos[i].y + 5} fontSize={13} fontWeight={700} textAnchor="middle" fill={nodes[i] ? 'white' : COL.ink}>{i}={nodes[i] ? 1 : 0}</text>
        </g>
      ))}
      {(() => {
        const o = out(circuit.output);
        return (
          <g>
            <line x1={o.x} y1={o.y} x2={W - 40} y2={o.y} stroke={hi(nodes[circuit.output])} strokeWidth={2.5} />
            <circle cx={W - 26} cy={o.y} r={14} fill={nodes[circuit.output] ? '#10b981' : 'var(--diagram-bg)'} stroke={COL.ink} strokeWidth={1.5} />
            <text x={W - 26} y={o.y + 4} fontSize={11} fontWeight={700} textAnchor="middle" fill={nodes[circuit.output] ? 'white' : COL.ink}>Q={nodes[circuit.output] ? 1 : 0}</text>
          </g>
        );
      })()}
    </svg>
  );
}

function GateSymbol({ type, x, y, on, label }: { type: GateType; x: number; y: number; on: boolean; label: string }) {
  const fill = on ? 'rgba(16,185,129,0.15)' : 'var(--diagram-bg)';
  const stroke = COL.ink;
  const bubble = type === 'NAND' || type === 'NOR' || type === 'NOT' || type === 'XNOR';
  const bodyEnd = bubble ? 62 : 70;
  let body: string;
  if (type === 'AND' || type === 'NAND') body = `M ${x} ${y - 22} L ${x + 34} ${y - 22} A 22 22 0 0 1 ${x + 34} ${y + 22} L ${x} ${y + 22} Z`;
  else if (type === 'NOT') body = `M ${x} ${y - 20} L ${x + 56} ${y} L ${x} ${y + 20} Z`;
  else body = `M ${x} ${y - 22} Q ${x + 14} ${y} ${x} ${y + 22} Q ${x + 40} ${y + 22} ${x + bodyEnd - (bubble ? 2 : 4)} ${y} Q ${x + 40} ${y - 22} ${x} ${y - 22} Z`;
  return (
    <g>
      {(type === 'XOR' || type === 'XNOR') && <path d={`M ${x - 7} ${y - 22} Q ${x + 7} ${y} ${x - 7} ${y + 22}`} fill="none" stroke={stroke} strokeWidth={1.8} />}
      <path d={body} fill={fill} stroke={stroke} strokeWidth={1.8} />
      {bubble && <circle cx={x + (type === 'NOT' ? 61 : 62)} cy={y} r={5} fill="var(--diagram-bg)" stroke={stroke} strokeWidth={1.8} />}
      {!bubble && <line x1={x + (type === 'AND' ? 56 : 66)} x2={x + 70} y1={y} y2={y} stroke={on ? '#10b981' : '#94a3b8'} strokeWidth={2.5} />}
      <text x={x + 24} y={y + 4} fontSize={9.5} textAnchor="middle" fill={COL.ink} fontWeight={700}>{type}</text>
      <text x={x + 24} y={y - 28} fontSize={9.5} textAnchor="middle" fill={COL.muted}>{label}</text>
    </g>
  );
}
