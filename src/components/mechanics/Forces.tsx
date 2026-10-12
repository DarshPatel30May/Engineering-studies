import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { resolveForce, resultant, equilibrant } from '@/lib/calc/statics';
import { sig, fixed } from '@/lib/calc/format';
import { Arrow, Label, COL } from '../diagrams/svg';
import { Card, Slider, Stat, M, Tabs, Callout, ErrorList } from '../ui';

const deg = Math.PI / 180;

export function ForceResolution() {
  const [F, setF] = useState(50);
  const [th, setTh] = useState(35);
  const { Fx, Fy } = resolveForce(F, th);
  const W = 420;
  const H = 320;
  const ox = 200;
  const oy = 170;
  const s = 2.2;
  const tx = ox + Fx * s;
  const ty = oy - Fy * s;
  const quadrant = th <= 90 ? 'I' : th <= 180 ? 'II' : th <= 270 ? 'III' : 'IV';
  return (
    <Card title="Force resolution" subtitle="Drag the sliders — components update instantly">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram max-h-[380px]" role="img" aria-label="Force vector and its components">
          <line x1={20} x2={W - 20} y1={oy} y2={oy} stroke={COL.muted} strokeWidth={1} />
          <line x1={ox} x2={ox} y1={20} y2={H - 20} stroke={COL.muted} strokeWidth={1} />
          <text x={W - 24} y={oy - 6} fontSize={11} fill={COL.muted} textAnchor="end">+x</text>
          <text x={ox + 6} y={28} fontSize={11} fill={COL.muted}>+y</text>
          <line x1={tx} y1={ty} x2={tx} y2={oy} stroke={COL.muted} strokeDasharray="4 3" />
          <line x1={tx} y1={ty} x2={ox} y2={ty} stroke={COL.muted} strokeDasharray="4 3" />
          <Arrow x1={ox} y1={oy} x2={tx} y2={oy} color="#0ea5e9" w={3} />
          <Arrow x1={ox} y1={oy} x2={ox} y2={ty} color="#8b5cf6" w={3} />
          <Arrow x1={ox} y1={oy} x2={tx} y2={ty} color={COL.load} w={3.5} />
          <path d={`M ${ox + 34} ${oy} A 34 34 0 ${th > 180 ? 1 : 0} 0 ${ox + 34 * Math.cos(th * deg)} ${oy - 34 * Math.sin(th * deg)}`} fill="none" stroke={COL.ink} strokeWidth={1.2} />
          <Label x={ox + 46 * Math.cos((th / 2) * deg)} y={oy - 46 * Math.sin((th / 2) * deg) + 4} size={12} bg>
            θ = {th}°
          </Label>
          <Label x={tx + (Fx >= 0 ? 8 : -8)} y={ty - 8} anchor={Fx >= 0 ? 'start' : 'end'} color={COL.load} weight={700} bg>
            F = {F} N
          </Label>
          <Label x={(ox + tx) / 2} y={oy + (Fy >= 0 ? 18 : -10)} color="#0284c7" weight={700} bg>
            Fx = {sig(Fx, 4)}
          </Label>
          <Label x={ox + (Fx >= 0 ? -8 : 8)} y={(oy + ty) / 2} anchor={Fx >= 0 ? 'end' : 'start'} color="#7c3aed" weight={700} bg>
            Fy = {sig(Fy, 4)}
          </Label>
        </svg>
        <div className="space-y-3">
          <Slider label="Magnitude F" value={F} min={0} max={60} step={1} unit="N" onChange={setF} />
          <Slider label="Angle θ (anticlockwise from +x)" value={th} min={0} max={360} step={1} unit="°" onChange={setTh} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Fx" value={sig(Fx, 4)} unit="N" tone="blue" />
            <Stat label="Fy" value={sig(Fy, 4)} unit="N" />
          </div>
          <div className="rounded-lg bg-ink-50 p-2 dark:bg-ink-950/50">
            <M block>{`F_x = F\\cos\\theta = ${F}\\cos ${th}^\\circ = ${sig(Fx, 4)}\\ \\text{N}`}</M>
            <M block>{`F_y = F\\sin\\theta = ${F}\\sin ${th}^\\circ = ${sig(Fy, 4)}\\ \\text{N}`}</M>
          </div>
          <p className="prose-only text-xs text-ink-500">
            Quadrant {quadrant}: signs of cos θ and sin θ automatically give the component directions. Check: √(Fx² + Fy²) = {sig(Math.hypot(Fx, Fy), 4)} N.
          </p>
        </div>
      </div>
    </Card>
  );
}

interface F2 {
  id: number;
  F: number;
  a: number;
}

export function EquilibriumSolver() {
  const [tab, setTab] = useState<'concurrent' | 'cables'>('concurrent');
  return (
    <Card title="Equilibrium solver" subtitle="Free-body diagrams, resultants and the conditions ΣFx = 0, ΣFy = 0">
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { id: 'concurrent', label: 'Concurrent forces → resultant & equilibrant' },
          { id: 'cables', label: 'Load hung from two cables' },
        ]}
      />
      {tab === 'concurrent' ? <Concurrent /> : <TwoCables />}
    </Card>
  );
}

function Concurrent() {
  const [forces, setForces] = useState<F2[]>([
    { id: 1, F: 40, a: 20 },
    { id: 2, F: 30, a: 120 },
    { id: 3, F: 25, a: 250 },
  ]);
  const r = resultant(forces.map((f) => ({ F: f.F, angleDeg: f.a })));
  const e = equilibrant(forces.map((f) => ({ F: f.F, angleDeg: f.a })));
  const W = 640;
  const H = 320;
  const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];
  const s = 2.4;
  // Free-body diagram (left) and force polygon (right)
  const ox = 160;
  const oy = 160;
  let px = 400;
  let py = 230;
  const poly: { x1: number; y1: number; x2: number; y2: number; c: string; i: number }[] = [];
  const allPts: [number, number][] = [[0, 0]];
  let cx = 0;
  let cy = 0;
  forces.forEach((f) => {
    cx += f.F * Math.cos(f.a * deg);
    cy += f.F * Math.sin(f.a * deg);
    allPts.push([cx, cy]);
  });
  const minX = Math.min(...allPts.map((p) => p[0]));
  const maxX = Math.max(...allPts.map((p) => p[0]));
  const minY = Math.min(...allPts.map((p) => p[1]));
  const maxY = Math.max(...allPts.map((p) => p[1]));
  const ps = Math.min(200 / Math.max(1, maxX - minX), 240 / Math.max(1, maxY - minY), 2.4);
  px = 420 - ((minX + maxX) / 2) * ps;
  py = 160 + ((minY + maxY) / 2) * ps;
  let qx = px;
  let qy = py;
  forces.forEach((f, i) => {
    const nx = qx + f.F * Math.cos(f.a * deg) * ps;
    const ny = qy - f.F * Math.sin(f.a * deg) * ps;
    poly.push({ x1: qx, y1: qy, x2: nx, y2: ny, c: colors[i % colors.length], i });
    qx = nx;
    qy = ny;
  });
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Free-body diagram and force polygon">
          <text x={20} y={22} fontSize={12} fontWeight={600} fill={COL.ink}>
            Free-body diagram
          </text>
          <text x={330} y={22} fontSize={12} fontWeight={600} fill={COL.ink}>
            Force polygon (graphical method, tip-to-tail)
          </text>
          <line x1={310} x2={310} y1={10} y2={H - 10} stroke={COL.muted} strokeOpacity={0.3} />
          <circle cx={ox} cy={oy} r={5} fill={COL.ink} />
          {forces.map((f, i) => (
            <g key={f.id}>
              <Arrow x1={ox} y1={oy} x2={ox + f.F * Math.cos(f.a * deg) * s} y2={oy - f.F * Math.sin(f.a * deg) * s} color={colors[i % colors.length]} w={2.6} />
              <Label x={ox + f.F * Math.cos(f.a * deg) * s * 1.12} y={oy - f.F * Math.sin(f.a * deg) * s * 1.12 + 4} size={11} weight={700} color={colors[i % colors.length]} bg>
                F{i + 1}
              </Label>
            </g>
          ))}
          {r.R > 1e-6 && <Arrow x1={ox} y1={oy} x2={ox + r.Rx * s} y2={oy - r.Ry * s} color={COL.compression} w={2} dashed />}
          {poly.map((p) => (
            <Arrow key={p.i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} color={p.c} w={2.6} />
          ))}
          {r.R > 1e-6 && (
            <>
              <Arrow x1={px} y1={py} x2={qx} y2={qy} color={COL.compression} w={2.2} dashed />
              <Label x={(px + qx) / 2 + 8} y={(py + qy) / 2} anchor="start" size={11} color={COL.compression} weight={700} bg>
                R (closing side)
              </Label>
            </>
          )}
          {r.R < 0.5 && (
            <Label x={470} y={290} size={12} color={COL.reaction} weight={700}>
              Polygon closes → equilibrium
            </Label>
          )}
        </svg>
        <p className="prose-only mt-1 text-xs text-ink-500">
          Graphical mechanics: draw the forces to scale, tip-to-tail. The line from the start to the end is the resultant; the equilibrant closes the polygon in the opposite sense. If the polygon closes by itself, ΣF = 0.
        </p>
      </div>
      <div className="space-y-3">
        {forces.map((f, i) => (
          <div key={f.id} className="rounded-lg border border-ink-200 p-2 dark:border-ink-700">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold" style={{ color: colors[i % colors.length] }}>
              F{i + 1}
              <button className="btn btn-ghost px-1.5 py-0.5" onClick={() => setForces((fs) => fs.filter((x) => x.id !== f.id))} disabled={forces.length <= 2} aria-label={`Remove F${i + 1}`}>
                <Trash2 size={13} />
              </button>
            </div>
            <Slider label="Magnitude" value={f.F} min={0} max={60} unit="N" onChange={(v) => setForces((fs) => fs.map((x) => (x.id === f.id ? { ...x, F: v } : x)))} />
            <Slider label="Angle" value={f.a} min={0} max={359} unit="°" onChange={(v) => setForces((fs) => fs.map((x) => (x.id === f.id ? { ...x, a: v } : x)))} />
          </div>
        ))}
        <button className="btn w-full" disabled={forces.length >= 5} onClick={() => setForces((fs) => [...fs, { id: Date.now(), F: 20, a: 300 }])}>
          <Plus size={14} /> Add force
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="ΣFx" value={sig(r.Rx, 4)} unit="N" />
          <Stat label="ΣFy" value={sig(r.Ry, 4)} unit="N" />
          <Stat label="Resultant R" value={sig(r.R, 4)} unit="N" tone="red" sub={`at ${fixed(r.angleDeg, 1)}°`} />
          <Stat label="Equilibrant E" value={sig(e.E, 4)} unit="N" tone="emerald" sub={`at ${fixed(e.angleDeg, 1)}°`} />
        </div>
        <M block>{`R = \\sqrt{(\\Sigma F_x)^2 + (\\Sigma F_y)^2} = ${sig(r.R, 4)}\\ \\text{N}`}</M>
      </div>
    </div>
  );
}

function TwoCables() {
  const [W, setW] = useState(500);
  const [a, setA] = useState(40);
  const [b, setB] = useState(55);
  const valid = a > 0 && b > 0 && a < 90 && b < 90;
  const T1 = (W * Math.cos(b * deg)) / Math.sin((a + b) * deg);
  const T2 = (W * Math.cos(a * deg)) / Math.sin((a + b) * deg);
  const SW = 640;
  const H = 300;
  const kx = 320;
  const ky = 170;
  const Lc = 170;
  const p1 = { x: kx - Lc * Math.cos(a * deg), y: ky - Lc * Math.sin(a * deg) };
  const p2 = { x: kx + Lc * Math.cos(b * deg), y: ky - Lc * Math.sin(b * deg) };
  const ceil = Math.min(p1.y, p2.y) - 4;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <svg viewBox={`0 0 ${SW} ${H}`} className="diagram" role="img" aria-label="Load hung from two cables">
        <line x1={p1.x - 30} x2={p1.x + 20} y1={p1.y} y2={p1.y} stroke={COL.ink} strokeWidth={2} />
        <line x1={p2.x - 20} x2={p2.x + 30} y1={p2.y} y2={p2.y} stroke={COL.ink} strokeWidth={2} />
        <line x1={kx} y1={ky} x2={p1.x} y2={p1.y} stroke={COL.tension} strokeWidth={3} />
        <line x1={kx} y1={ky} x2={p2.x} y2={p2.y} stroke={COL.tension} strokeWidth={3} />
        <line x1={kx} y1={ky} x2={kx} y2={ky + 50} stroke={COL.ink} strokeWidth={2} />
        <rect x={kx - 30} y={ky + 50} width={60} height={40} rx={3} fill={COL.muted} opacity={0.35} stroke={COL.ink} />
        <text x={kx} y={ky + 75} fontSize={12} textAnchor="middle" fontWeight={700} fill={COL.ink}>
          {W} N
        </text>
        <line x1={kx - 70} x2={kx + 70} y1={ky} y2={ky} stroke={COL.muted} strokeDasharray="3 3" />
        <Label x={kx - 60} y={ky - 8} size={11} bg>α = {a}°</Label>
        <Label x={kx + 60} y={ky - 8} size={11} bg>β = {b}°</Label>
        <Label x={(kx + p1.x) / 2 - 10} y={(ky + p1.y) / 2 - 6} anchor="end" color={COL.tension} weight={700} bg>
          T₁ = {valid ? sig(T1, 4) : '—'} N
        </Label>
        <Label x={(kx + p2.x) / 2 + 10} y={(ky + p2.y) / 2 - 6} anchor="start" color={COL.tension} weight={700} bg>
          T₂ = {valid ? sig(T2, 4) : '—'} N
        </Label>
        <text x={20} y={Math.max(20, ceil - 6)} fontSize={11} fill={COL.muted}>
          Joint K is in equilibrium under T₁, T₂ and W
        </text>
      </svg>
      <div className="space-y-3">
        <Slider label="Weight W" value={W} min={0} max={1000} step={10} unit="N" onChange={setW} />
        <Slider label="Cable 1 angle α (from horizontal)" value={a} min={5} max={85} unit="°" onChange={setA} />
        <Slider label="Cable 2 angle β (from horizontal)" value={b} min={5} max={85} unit="°" onChange={setB} />
        {!valid ? (
          <ErrorList errors={['Angles must be between 0° and 90°.']} />
        ) : (
          <>
            <div className="rounded-lg bg-ink-50 p-2 text-sm dark:bg-ink-950/50">
              <M block>{`\\Sigma F_x = 0:\\ T_2\\cos\\beta - T_1\\cos\\alpha = 0`}</M>
              <M block>{`\\Sigma F_y = 0:\\ T_1\\sin\\alpha + T_2\\sin\\beta - W = 0`}</M>
              <M block>{`T_1 = \\dfrac{W\\cos\\beta}{\\sin(\\alpha+\\beta)} = ${sig(T1, 4)}\\ \\text{N}`}</M>
              <M block>{`T_2 = \\dfrac{W\\cos\\alpha}{\\sin(\\alpha+\\beta)} = ${sig(T2, 4)}\\ \\text{N}`}</M>
            </div>
            <p className="text-xs text-ink-500">
              Check ΣFy: {sig(T1 * Math.sin(a * deg) + T2 * Math.sin(b * deg) - W, 3)} N ✓. Note how tensions grow rapidly as the cables flatten — which is why washing lines and power lines sag.
            </p>
          </>
        )}
        <Callout kind="assume">Weightless, inextensible cables; all forces meet at joint K (concurrent).</Callout>
      </div>
    </div>
  );
}
